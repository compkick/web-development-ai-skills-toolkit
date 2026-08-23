import { writeFile } from "node:fs/promises";

const STATUS_ORDER = ["fail", "warning", "not-checked", "informational", "pass"];

export async function writeSecurityHtmlReport(evidence, coverage, outputPath) {
  const statusCounts = Object.fromEntries(STATUS_ORDER.map((status) => [status, evidence.checks.filter((check) => check.status === status).length]));
  const coverageCounts = Object.fromEntries(["automated", "partial", "manual"].map((type) => [type, coverage.items.filter((item) => item.automation === type).length]));
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'">
  <title>Web security review evidence</title>
  <style>
    :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
    body { margin: 0; background: #f4f6f8; color: #17202a; }
    main { width: min(1120px, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4rem; }
    h1, h2, h3 { line-height: 1.2; }
    h1 { margin-bottom: .25rem; }
    a { color: #075985; }
    code { overflow-wrap: anywhere; }
    .lede, .meta, .note { color: #475569; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
    .metric, .check, .coverage { background: #fff; border: 1px solid #d8dee6; border-radius: .65rem; box-shadow: 0 1px 2px rgb(15 23 42 / 8%); }
    .metric { padding: 1rem; }
    .metric strong { display: block; font-size: 1.7rem; }
    .check { margin: 1rem 0; padding: 1rem 1.25rem; }
    .check-header { display: flex; flex-wrap: wrap; align-items: center; gap: .65rem; }
    .check-header h3 { margin: 0; }
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
    .coverage summary { cursor: pointer; font-weight: 700; }
    .reviewed-page { margin-bottom: 3rem; }
    .page-image { background: #fff; border: 1px solid #cbd5e1; display: block; max-height: 420px; max-width: 100%; object-fit: contain; }
    .empty { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: .5rem; padding: 1rem; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a; color: #e2e8f0; }
      .metric, .check, .coverage { background: #172033; border-color: #334155; }
      .lede, .meta, .note, .method { color: #b7c2d0; }
      a { color: #7dd3fc; }
      .evidence { border-color: #334155; }
      .empty { background: #12352c; border-color: #166534; }
    }
  </style>
</head>
<body>
  <main>
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
    ${renderPageScreenshot(evidence.artifacts)}
    ${renderCheckSection("Checks requiring attention", evidence.checks.filter((check) => check.status === "fail" || check.status === "warning"), "No automated failures or warnings were recorded.", true)}
    ${renderCheckSection("Not checked", evidence.checks.filter((check) => check.status === "not-checked"), "All defined machine checks produced evidence.")}
    ${renderCheckSection("Informational observations", evidence.checks.filter((check) => check.status === "informational"), "No informational observations were recorded.")}
    ${renderCheckSection("Passed checks", evidence.checks.filter((check) => check.status === "pass"), "No machine checks passed.")}
    ${renderCoverage(coverage, coverageCounts)}
    ${renderLimitations(evidence.limitations)}
    ${renderArtifacts(evidence.artifacts)}
  </main>
</body>
</html>
`;

  await writeFile(outputPath, html, "utf8");
}

function renderMetric(label, value) {
  return `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function renderPageScreenshot(artifacts) {
  return artifacts.some((artifact) => artifact.path === "page.png") ? `<section class="reviewed-page"><h2>Reviewed page</h2><a href="page.png"><img class="page-image" src="page.png" alt="Full-page screenshot from the security review"></a></section>` : "";
}

function renderCheckSection(title, checks, emptyMessage, open = false) {
  const content = checks.length === 0 ? `<p class="empty">${escapeHtml(emptyMessage)}</p>` : checks.map(renderCheck).join("\n");
  return `<details ${open ? "open" : ""}><summary><h2 style="display:inline">${escapeHtml(title)}</h2> (${checks.length})</summary>${content}</details>`;
}

function renderCheck(check) {
  return `<article class="check">
  <div class="check-header"><span class="badge badge-${escapeHtml(check.status)}">${escapeHtml(check.status)}</span><span class="method">${escapeHtml(check.method)}</span><h3>${escapeHtml(check.title)}</h3></div>
  <p><code>${escapeHtml(check.id)}</code></p>
  <div class="evidence"><strong>Evidence</strong>${renderValue(check.evidence)}</div>
  ${renderCheckArtifacts(check.artifacts)}
</article>`;
}

function renderValue(value) {
  if (value === null) return "<p><code>null</code></p>";
  if (Array.isArray(value)) return value.length === 0 ? "<p><code>[]</code></p>" : `<ul>${value.map((item) => `<li>${renderValue(item)}</li>`).join("")}</ul>`;
  if (typeof value === "object") {
    const entries = Object.entries(value);
    return entries.length === 0 ? "<p><code>{}</code></p>" : `<dl>${entries.map(([key, item]) => `<dt>${escapeHtml(formatLabel(key))}</dt><dd>${renderValue(item)}</dd>`).join("")}</dl>`;
  }

  return `<code>${escapeHtml(value)}</code>`;
}

function renderCheckArtifacts(artifacts) {
  if (!artifacts?.length) return "";
  return `<p class="note">Supporting artifacts: ${artifacts.map((artifact) => renderArtifactLink(artifact)).join(", ")}</p>`;
}

function renderCoverage(coverage, counts) {
  const items = ["automated", "partial", "manual"].flatMap((type) => coverage.items.filter((item) => item.automation === type));
  return `<section>
  <h2>Canonical checklist coverage</h2>
  <p class="note">${escapeHtml(counts.automated)} automated · ${escapeHtml(counts.partial)} partial · ${escapeHtml(counts.manual)} manual. Coverage describes how an item can be assessed; it is not the item's pass/fail result.</p>
  ${items.map((item) => `<details class="coverage"><summary><span class="badge badge-${coverageBadge(item.automation)}">${escapeHtml(item.automation)}</span> ${escapeHtml(item.checklistItem)}</summary><p><strong>Section:</strong> ${escapeHtml(item.section)}</p><p>${escapeHtml(item.note)}</p></details>`).join("\n")}
</section>`;
}

function coverageBadge(automation) {
  if (automation === "automated") return "pass";
  if (automation === "partial") return "warning";
  return "not-checked";
}

function renderLimitations(limitations) {
  return `<section><h2>Limitations</h2><ul>${limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join("")}</ul></section>`;
}

function renderArtifacts(artifacts) {
  const linkedArtifacts = artifacts.filter((artifact) => artifact.path !== "security-report.html");
  return `<section><h2>Artifacts</h2><ul>${linkedArtifacts.map((artifact) => `<li>${renderArtifactLink(artifact.path)} — ${escapeHtml(artifact.purpose)}</li>`).join("")}</ul></section>`;
}

function renderArtifactLink(artifactPath) {
  const safePath = safeRelativePath(artifactPath);
  return safePath ? `<a href="${safePath}">${escapeHtml(artifactPath)}</a>` : `<code>${escapeHtml(artifactPath)}</code>`;
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

function formatLabel(value) {
  return String(value).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("-", " ");
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
