import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SCREENSHOT_DIRECTORY = "axe-elements";

export async function captureAxeElementScreenshots(page, axeResult, outputDirectory, maximumScreenshots) {
  const candidates = [
    ...collectNodes(axeResult.violations, "violation"),
    ...collectNodes(axeResult.incomplete, "incomplete")
  ];
  const summary = { captured: 0, failed: 0, limit: maximumScreenshots, skippedByLimit: 0, totalCandidates: candidates.length, unsupported: 0 };

  if (candidates.length === 0 || maximumScreenshots === 0) {
    summary.skippedByLimit = candidates.length;
    return summary;
  }

  await mkdir(path.join(outputDirectory, SCREENSHOT_DIRECTORY), { recursive: true });

  for (let index = 0; index < candidates.length; index += 1) {
    const { category, node, ruleId } = candidates[index];

    if (index >= maximumScreenshots) {
      node.screenshot = { path: null, status: "limit-reached" };
      summary.skippedByLimit += 1;
      continue;
    }

    const selector = getSimpleTargetSelector(node.target);

    if (!selector) {
      node.screenshot = { path: null, status: "unsupported-target" };
      summary.unsupported += 1;
      continue;
    }

    const fileName = `${category}-${safeFilePart(ruleId)}-${String(index + 1).padStart(3, "0")}.png`;
    const relativePath = `${SCREENSHOT_DIRECTORY}/${fileName}`;

    try {
      const locator = page.locator(selector).first();

      if (await locator.count() === 0) {
        node.screenshot = { path: null, status: "element-not-found" };
        summary.failed += 1;
        continue;
      }

      await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
      await locator.screenshot({ animations: "disabled", path: path.join(outputDirectory, SCREENSHOT_DIRECTORY, fileName), timeout: 10000 });
      node.screenshot = { path: relativePath, status: "captured" };
      summary.captured += 1;
    } catch (error) {
      node.screenshot = { error: truncate(error.message, 200), path: null, status: "capture-failed" };
      summary.failed += 1;
    }
  }

  return summary;
}

