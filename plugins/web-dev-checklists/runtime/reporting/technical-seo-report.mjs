import { escapeHtml, safeExternalUrl, formatDate } from "./html-common.mjs";
import { renderDocument, renderMetric, renderPageScreenshot, renderCheckSection, renderArtifacts, renderLimitations, renderCoverage } from "./report-layout.mjs";
import { writeFile } from "node:fs/promises";

const STATUS_ORDER = ["fail", "warning", "not-checked", "informational", "pass"];

export async function writeTechnicalSeoHtmlReport(evidence, coverage, outputPath) {
  const statusCounts = Object.fromEntries(STATUS_ORDER.map((status) => [status, evidence.checks.filter((check) => check.status === status).length]));
  const coverageCounts = Object.fromEntries(["automated", "partial", "manual"].map((type) => [type, coverage.items.filter((item) => item.automation === type).length]));
  const seoScore = findCheckValue(evidence, "lighthouse-seo-score", "score");
  const httpStatus = findCheckValue(evidence, "page-http-status", "httpStatus");
  const indexingStatus = formatOutcome(findCheck(evidence, "indexing-allowed")?.status, { fail: "Blocked", pass: "Allowed" });
  const canonicalStatus = formatOutcome(findCheck(evidence, "canonical-declaration")?.status, { pass: "Declared", warning: "Review" });
  const sitemapStatus = formatOutcome(findCheck(evidence, "sitemap-discovery")?.status, { pass: "Found", warning: "Review" });
  const html = renderDocument("Technical SEO review evidence", `
    <h1>Technical SEO review evidence</h1>
    <p class="lede">Rendered public-page evidence for <a href="${safeExternalUrl(evidence.target.finalUrl)}">${escapeHtml(evidence.target.finalUrl)}</a>. Review representative templates, Search Console data, migration mappings, and business intent before making a whole-site conclusion.</p>
    <p class="meta">Profile ${escapeHtml(evidence.profile.id)} ${escapeHtml(evidence.profile.version)} · completed ${escapeHtml(formatDate(evidence.run.completedAt))} · ${escapeHtml(evidence.run.browser.name)} · browser sandbox ${evidence.run.browser.sandboxed ? "enabled" : "disabled"}</p>
    <section class="summary" aria-label="Technical SEO evidence summary">
      ${renderMetric("Lighthouse SEO", seoScore ?? "—")}
      ${renderMetric("HTTP status", httpStatus ?? "—")}
      ${renderMetric("Indexing", indexingStatus)}
      ${renderMetric("Canonical", canonicalStatus)}
      ${renderMetric("Sitemap", sitemapStatus)}
      ${renderMetric("Needs attention", statusCounts.fail + statusCounts.warning)}
    </section>
    ${renderPageScreenshot(evidence.artifacts, "Full-page screenshot from the technical SEO review", "Reviewed page")}
    ${renderCheckSection("Checks requiring attention", evidence.checks.filter((check) => check.status === "fail" || check.status === "warning"), "No automated failures or warnings were recorded.", true)}
    ${renderCheckSection("Not checked", evidence.checks.filter((check) => check.status === "not-checked"), "All defined machine checks produced evidence.")}
    ${renderCheckSection("Informational observations", evidence.checks.filter((check) => check.status === "informational"), "No informational observations were recorded.")}
    ${renderCheckSection("Passed checks", evidence.checks.filter((check) => check.status === "pass"), "No machine checks passed.")}
    ${renderCoverage(coverage, coverageCounts)}
    ${renderLimitations(evidence.limitations)}
    ${renderArtifacts(evidence.artifacts, "technical-seo-report.html")}
`);

  await writeFile(outputPath, html, "utf8");
}

function findCheck(evidence, checkId) {
  return evidence.checks.find((check) => check.id === checkId) ?? null;
}

function findCheckValue(evidence, checkId, property) {
  return findCheck(evidence, checkId)?.evidence?.[property] ?? null;
}

function formatOutcome(status, labels = {}) {
  if (!status) return "—";
  return labels[status] ?? status.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
