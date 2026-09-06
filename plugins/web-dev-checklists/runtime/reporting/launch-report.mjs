import { escapeHtml, safeExternalUrl, formatDate } from "./html-common.mjs";
import { renderDocument, renderMetric, renderPageScreenshot, renderCheckSection, renderArtifacts, renderLimitations, renderGroupedCoverage } from "./report-layout.mjs";
import { writeFile } from "node:fs/promises";

export async function writeLaunchHtmlReport(evidence, coverage, outputPath) {
  const counts = Object.fromEntries(["fail", "warning", "not-checked", "informational", "pass"].map((status) => [status, evidence.checks.filter((check) => check.status === status).length]));
  const incomplete = counts["not-checked"] > 0 || findCheck(evidence, "launch-collection")?.status !== "pass";
  const preflight = counts.fail > 0 ? "Blocked" : incomplete ? "Incomplete" : counts.warning > 0 ? "Attention" : "Clear";
  const httpStatus = findCheckValue(evidence, "page-http-status", "httpStatus") ?? "—";
  const httpsStatus = formatOutcome(findCheck(evidence, "https-url")?.status, { fail: "No", pass: "Yes" });
  const linkCoverage = findCheck(evidence, "homepage-link-check-coverage")?.evidence ?? {};
  const linkChecks = ["homepage-navigation-links", "homepage-footer-links", "homepage-content-links"].map((id) => findCheck(evidence, id)).filter(Boolean);
  const brokenLinks = linkCoverage.confirmedBrokenDestinations ?? new Set(linkChecks.flatMap((check) => check.evidence.linkResultsRequiringAttention ?? []).filter((result) => result.outcome === "fail").map((result) => result.initialUrl)).size;
  const unsetLinks = linkChecks.reduce((total, check) => total + (check.evidence.unsetOrInvalid ?? 0), 0);
  const html = renderDocument("Website Launch Readiness Report", `
    <h1>Website Launch Readiness Report</h1>
    <p class="lede">High-level homepage and link evidence for <a href="${safeExternalUrl(evidence.target.finalUrl)}">${escapeHtml(evidence.target.finalUrl)}</a>. This preflight does not replace specialist reviews or the developer's launch checklist.</p>
    <p class="meta">Profile ${escapeHtml(evidence.profile.id)} ${escapeHtml(evidence.profile.version)} · completed ${escapeHtml(formatDate(evidence.run.completedAt))} · ${escapeHtml(evidence.run.browser.name)} · browser sandbox ${evidence.run.browser.sandboxed ? "enabled" : "disabled"}</p>
    <section class="decision decision-${preflight.toLowerCase()}"><strong>Automated preflight: ${escapeHtml(preflight)}</strong><span>${escapeHtml(preflightMessage(preflight))}</span></section>
    <section class="summary" aria-label="Launch preflight summary">
      ${renderMetric("HTTP status", httpStatus)}
      ${renderMetric("HTTPS", httpsStatus)}
      ${renderMetric("Links checked", linkCoverage.tested ?? 0)}
      ${renderMetric("Confirmed broken", brokenLinks)}
      ${renderMetric("Unset or invalid", unsetLinks)}
      ${renderMetric("Needs attention", counts.fail + counts.warning + counts["not-checked"])}
    </section>
    ${renderPageScreenshot(evidence.artifacts, "Full-page screenshot from the website launch preflight", "Reviewed homepage")}
    ${renderCheckSection("Automated blockers", evidence.checks.filter((check) => check.status === "fail"), "No automated blockers were recorded.", true)}
    ${renderCheckSection("Checks requiring review", evidence.checks.filter((check) => check.status === "warning"), "No automated warnings were recorded.", true)}
    ${renderCheckSection("Not checked", evidence.checks.filter((check) => check.status === "not-checked"), "All defined machine checks produced evidence.", incomplete)}
    ${renderCheckSection("Informational observations", evidence.checks.filter((check) => check.status === "informational"), "No informational observations were recorded.")}
    ${renderCheckSection("Passed checks", evidence.checks.filter((check) => check.status === "pass"), "No machine checks passed.")}
    ${renderGroupedCoverage(coverage, "Canonical launch checklist coverage", "Coverage describes what the runner can assess. The launch skill uses project context, prior specialist reviews, and human confirmation to produce the final tailored checklist and go/no-go recommendation.")}
    ${renderLimitations(evidence.limitations)}
    ${renderArtifacts(evidence.artifacts, "launch-readiness-report.html")}
`);

  await writeFile(outputPath, html, "utf8");
}

function preflightMessage(preflight) {
  if (preflight === "Blocked") return "One or more automated observations could stop a launch. Confirm context before making the final decision.";
  if (preflight === "Incomplete") return "Some automated checks could not be completed. Review the untested items before making a launch decision.";
  if (preflight === "Attention") return "No automated blocker was confirmed, but one or more observations need review.";
  return "No automated blocker or warning was found in this bounded homepage preflight. Manual launch confirmation is still required.";
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
