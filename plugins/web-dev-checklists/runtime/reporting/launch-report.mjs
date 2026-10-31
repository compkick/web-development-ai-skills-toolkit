import { escapeHtml, safeExternalUrl, safeRelativePath, formatDate } from "./html-common.mjs";
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
    ${renderFaviconReview(evidence)}
    ${renderCheckSection("Automated blockers", evidence.checks.filter((check) => check.status === "fail"), "No automated blockers were recorded.", true)}
    ${renderCheckSection("Checks requiring review", evidence.checks.filter((check) => check.status === "warning"), "No automated warnings were recorded.", true)}
    ${renderCheckSection("Not checked", evidence.checks.filter((check) => check.status === "not-checked"), "All defined machine checks produced evidence.", incomplete)}
    ${renderCheckSection("Informational observations", evidence.checks.filter((check) => check.status === "informational"), "No informational observations were recorded.")}
    ${renderCheckSection("Passed checks", evidence.checks.filter((check) => check.status === "pass"), "No machine checks passed.")}
    ${renderGroupedCoverage(coverage, "Canonical launch checklist coverage", "Coverage describes what the runner can assess. The launch skill uses project context, prior specialist reviews, and human confirmation to produce the final tailored checklist and go/no-go recommendation.")}
    ${renderLimitations(evidence.limitations)}
    ${renderArtifacts(evidence.artifacts, "launch-readiness-report.html")}
`, `.icon-previews { display: flex; flex-wrap: wrap; gap: 1rem; } .icon-preview { box-sizing: border-box; margin: 0; padding: 1rem; border: 1px solid #94a3b8; border-radius: .5rem; max-width: 100%; overflow-wrap: anywhere; } .icon-swatches { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; } .icon-swatch { display: inline-flex; align-items: center; justify-content: center; gap: .75rem; padding: .75rem; background: #fff; } .icon-swatch.dark { background: #172033; }`);

  await writeFile(outputPath, html, "utf8");
}

function renderFaviconReview(evidence) {
  const checks = evidence.checks.filter((check) => check.id.startsWith("favicon-"));
  if (!checks.length) return "";
  const icons = [findCheck(evidence, "favicon-load"), findCheck(evidence, "favicon-app-icons")].flatMap((check) => check?.evidence?.icons ?? []);
  const previews = icons.filter((icon) => /^favicon-preview-\d+\.png$/.test(icon.preview ?? "") && evidence.artifacts.some((artifact) => artifact.path === icon.preview));
  return `<section><h2>Favicon and app icons</h2><p>Confirm this is the approved site icon and remains recognizable at browser-tab size. Previews show 16-pixel and enlarged views on light and dark backgrounds. These are file previews, not proof of which icon every browser selects.</p>
    <div class="icon-previews">${previews.map((icon) => `<figure class="icon-preview"><div class="icon-swatches">${["", " dark"].map((theme) => `<span class="icon-swatch${theme}"><img src="${safeRelativePath(icon.preview)}" width="16" height="16" alt="${escapeHtml(icon.kind)} icon at 16 pixels"><img src="${safeRelativePath(icon.preview)}" width="96" height="96" alt="Enlarged ${escapeHtml(icon.kind)} icon"></span>`).join("")}</div><figcaption>${escapeHtml(icon.kind)} · ${escapeHtml(icon.width)} × ${escapeHtml(icon.height)}<br><code>${escapeHtml(icon.url)}</code></figcaption></figure>`).join("") || "<p>No safe local icon preview was available. Review the icon manually.</p>"}</div>
    <p class="note">Icon findings are warnings, not automatic launch blockers. Touch and installed-app icons apply only when the project needs those experiences.</p></section>`;
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
