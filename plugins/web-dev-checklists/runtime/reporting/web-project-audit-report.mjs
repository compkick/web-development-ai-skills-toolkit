import { writeFile } from "node:fs/promises";

export async function writeWebProjectAuditHtmlReport(evidence, coverage, outputPath) {
  const overall = findCheck(evidence, "audit-public-site-summary");
  const assessment = assessmentFor(overall?.status);
  const areaChecks = evidence.checks.filter((check) => check.id !== "audit-public-site-summary");
  const needsAttention = areaChecks.filter((check) => check.status !== "pass");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'">
  <title>Web Project Audit Report</title>
  <style>
    :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
    body { margin: 0; background: #f4f6f8; color: #17202a; }
    main { width: min(1120px, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4rem; }
    h1, h2, h3 { line-height: 1.2; }
    h1 { margin-bottom: .25rem; }
    a { color: #075985; }
    code { overflow-wrap: anywhere; }
    .lede, .meta, .note { color: #475569; }
    .assessment { border: 2px solid #64748b; border-radius: .75rem; margin: 1.5rem 0; padding: 1rem 1.25rem; }
    .assessment strong { display: block; font-size: 1.6rem; }
    .assessment-problems-found { border-color: #b91c1c; }
    .assessment-needs-attention, .assessment-incomplete-evidence { border-color: #d97706; }
    .assessment-generally-healthy { border-color: #15803d; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin: 1.5rem 0 2.5rem; }
    .area, .coverage-group { background: #fff; border: 1px solid #d8dee6; border-radius: .65rem; box-shadow: 0 1px 2px rgb(15 23 42 / 8%); }
    .area { padding: 1rem 1.25rem; }
    .area h3 { margin: .4rem 0; }
    .area ul { padding-left: 1.25rem; }
    .badge { border-radius: 999px; color: #fff; display: inline-block; font-size: .75rem; font-weight: 700; padding: .15rem .55rem; text-transform: uppercase; }
    .badge-fail { background: #991b1b; }
    .badge-warning { background: #b45309; }
    .badge-not-checked, .badge-informational { background: #475569; }
    .badge-pass { background: #166534; }
    details { margin: 1.5rem 0; }
    details > summary { cursor: pointer; }
    .coverage-group { padding: .75rem 1rem; }
    .coverage-group li { margin: .5rem 0; }
    .reviewed-page { margin: 2rem 0 3rem; }
    .page-image { background: #fff; border: 1px solid #cbd5e1; display: block; max-height: 420px; max-width: 100%; object-fit: contain; }
    .empty { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: .5rem; padding: 1rem; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a; color: #e2e8f0; }
      .area, .coverage-group { background: #172033; border-color: #334155; }
      .lede, .meta, .note { color: #b7c2d0; }
      a { color: #7dd3fc; }
      .empty { background: #12352c; border-color: #166534; }
    }
  </style>
</head>
<body>
  <main>
    <h1>Web Project Audit Report</h1>
    <p class="lede">High-level public website evidence for <a href="${safeExternalUrl(evidence.target.finalUrl)}">${escapeHtml(evidence.target.finalUrl)}</a>. Repository, operational, authenticated, mobile, privacy, and project-specific journey evidence must be added by the reviewer.</p>
    <p class="meta">Profile ${escapeHtml(evidence.profile.id)} ${escapeHtml(evidence.profile.version)} · completed ${escapeHtml(formatDate(evidence.run.completedAt))} · ${escapeHtml(evidence.run.browser.name)} · browser sandbox ${evidence.run.browser.sandboxed ? "enabled" : "disabled"}</p>
    <section class="assessment assessment-${className(assessment)}"><strong>Public evidence: ${escapeHtml(assessment)}</strong><span>${escapeHtml(assessmentMessage(assessment))}</span></section>
    <section class="summary" aria-label="Audit area summary">${areaChecks.map(renderAreaCard).join("")}</section>
    ${renderPageScreenshot(evidence.artifacts)}
    <section><h2>Areas requiring attention</h2>${needsAttention.length === 0 ? '<p class="empty">No machine-detected problem was recorded in this bounded public review.</p>' : needsAttention.map(renderAreaDetails).join("\n")}</section>
    <details><summary><h2 style="display:inline">Areas with no machine-detected problems</h2> (${areaChecks.length - needsAttention.length})</summary>${areaChecks.filter((check) => check.status === "pass").map(renderAreaDetails).join("\n") || '<p class="note">No area produced a complete clean result.</p>'}</details>
    ${renderCoverage(coverage)}
    <section><h2>Limitations</h2><ul>${evidence.limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join("")}</ul></section>
    ${renderArtifacts(evidence.artifacts)}
  </main>
</body>
</html>
`;

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

function renderPageScreenshot(artifacts) {
  return artifacts.some((artifact) => artifact.path === "page.png") ? '<section class="reviewed-page"><h2>Reviewed page</h2><a href="page.png"><img class="page-image" src="page.png" alt="Full-page screenshot from the web project audit"></a></section>' : "";
}

function renderCoverage(coverage) {
  const sections = [...new Set(coverage.items.map((item) => item.section))];
  return `<section><h2>Canonical audit checklist coverage</h2><p class="note">Coverage describes what the public runner can assess. The audit skill adds repository, operational, privacy, CMS, representative-page, and human evidence.</p>${sections.map((section) => {
    const items = coverage.items.filter((item) => item.section === section);
    return `<details class="coverage-group"><summary><strong>${escapeHtml(section)}</strong> (${items.length})</summary><ul>${items.map((item) => `<li><span class="badge badge-${coverageBadge(item.automation)}">${escapeHtml(coverageLabel(item.automation))}</span> ${escapeHtml(item.checklistItem)}<br><span class="note">${escapeHtml(item.note)}</span></li>`).join("")}</ul></details>`;
  }).join("\n")}</section>`;
}

function renderCheckArtifacts(artifacts) {
  return artifacts?.length ? `<p class="note">Detailed evidence: ${artifacts.map(renderArtifactLink).join(", ")}</p>` : "";
}

function renderArtifacts(artifacts) {
  const linkedArtifacts = artifacts.filter((artifact) => artifact.path !== "web-project-audit-report.html");
  return `<section><h2>Artifacts</h2><ul>${linkedArtifacts.map((artifact) => `<li>${renderArtifactLink(artifact.path)} — ${escapeHtml(artifact.purpose)}</li>`).join("")}</ul></section>`;
}

function renderArtifactLink(artifactPath) {
  const safePath = safeRelativePath(artifactPath);
  return safePath ? `<a href="${safePath}">${escapeHtml(artifactPath)}</a>` : `<code>${escapeHtml(artifactPath)}</code>`;
}

function coverageLabel(automation) {
  return automation === "partial" ? "Partially automated" : label(automation);
}

function coverageBadge(automation) {
  if (automation === "automated") return "pass";
  if (automation === "partial") return "warning";
  return "not-checked";
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

function safeRelativePath(value) {
  const normalized = String(value ?? "").replaceAll("\\", "/");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..") || normalized.includes(":")) return null;
  return normalized.split("/").map(encodeURIComponent).join("/");
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return new Set(["http:", "https:"]).has(url.protocol) ? escapeHtml(url.href) : "#";
  } catch {
    return "#";
  }
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
