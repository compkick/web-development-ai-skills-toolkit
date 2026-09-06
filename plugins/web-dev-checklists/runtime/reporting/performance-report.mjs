import { escapeHtml, safeExternalUrl, formatDate } from "./html-common.mjs";
import { renderDocument, renderMetric, renderPageScreenshot, renderCheckSection, renderArtifacts, renderLimitations, renderCoverage } from "./report-layout.mjs";
import { writeFile } from "node:fs/promises";

const STATUS_ORDER = ["fail", "warning", "not-checked", "informational", "pass"];

export async function writePerformanceHtmlReport(evidence, coverage, outputPath) {
  const statusCounts = Object.fromEntries(STATUS_ORDER.map((status) => [status, evidence.checks.filter((check) => check.status === status).length]));
  const coverageCounts = Object.fromEntries(["automated", "partial", "manual"].map((type) => [type, coverage.items.filter((item) => item.automation === type).length]));
  const performanceScore = findCheckValue(evidence, "lighthouse-performance-score", "score");
  const lcp = findAuditDisplayValue(evidence, "lab-largest-contentful-paint");
  const cls = findAuditDisplayValue(evidence, "lab-cumulative-layout-shift");
  const tbt = findAuditDisplayValue(evidence, "lab-total-blocking-time");
  const html = renderDocument("Web performance review evidence", `
    <h1>Web performance review evidence</h1>
    <p class="lede">Desktop lab evidence for <a href="${safeExternalUrl(evidence.target.finalUrl)}">${escapeHtml(evidence.target.finalUrl)}</a>. Use field data, representative pages, important interactions, and project budgets before making a whole-site conclusion.</p>
    <p class="meta">Profile ${escapeHtml(evidence.profile.id)} ${escapeHtml(evidence.profile.version)} · completed ${escapeHtml(formatDate(evidence.run.completedAt))} · ${escapeHtml(evidence.run.browser.name)} · browser sandbox ${evidence.run.browser.sandboxed ? "enabled" : "disabled"}</p>
    <section class="summary" aria-label="Performance evidence summary">
      ${renderMetric("Lighthouse score", performanceScore ?? "—")}
      ${renderMetric("Lab LCP", lcp ?? "—")}
      ${renderMetric("Lab CLS", cls ?? "—")}
      ${renderMetric("Lab TBT", tbt ?? "—")}
      ${renderMetric("Warnings", statusCounts.warning)}
    </section>
    ${renderPageScreenshot(evidence.artifacts, "Full-page screenshot from the performance review", "Reviewed page")}
    ${renderCheckSection("Checks requiring attention", evidence.checks.filter((check) => check.status === "fail" || check.status === "warning"), "No automated failures or warnings were recorded.", true)}
    ${renderCheckSection("Not checked", evidence.checks.filter((check) => check.status === "not-checked"), "All defined machine checks produced evidence.")}
    ${renderCheckSection("Informational observations", evidence.checks.filter((check) => check.status === "informational"), "No informational observations were recorded.")}
    ${renderCheckSection("Passed checks", evidence.checks.filter((check) => check.status === "pass"), "No machine checks passed.")}
    ${renderCoverage(coverage, coverageCounts)}
    ${renderLimitations(evidence.limitations)}
    ${renderArtifacts(evidence.artifacts, "performance-report.html")}
`);

  await writeFile(outputPath, html, "utf8");
}

function findCheckValue(evidence, checkId, property) {
  return evidence.checks.find((check) => check.id === checkId)?.evidence?.[property] ?? null;
}

function findAuditDisplayValue(evidence, checkId) {
  return evidence.checks.find((check) => check.id === checkId)?.evidence?.audit?.displayValue ?? null;
}