export async function writeAxeHtmlReport(axeResult, outputPath) {
  const violationNodeCount = countNodes(axeResult.violations);
  const incompleteNodeCount = countNodes(axeResult.incomplete);
  const screenshotSummary = axeResult.elementScreenshots ?? { captured: 0, failed: 0, limit: 0, skippedByLimit: 0, totalCandidates: 0, unsupported: 0 };
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'">
  <title>axe accessibility report</title>
  <style>
    :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
    body { margin: 0; background: #f4f6f8; color: #17202a; }
    main { width: min(1120px, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4rem; }
    h1, h2, h3 { line-height: 1.2; }
    h1 { margin-bottom: .25rem; }
    a { color: #075985; }
    code { overflow-wrap: anywhere; }
    .lede, .meta, .note { color: #475569; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
    .metric, .rule { background: #fff; border: 1px solid #d8dee6; border-radius: .65rem; box-shadow: 0 1px 2px rgb(15 23 42 / 8%); }
    .metric { padding: 1rem; }
    .metric strong { display: block; font-size: 1.7rem; }
    .rule { margin: 1rem 0; padding: 1rem 1.25rem; }
    .rule-header { display: flex; flex-wrap: wrap; align-items: center; gap: .65rem; }
    .rule-header h3 { margin: 0; }
    .badge { border-radius: 999px; color: #fff; font-size: .75rem; font-weight: 700; padding: .15rem .55rem; text-transform: uppercase; }
    .badge-critical { background: #991b1b; }
    .badge-serious { background: #b45309; }
    .badge-moderate { background: #0369a1; }
    .badge-minor, .badge-unknown { background: #475569; }
    .node { border-top: 1px solid #e2e8f0; margin-top: 1rem; padding-top: 1rem; }
    .node img { background: #fff; border: 1px solid #cbd5e1; display: block; margin-top: .75rem; max-height: 420px; max-width: 100%; object-fit: contain; }
    .selector { background: #eef2f6; border-radius: .25rem; display: block; padding: .5rem; }
    .empty { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: .5rem; padding: 1rem; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a; color: #e2e8f0; }
      .metric, .rule { background: #172033; border-color: #334155; }
      .lede, .meta, .note { color: #b7c2d0; }
      a { color: #7dd3fc; }
      .node { border-color: #334155; }
      .selector { background: #273449; }
      .empty { background: #12352c; border-color: #166534; }
    }
  </style>
</head>
<body>
  <main>
    <h1>axe accessibility report</h1>
    <p class="lede">Automated evidence for <a href="${safeUrl(axeResult.url)}">${escapeHtml(axeResult.url)}</a>. Automated results do not replace manual accessibility testing.</p>
    <p class="meta">Scanned ${escapeHtml(formatDate(axeResult.timestamp))} with ${escapeHtml(axeResult.testEngine?.name ?? "axe-core")} ${escapeHtml(axeResult.testEngine?.version ?? "unknown")} at ${escapeHtml(axeResult.testEnvironment?.windowWidth ?? "unknown")} × ${escapeHtml(axeResult.testEnvironment?.windowHeight ?? "unknown")}.</p>
    <section class="summary" aria-label="Result summary">
      ${renderMetric("Violation rules", axeResult.violations.length)}
      ${renderMetric("Affected violation elements", violationNodeCount)}
      ${renderMetric("Incomplete rules", axeResult.incomplete.length)}
      ${renderMetric("Manual-review elements", incompleteNodeCount)}
      ${renderMetric("Passed rules", axeResult.passes)}
      ${renderMetric("Element screenshots", screenshotSummary.captured)}
    </section>
    <p class="note">Element screenshots are captured from the same Playwright page after axe runs. Confirmed violation elements are prioritized, followed by incomplete checks, up to ${escapeHtml(screenshotSummary.limit)} screenshots. ${escapeHtml(screenshotSummary.failed)} captures failed, ${escapeHtml(screenshotSummary.unsupported)} used unsupported nested targets, and ${escapeHtml(screenshotSummary.skippedByLimit)} were skipped by the limit.</p>
    ${renderRuleSection("Confirmed violations", axeResult.violations, "No automated violations were found.")}
    ${renderRuleSection("Needs manual review", axeResult.incomplete, "axe did not return incomplete checks.", "Incomplete results are not confirmed failures. axe could not determine the result automatically.")}
  </main>
</body>
</html>
`;

  await writeFile(outputPath, html, "utf8");
}

function collectNodes(rules, category) {
  return rules.flatMap((rule) => rule.nodes.map((node) => ({ category, node, ruleId: rule.id })));
}

function countNodes(rules) {
  return rules.reduce((total, rule) => total + rule.nodes.length, 0);
}

function getSimpleTargetSelector(target) {
  return Array.isArray(target) && target.length === 1 && typeof target[0] === "string" ? target[0] : null;
}

function renderMetric(label, value) {
  return `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function renderRuleSection(title, rules, emptyMessage, introduction = "") {
  const introductionHtml = introduction ? `<p class="note">${escapeHtml(introduction)}</p>` : "";
  const rulesHtml = rules.length === 0 ? `<p class="empty">${escapeHtml(emptyMessage)}</p>` : rules.map(renderRule).join("\n");
  return `<section><h2>${escapeHtml(title)}</h2>${introductionHtml}${rulesHtml}</section>`;
}

function renderRule(rule) {
  const helpLink = safeUrl(rule.helpUrl);
  return `<article class="rule">
  <div class="rule-header"><span class="badge badge-${safeFilePart(rule.impact ?? "unknown")}">${escapeHtml(rule.impact ?? "unknown")}</span><h3>${escapeHtml(rule.help)}</h3></div>
  <p>${escapeHtml(rule.description)}</p>
  <p><code>${escapeHtml(rule.id)}</code> · ${escapeHtml(rule.nodes.length)} affected element${rule.nodes.length === 1 ? "" : "s"} · <a href="${helpLink}">Rule guidance</a></p>
  ${rule.nodes.map((node, index) => renderNode(node, index)).join("\n")}
</article>`;
}

function renderNode(node, index) {
  const screenshot = node.screenshot ?? { path: null, status: "not-requested" };
  const image = screenshot.status === "captured" ? `<img src="${escapeHtml(screenshot.path)}" alt="Screenshot of affected element ${index + 1}" loading="lazy">` : `<p class="note">Element screenshot: ${escapeHtml(formatScreenshotStatus(screenshot))}</p>`;
  return `<div class="node">
  <p><strong>Element ${index + 1}</strong></p>
  <code class="selector">${escapeHtml(formatTarget(node.target))}</code>
  <p>${escapeHtml(node.failureSummary ?? "No failure summary was provided.")}</p>
  ${image}
</div>`;
}

function formatTarget(target) {
  return Array.isArray(target) ? target.map((part) => typeof part === "string" ? part : JSON.stringify(part)).join(" → ") : String(target ?? "Unknown target");
}

function formatScreenshotStatus(screenshot) {
  const labels = {
    "capture-failed": `capture failed${screenshot.error ? ` (${screenshot.error})` : ""}`,
    "element-not-found": "element was no longer available",
    "limit-reached": "not captured because the screenshot limit was reached",
    "not-requested": "not requested",
    "unsupported-target": "nested frame or shadow target is not supported"
  };
  return labels[screenshot.status] ?? screenshot.status;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return new Set(["http:", "https:"]).has(url.protocol) ? escapeHtml(url.href) : "#";
  } catch {
    return "#";
  }
}

function safeFilePart(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function truncate(value, maximumLength) {
  return value.length <= maximumLength ? value : `${value.slice(0, maximumLength - 1)}…`;
}
