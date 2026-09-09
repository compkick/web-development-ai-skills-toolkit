import { AUDIT_USER_AGENT, DEFAULT_LAUNCH_LINK_CHECK_LIMIT } from "../config/runtime-config.mjs";

const REGION_PRIORITY = new Map([["navigation", 0], ["header", 1], ["footer", 2], ["main", 3], ["other", 4]]);
const INCONCLUSIVE_STATUSES = new Set([401, 403, 429]);

export async function probeHomepageLinks(candidates, targetUrl, timeoutMs, userAgent = AUDIT_USER_AGENT, limit = DEFAULT_LAUNCH_LINK_CHECK_LIMIT) {
  const authorizedUrl = new URL(targetUrl);
  const eligible = [];

  for (const candidate of candidates) {
    let candidateUrl;

    try {
      candidateUrl = new URL(candidate.url, authorizedUrl);
    } catch {
      continue;
    }

    if (!new Set(["http:", "https:"]).has(candidateUrl.protocol) || candidateUrl.hostname !== authorizedUrl.hostname) continue;
    candidateUrl.hash = "";
    eligible.push({ ...candidate, requestUrl: candidateUrl });
  }

  eligible.sort((left, right) => (REGION_PRIORITY.get(left.region) ?? 9) - (REGION_PRIORITY.get(right.region) ?? 9));

  const unique = [];
  const byUrl = new Map();

  for (const candidate of eligible) {
    const existing = byUrl.get(candidate.requestUrl.href);
    if (existing) {
      if (!existing.regions.includes(candidate.region)) existing.regions.push(candidate.region);
      continue;
    }
    const destination = { ...candidate, regions: [candidate.region] };
    byUrl.set(candidate.requestUrl.href, destination);
    unique.push(destination);
  }

  const selected = unique.slice(0, limit);
  const results = [];

  for (const candidate of selected) {
    results.push(await probeLink(candidate, authorizedUrl, timeoutMs, userAgent));
  }

  return {
    byRegion: Object.fromEntries([...REGION_PRIORITY.keys()].map((region) => {
      const candidateCount = unique.filter((candidate) => candidate.regions.includes(region)).length;
      const tested = selected.filter((candidate) => candidate.regions.includes(region)).length;
      return [region, { candidateCount, skippedByLimit: candidateCount - tested, tested }];
    })),
    candidateCount: unique.length,
    failed: results.filter((result) => result.outcome === "fail").length,
    limit,
    passed: results.filter((result) => result.outcome === "pass").length,
    results,
    skippedByLimit: Math.max(0, unique.length - selected.length),
    tested: results.length,
    warnings: results.filter((result) => result.outcome === "warning").length
  };
}

async function probeLink(candidate, authorizedUrl, timeoutMs, userAgent) {
  const chain = [];
  const seen = new Set();
  let currentUrl = new URL(candidate.requestUrl);

  try {
    for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
      if (seen.has(currentUrl.href)) return buildResult(candidate, currentUrl, chain, "fail", "Redirect loop detected.");
      seen.add(currentUrl.href);

      const response = await fetch(currentUrl, {
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          range: "bytes=0-0",
          "user-agent": userAgent
        },
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs)
      });
      await response.body?.cancel();
      const location = response.headers.get("location");
      const entry = { status: response.status, url: sanitizeUrl(currentUrl) };

      if (location && response.status >= 300 && response.status < 400) {
        const nextUrl = new URL(location, currentUrl);
        entry.location = sanitizeUrl(nextUrl);
        chain.push(entry);

        if (nextUrl.hostname !== authorizedUrl.hostname) {
          return buildResult(candidate, currentUrl, chain, "warning", "The link redirected outside the authorized hostname; the external destination was not requested.");
        }

        currentUrl = nextUrl;
        continue;
      }

      chain.push(entry);

      if (response.status >= 200 && response.status < 400) return buildResult(candidate, currentUrl, chain, "pass", "The same-host link returned a successful response.");
      if (INCONCLUSIVE_STATUSES.has(response.status)) return buildResult(candidate, currentUrl, chain, "warning", `The link returned ${response.status}; access controls or automated-request handling may have affected the result.`);
      if (response.status >= 400) return buildResult(candidate, currentUrl, chain, "fail", `The link returned ${response.status}.`);
      return buildResult(candidate, currentUrl, chain, "warning", `The link returned the unexpected status ${response.status}.`);
    }

    return buildResult(candidate, currentUrl, chain, "fail", "The link returned more than five redirects.");
  } catch (error) {
    return buildResult(candidate, currentUrl, chain, "warning", truncate(error.message, 300));
  }
}

function buildResult(candidate, finalUrl, chain, outcome, assessment) {
  return {
    assessment,
    finalUrl: sanitizeUrl(finalUrl),
    initialUrl: sanitizeUrl(candidate.requestUrl),
    outcome,
    region: candidate.region,
    regions: candidate.regions,
    text: truncate(candidate.text || "(no link text)", 120),
    chain
  };
}

function sanitizeUrl(value) {
  const url = new URL(value);
  url.username = "";
  url.password = "";

  for (const [name] of url.searchParams) {
    if (/(?:access|auth|code|credential|key|password|secret|session|signature|token)/i.test(name)) url.searchParams.set(name, "[redacted]");
  }

  return url.href;
}

function truncate(value, maximumLength) {
  const normalized = String(value ?? "");
  if (normalized.length <= maximumLength) return normalized;
  return `${normalized.slice(0, maximumLength - 1)}…`;
}
