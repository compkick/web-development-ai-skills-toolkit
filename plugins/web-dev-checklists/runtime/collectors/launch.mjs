import { probeHomepageLinks } from "./homepage-links.mjs";

export async function collectLaunchEvidence({ page, requestedUrl, response, timeoutMs, sharedHttpRedirect }) {
  const finalUrl = new URL(page.url());
  const browserUserAgent = await page.evaluate(() => navigator.userAgent);
  const responseHeaders = response ? await response.allHeaders() : {};
  const documentLaunch = await page.evaluate(() => {
    const cleanText = (value, maximumLength = 160) => {
      const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
      return normalized.length <= maximumLength ? normalized : `${normalized.slice(0, maximumLength - 1)}…`;
    };
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    };
    const getRegion = (anchor) => {
      if (anchor.closest("footer, [role='contentinfo']")) return "footer";
      if (anchor.closest("nav, [role='navigation']")) return "navigation";
      if (anchor.closest("header, [role='banner']")) return "header";
      if (anchor.closest("main, [role='main']")) return "main";
      return "other";
    };
    const sanitizeForEvidence = (value) => {
      try {
        const url = new URL(value, document.baseURI);
        url.username = "";
        url.password = "";
        for (const [name] of url.searchParams) {
          if (/(?:access|auth|code|credential|key|password|secret|session|signature|token)/i.test(name)) url.searchParams.set(name, "[redacted]");
        }
        return cleanText(url.href, 300);
      } catch {
        return cleanText(value, 300);
      }
    };
    const regions = {
      footerCount: document.querySelectorAll("footer, [role='contentinfo']").length,
      headerCount: document.querySelectorAll("header, [role='banner']").length,
      mainCount: document.querySelectorAll("main, [role='main']").length,
      navigationCount: document.querySelectorAll("nav, [role='navigation']").length,
      visibleLinkCounts: { footer: 0, header: 0, main: 0, navigation: 0, other: 0 }
    };
    const inventory = { externalHttp: 0, internalHttp: 0, issueCount: 0, nonHttp: 0, probeEligible: 0, totalAnchors: document.querySelectorAll("a").length, visibleAnchors: 0 };
    const issues = [];
    const testCandidates = [];
    const issueCountsByRegion = Object.fromEntries(Object.keys(regions.visibleLinkCounts).map((region) => [region, 0]));
    const testCandidatesTruncatedByRegion = { ...issueCountsByRegion };

    for (const anchor of document.querySelectorAll("a")) {
      if (!isVisible(anchor)) continue;
      inventory.visibleAnchors += 1;
      const region = getRegion(anchor);
      regions.visibleLinkCounts[region] += 1;
      const text = cleanText(anchor.textContent || anchor.getAttribute("aria-label") || anchor.querySelector("img")?.getAttribute("alt")) || "(no link text)";
      const rawHref = anchor.getAttribute("href");
      const href = rawHref?.trim() ?? "";
      let issue = null;

      if (rawHref === null || href === "") issue = "The link does not have a destination.";
      else if (href === "#") issue = "The link uses an unset # destination.";
      else if (/^javascript:/i.test(href)) issue = "The link uses a JavaScript URL and needs review as a navigation control.";
      else if (href.startsWith("#")) {
        let fragmentId = "";
        try { fragmentId = decodeURIComponent(href.slice(1)); } catch { fragmentId = href.slice(1); }
        if (!fragmentId || !document.getElementById(fragmentId) && document.getElementsByName(fragmentId).length === 0) issue = "The same-page link does not match an element id or named anchor.";
      } else if (/^mailto:/i.test(href) && !href.slice(7).split("?")[0].trim()) issue = "The email link does not contain an address.";
      else if (/^tel:/i.test(href) && !href.slice(4).replace(/[^0-9+]/g, "")) issue = "The telephone link does not contain a number.";

      let resolvedUrl = null;
      try { resolvedUrl = new URL(href, document.baseURI); } catch { if (!issue) issue = "The link destination is not a valid URL."; }

      if (issue) {
        inventory.issueCount += 1;
        issueCountsByRegion[region] += 1;
        if (issues.length < 100) issues.push({ href: href ? sanitizeForEvidence(href) : "(empty)", issue, region, text });
      }

      if (!resolvedUrl || !new Set(["http:", "https:"]).has(resolvedUrl.protocol)) {
        if (href && !href.startsWith("#")) inventory.nonHttp += 1;
        continue;
      }

      if (resolvedUrl.hostname !== location.hostname) {
        inventory.externalHttp += 1;
        continue;
      }
      inventory.internalHttp += 1;

      if (!issue && !href.startsWith("#")) {
        inventory.probeEligible += 1;
        if (testCandidates.length < 500) testCandidates.push({ region, text, url: resolvedUrl.href });
        else testCandidatesTruncatedByRegion[region] += 1;
      }
    }

    const metaRobots = [...document.querySelectorAll("meta[name='robots' i], meta[name='googlebot' i]")].map((element) => cleanText(element.getAttribute("content"), 300));

    return {
      content: {
        h1Text: [...document.querySelectorAll("h1")].filter(isVisible).slice(0, 5).map((heading) => cleanText(heading.textContent)),
        title: cleanText(document.title, 300)
      },
      inventory,
      issues,
      issueCountsByRegion,
      metaRobots,
      regions,
      testCandidateCount: testCandidates.length,
      testCandidates,
      testCandidatesTruncatedByRegion,
      testCandidatesTruncated: Math.max(0, inventory.probeEligible - testCandidates.length)
    };
  });
  const { testCandidates, ...documentEvidence } = documentLaunch;
  const xRobotsTag = responseHeaders["x-robots-tag"] ?? null;
  const robotsValues = [...documentLaunch.metaRobots, xRobotsTag].filter(Boolean).join(",").toLowerCase().split(/[\s,]+/).filter(Boolean);
  const [httpRedirect, linkProbe] = await Promise.all([
    sharedHttpRedirect(),
    probeHomepageLinks(testCandidates, finalUrl, timeoutMs, browserUserAgent)
  ]);

  return {
    document: documentEvidence,
    finalUrl: finalUrl.href,
    httpRedirect,
    indexing: { noindex: robotsValues.includes("noindex") || robotsValues.includes("none"), xRobotsTag },
    linkProbe,
    requestedUrl
  };
}
