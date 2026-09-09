import { escapeHtml, safeExternalUrl, formatDate } from "./html-common.mjs";
import { renderDocument, renderPageScreenshot, renderCheckArtifacts, renderArtifacts, renderLimitations, renderGroupedCoverage } from "./report-layout.mjs";
import { writeFile } from "node:fs/promises";

export async function writeWebProjectAuditHtmlReport(evidence, coverage, outputPath) {
  const overall = findCheck(evidence, "audit-public-site-summary");
  const assessment = assessmentFor(overall?.status);
  const areaChecks = evidence.checks.filter((check) => check.id !== "audit-public-site-summary");
  const needsAttention = areaChecks.filter((check) => check.status !== "pass");
  const html = renderDocument("Web Project Audit Report", `
    <h1>Web Project Audit Report</h1>
    <p class="lede">High-level public website evidence for <a href="${safeExternalUrl(evidence.target.finalUrl)}">${escapeHtml(evidence.target.finalUrl)}</a>. Repository, operational, authenticated, mobile, privacy, and project-specific journey evidence must be added by the reviewer.</p>
    <p class="meta">Profile ${escapeHtml(evidence.profile.id)} ${escapeHtml(evidence.profile.version)} · completed ${escapeHtml(formatDate(evidence.run.completedAt))} · ${escapeHtml(evidence.run.browser.name)} · browser sandbox ${evidence.run.browser.sandboxed ? "enabled" : "disabled"}</p>
    <section class="assessment assessment-${className(assessment)}"><strong>Public evidence: ${escapeHtml(assessment)}</strong><span>${escapeHtml(assessmentMessage(assessment))}</span></section>
    <section class="summary" aria-label="Audit area summary">${areaChecks.map(renderAreaCard).join("")}</section>
    ${renderPageScreenshot(evidence.artifacts, "Full-page screenshot from the web project audit", "Reviewed page")}
    <section><h2>Areas requiring attention</h2>${needsAttention.length === 0 ? '<p class="empty">No machine-detected problem was recorded in this bounded public review.</p>' : needsAttention.map(renderAreaDetails).join("\n")}</section>
    <details><summary><h2 style="display:inline">Areas with no machine-detected problems</h2> (${areaChecks.length - needsAttention.length})</summary>${areaChecks.filter((check) => check.status === "pass").map(renderAreaDetails).join("\n") || '<p class="note">No area produced a complete clean result.</p>'}</details>
    ${renderGroupedCoverage(coverage, "Canonical audit checklist coverage", "Coverage describes what the public runner can assess. The audit skill adds repository, operational, privacy, CMS, representative-page, and human evidence.")}
    ${renderLimitations(evidence.limitations)}
    ${renderArtifacts(evidence.artifacts, "web-project-audit-report.html")}
`);

  await writeFile(outputPath, html, "utf8");
}

function assessmentFor(status) {
  if (status === "fail") return "Problems found";
  if (status === "warning") return "Needs attention";
  if (status === "not-checked" || !status) return "Incomplete evidence";
  return "Generally healthy";
}

function assessmentMessage(assessment) {
  if (assessment === "Problems found") return "One or more public checks failed. Review the affected areas and project context before deciding priority.";
  if (assessment === "Needs attention") return "No public check failed, but one or more observations should be reviewed.";
  if (assessment === "Incomplete evidence") return "One or more public evidence collectors did not complete.";
  return "No problem was detected by this bounded public baseline. This is not a complete project audit by itself.";
}

function renderAreaCard(check) {
  const counts = check.evidence.counts ?? {};
  return `<article class="area"><span class="badge badge-${escapeHtml(check.status)}">${escapeHtml(label(check.status))}</span><h3>${escapeHtml(check.evidence.area ?? check.title)}</h3><p class="note">${Number(counts.fail ?? 0)} failed · ${Number(counts.warning ?? 0)} warnings · ${Number(counts["not-checked"] ?? 0)} not checked</p></article>`;
}

function renderAreaDetails(check) {
  const observations = check.evidence.observations ?? [];
  return `<article class="area"><span class="badge badge-${escapeHtml(check.status)}">${escapeHtml(label(check.status))}</span><h3>${escapeHtml(check.evidence.area ?? check.title)}</h3>${observations.length ? `<ul>${observations.map((item) => `<li><strong>${escapeHtml(label(item.status))}:</strong> ${escapeHtml(item.title)} <code>${escapeHtml(item.id)}</code></li>`).join("")}</ul>` : '<p class="note">No failed, warning, or incomplete machine observation was recorded.</p>'}${renderCheckArtifacts(check.artifacts)}</article>`;
}

function findCheck(evidence, checkId) {
  return evidence.checks.find((check) => check.id === checkId) ?? null;
}

function label(value) {
  return String(value ?? "").split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function className(value) {
  return String(value).toLowerCase().replaceAll(" ", "-");
}
