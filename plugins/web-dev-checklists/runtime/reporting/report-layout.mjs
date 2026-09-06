import { escapeHtml, safeExternalUrl, safeRelativePath, formatDate, formatLabel, coverageBadge, coverageLabel } from "./html-common.mjs";

// Inline the shared styles so reports remain portable, offline HTML files.
const REPORT_STYLES = `
    :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
    body { margin: 0; background: #f4f6f8; color: #17202a; }
    main { width: min(1120px, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4rem; }
    h1, h2, h3 { line-height: 1.2; }
    h1 { margin-bottom: .25rem; }
    a { color: #075985; }
    code { overflow-wrap: anywhere; }
    .lede, .meta, .note { color: #475569; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 1rem; margin: 1.5rem 0 2.5rem; }
    .metric, .check, .coverage, .coverage-group, .area, .rule { background: #fff; border: 1px solid #d8dee6; border-radius: .65rem; box-shadow: 0 1px 2px rgb(15 23 42 / 8%); }
    .metric { padding: 1rem; }
    .metric strong { display: block; font-size: 1.7rem; }
    details { margin: 1.5rem 0; }
    details > summary { cursor: pointer; }
    .check { margin: 1rem 0; padding: 1rem 1.25rem; }
    .check-header, .rule-header { display: flex; flex-wrap: wrap; align-items: center; gap: .65rem; }
    .check-header h3, .rule-header h3 { margin: 0; }
    .badge { border-radius: 999px; color: #fff; font-size: .75rem; font-weight: 700; padding: .15rem .55rem; text-transform: uppercase; }
    .badge-fail { background: #991b1b; }
    .badge-warning { background: #b45309; }
    .badge-not-checked, .badge-informational { background: #475569; }
    .badge-pass { background: #166534; }
    .method { color: #64748b; font-size: .85rem; text-transform: uppercase; }
    .evidence { border-top: 1px solid #e2e8f0; margin-top: 1rem; padding-top: 1rem; }
    .evidence dl { display: grid; gap: .35rem 1rem; grid-template-columns: minmax(130px, 220px) 1fr; margin: .4rem 0; }
    .evidence dt { font-weight: 700; overflow-wrap: anywhere; }
    .evidence dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
    .evidence ul { margin: .25rem 0; padding-left: 1.25rem; }
    .coverage { margin: .75rem 0; padding: .75rem 1rem; }
    .coverage summary { font-weight: 700; }
    .reviewed-page { margin-bottom: 3rem; }
    .page-image { background: #fff; border: 1px solid #cbd5e1; display: block; max-height: 420px; max-width: 100%; object-fit: contain; }
    .empty { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: .5rem; padding: 1rem; }
    .coverage-group { padding: .75rem 1rem; }
    .coverage-group li { margin: .5rem 0; }
    .area, .rule { padding: 1rem 1.25rem; margin: 1rem 0; }
    .area h3 { margin: .4rem 0; }
    .area ul { padding-left: 1.25rem; }
    .decision, .assessment { border: 2px solid #64748b; border-radius: .75rem; margin: 1.5rem 0; padding: 1rem 1.25rem; }
    .decision strong, .assessment strong { display: block; font-size: 1.6rem; }
    .decision-blocked, .assessment-problems-found { border-color: #b91c1c; }
    .decision-attention, .decision-incomplete, .assessment-needs-attention, .assessment-incomplete-evidence { border-color: #d97706; }
    .decision-clear, .assessment-generally-healthy { border-color: #15803d; }
    .badge-critical { background: #991b1b; }
    .badge-serious { background: #b45309; }
    .badge-moderate { background: #0369a1; }
    .badge-minor, .badge-unknown { background: #475569; }
    .node { border-top: 1px solid #e2e8f0; margin-top: 1rem; padding-top: 1rem; }
    .node img { background: #fff; border: 1px solid #cbd5e1; display: block; margin-top: .75rem; max-height: 420px; max-width: 100%; object-fit: contain; }
    .selector { background: #eef2f6; border-radius: .25rem; display: block; padding: .5rem; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a; color: #e2e8f0; }
      .metric, .check, .coverage, .coverage-group, .area, .rule { background: #172033; border-color: #334155; }
      .lede, .meta, .note, .method { color: #b7c2d0; }
      a { color: #7dd3fc; }
      .selector { background: #273449; }
      .node, .evidence { border-color: #334155; }
      .empty { background: #12352c; border-color: #166534; }
    }
`;

