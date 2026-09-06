import { escapeHtml, safeExternalUrl, formatDate } from "./html-common.mjs";
import { renderDocument, renderMetric } from "./report-layout.mjs";
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
  const html = renderDocument("axe accessibility report", `
    <h1>axe accessibility report</h1>
    <p class="lede">Automated evidence for <a href="${safeExternalUrl(axeResult.url)}">${escapeHtml(axeResult.url)}</a>. Automated results do not replace manual accessibility testing.</p>
    <p class="meta">Scanned ${escapeHtml(formatDate(axeResult.timestamp))} with ${escapeHtml(axeResult.testEngine?.name ?? "axe-core")} ${escapeHtml(axeResult.testEngine?.version ?? "unknown")} in ${escapeHtml(axeResult.auditEnvironment?.formFactor ?? "unknown")} mode at ${escapeHtml(axeResult.testEnvironment?.windowWidth ?? axeResult.auditEnvironment?.viewport?.width ?? "unknown")} × ${escapeHtml(axeResult.testEnvironment?.windowHeight ?? axeResult.auditEnvironment?.viewport?.height ?? "unknown")}.</p>
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
`);

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

function renderRuleSection(title, rules, emptyMessage, introduction = "") {
  const introductionHtml = introduction ? `<p class="note">${escapeHtml(introduction)}</p>` : "";
  const rulesHtml = rules.length === 0 ? `<p class="empty">${escapeHtml(emptyMessage)}</p>` : rules.map(renderRule).join("\n");
  return `<section><h2>${escapeHtml(title)}</h2>${introductionHtml}${rulesHtml}</section>`;
}

function renderRule(rule) {
  const helpLink = safeExternalUrl(rule.helpUrl);
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

function safeFilePart(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function truncate(value, maximumLength) {
  return value.length <= maximumLength ? value : `${value.slice(0, maximumLength - 1)}…`;
}
