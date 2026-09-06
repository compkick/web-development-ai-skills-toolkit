import { escapeHtml, safeExternalUrl, formatDate } from "./html-common.mjs";
import { renderDocument, renderMetric, renderPageScreenshot, renderCheckSection, renderArtifacts, renderLimitations, renderCoverage } from "./report-layout.mjs";
import { writeFile } from "node:fs/promises";

const STATUS_ORDER = ["fail", "warning", "not-checked", "informational", "pass"];

export async function writeSecurityHtmlReport(evidence, coverage, outputPath) {
  const statusCounts = Object.fromEntries(STATUS_ORDER.map((status) => [status, evidence.checks.filter((check) => check.status === status).length]));
  const coverageCounts = Object.fromEntries(["automated", "partial", "manual"].map((type) => [type, coverage.items.filter((item) => item.automation === type).length]));
  const html = renderDocument("Web security review evidence", `
    <h1>Web security review evidence</h1>
    <p class="lede">Read-only public evidence for <a href="${safeExternalUrl(evidence.target.finalUrl)}">${escapeHtml(evidence.target.finalUrl)}</a>. This report is not a penetration test, certification, or guarantee that the application is secure.</p>
    <p class="meta">Profile ${escapeHtml(evidence.profile.id)} ${escapeHtml(evidence.profile.version)} · ${escapeHtml(evidence.profile.standard)} · completed ${escapeHtml(formatDate(evidence.run.completedAt))} · ${escapeHtml(evidence.run.browser.name)} · browser sandbox ${evidence.run.browser.sandboxed ? "enabled" : "disabled"}</p>
    <section class="summary" aria-label="Automated evidence summary">
      ${renderMetric("Failed", statusCounts.fail)}
      ${renderMetric("Warnings", statusCounts.warning)}
      ${renderMetric("Not checked", statusCounts["not-checked"])}
      ${renderMetric("Informational", statusCounts.informational)}
      ${renderMetric("Passed", statusCounts.pass)}
    </section>
    ${renderPageScreenshot(evidence.artifacts, "Full-page screenshot from the security review", "Reviewed page")}
    ${renderCheckSection("Checks requiring attention", evidence.checks.filter((check) => check.status === "fail" || check.status === "warning"), "No automated failures or warnings were recorded.", true)}
    ${renderCheckSection("Not checked", evidence.checks.filter((check) => check.status === "not-checked"), "All defined machine checks produced evidence.")}
    ${renderCheckSection("Informational observations", evidence.checks.filter((check) => check.status === "informational"), "No informational observations were recorded.")}
    ${renderCheckSection("Passed checks", evidence.checks.filter((check) => check.status === "pass"), "No machine checks passed.")}
    ${renderCoverage(coverage, coverageCounts)}
    ${renderLimitations(evidence.limitations)}
    ${renderArtifacts(evidence.artifacts, "security-report.html")}
`);

  await writeFile(outputPath, html, "utf8");
}