export function renderDocument(title, body, extraStyles = "") {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'">
  <title>${escapeHtml(title)}</title>
  <style>${REPORT_STYLES}${extraStyles}</style>
</head>
<body><main>${body}</main></body>
</html>
`;
}

export function renderMetric(label, value) {
  return `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

export function renderCheckSection(title, checks, emptyMessage, open = false) {
  const content = checks.length === 0 ? `<p class="empty">${escapeHtml(emptyMessage)}</p>` : checks.map(renderCheck).join("\n");
  return `<details ${open ? "open" : ""}><summary><h2 style="display:inline">${escapeHtml(title)}</h2> (${checks.length})</summary>${content}</details>`;
}

export function renderCheck(check) {
  return `<article class="check">
  <div class="check-header"><span class="badge badge-${escapeHtml(check.status)}">${escapeHtml(check.status)}</span><span class="method">${escapeHtml(check.method)}</span><h3>${escapeHtml(check.title)}</h3></div>
  <p><code>${escapeHtml(check.id)}</code></p>
  <div class="evidence"><strong>Evidence</strong>${renderValue(check.evidence)}</div>
  ${renderCheckArtifacts(check.artifacts)}
</article>`;
}

export function renderValue(value) {
  if (value === null) return "<code>null</code>";
  if (Array.isArray(value)) return value.length === 0 ? "<code>[]</code>" : `<ul>${value.map((item) => `<li>${renderValue(item)}</li>`).join("")}</ul>`;
  if (typeof value === "object") {
    const entries = Object.entries(value);
    return entries.length === 0 ? "<code>{}</code>" : `<dl>${entries.map(([key, item]) => `<dt>${escapeHtml(formatLabel(key))}</dt><dd>${renderValue(item)}</dd>`).join("")}</dl>`;
  }
  return `<code>${escapeHtml(value)}</code>`;
}

export function renderCheckArtifacts(artifacts) {
  return artifacts?.length ? `<p class="note">Supporting artifacts: ${artifacts.map(renderArtifactLink).join(", ")}</p>` : "";
}

export function renderArtifactLink(artifactPath) {
  const safePath = safeRelativePath(artifactPath);
  return safePath ? `<a href="${safePath}">${escapeHtml(artifactPath)}</a>` : `<code>${escapeHtml(artifactPath)}</code>`;
}

export function renderCoverage(coverage, counts) {
  const items = ["automated", "partial", "manual"].flatMap((type) => coverage.items.filter((item) => item.automation === type));
  return `<section><h2>Canonical checklist coverage</h2><p class="note">${escapeHtml(counts.automated)} automated · ${escapeHtml(counts.partial)} partially automated · ${escapeHtml(counts.manual)} manual. Coverage describes how an item can be assessed; it is not the item's pass/fail result.</p>${items.map((item) => `<details class="coverage"><summary><span class="badge badge-${coverageBadge(item.automation)}">${escapeHtml(coverageLabel(item.automation))}</span> ${escapeHtml(item.checklistItem)}</summary><p><strong>Section:</strong> ${escapeHtml(item.section)}</p><p>${escapeHtml(item.note)}</p></details>`).join("\n")}</section>`;
}

export function renderLimitations(limitations) {
  return `<section><h2>Limitations</h2><ul>${limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join("")}</ul></section>`;
}

export function renderPageScreenshot(artifacts, alt = "Full-page screenshot from the review", title = "Reviewed page") {
  return artifacts.some((artifact) => artifact.path === "page.png") ? `<section class="reviewed-page"><h2>${escapeHtml(title)}</h2><a href="page.png"><img class="page-image" src="page.png" alt="${escapeHtml(alt)}"></a></section>` : "";
}

export function renderArtifacts(artifacts, currentReport) {
  const linkedArtifacts = artifacts.filter((artifact) => artifact.path !== currentReport);
  return `<section><h2>Artifacts</h2><ul>${linkedArtifacts.map((artifact) => `<li>${renderArtifactLink(artifact.path)} — ${escapeHtml(artifact.purpose)}</li>`).join("")}</ul></section>`;
}

export function renderGroupedCoverage(coverage, title, note) {
  const sections = [...new Set(coverage.items.map((item) => item.section))];
  return `<section><h2>${escapeHtml(title)}</h2><p class="note">${escapeHtml(note)}</p>${sections.map((section) => {
    const items = coverage.items.filter((item) => item.section === section);
    return `<details class="coverage-group"><summary><strong>${escapeHtml(section)}</strong> (${items.length})</summary><ul>${items.map((item) => `<li><span class="badge badge-${coverageBadge(item.automation)}">${escapeHtml(coverageLabel(item.automation))}</span> ${escapeHtml(item.checklistItem)}<br><span class="note">${escapeHtml(item.note)}</span></li>`).join("")}</ul></details>`;
  }).join("\n")}</section>`;
}
