import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assessHttpRedirect } from "../collectors/http-redirect.mjs";
import { DEFAULT_EVIDENCE_ROOT_DIRECTORY, getDefaultEvidenceOutputDirectory, runtimeSourceDirectory } from "../config/runtime-config.mjs";
import { writeLaunchHtmlReport } from "../reporting/launch-report.mjs";
import { writePerformanceHtmlReport } from "../reporting/performance-report.mjs";
import { writeSecurityHtmlReport } from "../reporting/security-report.mjs";
import { writeTechnicalSeoHtmlReport } from "../reporting/technical-seo-report.mjs";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const auditScript = path.join(scriptsDirectory, "audit.mjs");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
  process.exit(0);
}

const options = parseArguments(process.argv.slice(2));
const profile = await loadProfile(options.profile);
const auditArguments = ["--url", options.url, "--output", options.outputDirectory];

if (options.browser !== "auto") auditArguments.push("--browser", options.browser);
if (options.timeoutMs !== 45000) auditArguments.push("--timeout-ms", String(options.timeoutMs));
if (options.allowNoSandbox) auditArguments.push("--allow-no-sandbox");
if (options.includeErrorDetails) auditArguments.push("--include-error-details");
if (profile.runtime?.collectLaunch) auditArguments.push("--collect-launch");
if (profile.runtime?.collectSecurity) auditArguments.push("--collect-security");
if (profile.runtime?.collectSeo) auditArguments.push("--collect-seo");
if (profile.runtime?.skipAccessibility) auditArguments.push("--skip-accessibility");
if (profile.runtime?.skipLighthouse) auditArguments.push("--skip-lighthouse");

const auditResult = spawnSync(process.execPath, [auditScript, ...auditArguments], { cwd: process.cwd(), env: process.env, stdio: "inherit" });

if (auditResult.error) {
  throw auditResult.error;
}

if (auditResult.status !== 0) {
  process.exit(auditResult.status ?? 1);
}

const summary = await readJson(path.join(options.outputDirectory, "summary.json"));
const axeResult = summary.axe.status === "completed" ? await readJson(path.join(options.outputDirectory, "axe-results.json")) : null;
const lighthouseResult = summary.lighthouse.status === "completed" ? await readJson(path.join(options.outputDirectory, "lighthouse-report.json")) : null;
const securityResult = summary.security?.status === "completed" ? await readJson(path.join(options.outputDirectory, "security-results.json")) : null;
const seoResult = summary.seo?.status === "completed" ? await readJson(path.join(options.outputDirectory, "seo-results.json")) : null;
const launchResult = summary.launch?.status === "completed" ? await readJson(path.join(options.outputDirectory, "launch-results.json")) : null;
let evidence;

if (profile.id === "review-web-accessibility") evidence = await buildAccessibilityEvidence(profile, summary, axeResult, options.outputDirectory);
else if (profile.id === "review-website-launch") evidence = await buildLaunchEvidence(profile, summary, launchResult, options.outputDirectory);
else if (profile.id === "review-web-performance") evidence = await buildPerformanceEvidence(profile, summary, lighthouseResult, options.outputDirectory);
else if (profile.id === "review-web-security") evidence = await buildSecurityEvidence(profile, summary, securityResult, options.outputDirectory);
else if (profile.id === "review-technical-seo") evidence = await buildTechnicalSeoEvidence(profile, summary, lighthouseResult, seoResult, options.outputDirectory);
else throw new Error(`The review profile does not have an evidence builder: ${profile.id}`);

if (summary.page.screenshotReadiness?.status === "incomplete") {
  const readiness = summary.page.screenshotReadiness;
  evidence.limitations.push(`Screenshot preparation was incomplete: ${readiness.images.pending} pending, ${readiness.images.failed} failed, and ${readiness.images.missingSource} missing-source images; load state ${readiness.loadState}; time limit reached: ${readiness.timedOut}; scroll limit reached: ${readiness.scroll.limitReached}. See summary.json page.screenshotReadiness. This is a capture limitation, not a whole-site result.`);
}

const coverage = {
  schemaVersion: "1.0.0",
  profile: { id: profile.id, version: profile.version },
  checklistSource: profile.checklistSource,
  items: profile.coverage
};

if (profile.id === "review-web-security") {
  evidence.artifacts.push(
    { path: "evidence.json", purpose: "Normalized security check results" },
    { path: "coverage.json", purpose: "Canonical checklist automation map" },
    { path: "security-report.html", purpose: "Human-readable normalized security evidence and checklist coverage" }
  );
  await writeSecurityHtmlReport(evidence, coverage, path.join(options.outputDirectory, "security-report.html"));
}

if (profile.id === "review-website-launch") {
  evidence.artifacts.push(
    { path: "evidence.json", purpose: "Normalized launch preflight results" },
    { path: "coverage.json", purpose: "Canonical launch checklist automation map" },
    { path: "launch-readiness-report.html", purpose: "Human-readable homepage preflight and launch checklist coverage" }
  );
  await writeLaunchHtmlReport(evidence, coverage, path.join(options.outputDirectory, "launch-readiness-report.html"));
}

if (profile.id === "review-web-performance") {
  evidence.artifacts.push(
    { path: "evidence.json", purpose: "Normalized performance check results" },
    { path: "coverage.json", purpose: "Canonical checklist automation map" },
    { path: "performance-report.html", purpose: "Human-readable normalized performance evidence and checklist coverage" }
  );
  await writePerformanceHtmlReport(evidence, coverage, path.join(options.outputDirectory, "performance-report.html"));
}

if (profile.id === "review-technical-seo") {
  evidence.artifacts.push(
    { path: "evidence.json", purpose: "Normalized technical SEO check results" },
    { path: "coverage.json", purpose: "Canonical checklist automation map" },
    { path: "technical-seo-report.html", purpose: "Human-readable normalized technical SEO evidence and checklist coverage" }
  );
  await writeTechnicalSeoHtmlReport(evidence, coverage, path.join(options.outputDirectory, "technical-seo-report.html"));
}

await writeJson(path.join(options.outputDirectory, "evidence.json"), evidence);
await writeJson(path.join(options.outputDirectory, "coverage.json"), coverage);
console.log(`Deterministic ${profile.id} evidence package ready at ${options.outputDirectory}`);

async function buildAccessibilityEvidence(profileToUse, summary, axeResult, outputDirectory) {
  const checks = [];
  const axeArtifacts = ["axe-results.json"];

  if (await exists(path.join(outputDirectory, "axe-report.html"))) axeArtifacts.push("axe-report.html");

  const httpStatus = summary.page.httpStatus;
  const normalizedTitle = summary.page.title?.trim() ?? "";
  const normalizedLanguage = summary.page.language?.trim() ?? "";

  checks.push({
    id: "page-http-status",
    title: "The target returned a successful HTTP response",
    status: typeof httpStatus !== "number" ? "warning" : httpStatus >= 200 && httpStatus < 400 ? "pass" : "fail",
    method: "browser",
    evidence: { finalUrl: summary.page.finalUrl, httpStatus },
    artifacts: ["summary.json"]
  });
  checks.push({
    id: "document-title",
    title: "The rendered document has a title",
    status: normalizedTitle.length > 0 ? "pass" : "fail",
    method: "browser",
    evidence: { title: normalizedTitle || null },
    artifacts: ["summary.json"]
  });
  checks.push({
    id: "document-language",
    title: "The rendered document declares a language",
    status: normalizedLanguage.length > 0 ? "pass" : "fail",
    method: "browser",
    evidence: { language: normalizedLanguage || null },
    artifacts: ["summary.json"]
  });
  checks.push({
    id: "document-structure",
    title: "Rendered heading and landmark inventory",
    status: "informational",
    method: "browser",
    evidence: summary.page.structure,
    artifacts: ["summary.json", "page.png"]
  });

  if (summary.axe.status === "completed" && axeResult) {
    checks.push({
      id: "automated-axe-scan",
      title: "The automated axe scan completed",
      status: axeResult.violations.length === 0 ? "pass" : "fail",
      method: "axe",
      evidence: { incomplete: axeResult.incomplete.length, passes: axeResult.passes, violations: axeResult.violations.length },
      artifacts: axeArtifacts
    });

    for (const violation of axeResult.violations) {
      checks.push({
        id: `axe-${violation.id}`,
        title: violation.help,
        status: "fail",
        method: "axe",
        evidence: { affectedNodes: violation.nodes.length, description: violation.description, helpUrl: violation.helpUrl, impact: violation.impact, ruleId: violation.id, tags: violation.tags },
        artifacts: axeArtifacts
      });
    }
  } else {
    checks.push({
      id: "automated-axe-scan",
      title: "The automated axe scan completed",
      status: "not-checked",
      method: "axe",
      evidence: { error: summary.axe.error ?? null, runtimeStatus: summary.axe.status },
      artifacts: ["summary.json"]
    });
  }

  checks.push({
    id: "lighthouse-accessibility",
    title: "Lighthouse accessibility evidence",
    status: summary.lighthouse.status === "completed" ? "informational" : "not-checked",
    method: "lighthouse",
    evidence: summary.lighthouse.status === "completed" ? { score: summary.lighthouse.scores.accessibility } : { error: summary.lighthouse.error ?? null, runtimeStatus: summary.lighthouse.status },
    artifacts: summary.lighthouse.status === "completed" ? ["lighthouse-report.json", "lighthouse-report.html"] : ["summary.json"]
  });

  const browserErrorCount = summary.page.browserErrors.consoleErrorCount + summary.page.browserErrors.pageErrorCount;
  checks.push({
    id: "browser-errors",
    title: "Browser console and page error counts",
    status: browserErrorCount === 0 ? "pass" : "warning",
    method: "browser",
    evidence: { consoleErrorCount: summary.page.browserErrors.consoleErrorCount, detailsIncluded: summary.page.browserErrors.detailsFile !== null, pageErrorCount: summary.page.browserErrors.pageErrorCount },
    artifacts: summary.page.browserErrors.detailsFile ? ["summary.json", summary.page.browserErrors.detailsFile] : ["summary.json"]
  });

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["axe-results.json", "Reduced axe rule evidence"],
    ["axe-report.html", "Human-readable axe report with bounded element screenshots"],
    ["lighthouse-report.json", "Machine-readable Lighthouse report"],
    ["lighthouse-report.html", "Human-readable Lighthouse report"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = [];

  for (const [artifactPath, purpose] of artifactDefinitions) {
    if (await exists(path.join(outputDirectory, artifactPath))) {
      artifacts.push({ path: artifactPath, purpose });
    }
  }

  const limitations = [
    "This package covers one URL and does not prove whole-site or whole-application accessibility.",
    "Automated results do not replace keyboard, zoom, reflow, content-quality, workflow, or assistive-technology review.",
    "Lighthouse and axe overlap; their results must not be counted as independent proof of conformance.",
    "No screen reader was used by this deterministic runner."
  ];

  if (summary.axe.status !== "completed") limitations.push(`axe evidence was not completed: ${summary.axe.error ?? summary.axe.status}`);
  if (summary.lighthouse.status !== "completed") limitations.push(`Lighthouse evidence was not completed: ${summary.lighthouse.error ?? summary.lighthouse.status}`);

  return {
    schemaVersion: "1.0.0",
    profile: { id: profileToUse.id, standard: profileToUse.standard, version: profileToUse.version },
    target: { finalUrl: summary.page.finalUrl, requestedUrl: summary.requestedUrl },
    run: { browser: summary.browser, completedAt: summary.completedAt, startedAt: summary.startedAt },
    checks,
    artifacts,
    limitations
  };
}

async function buildPerformanceEvidence(profileToUse, summary, lighthouseResult, outputDirectory) {
  const checks = [];
  const lighthouseArtifacts = summary.lighthouse.status === "completed" ? ["lighthouse-report.json", "lighthouse-report.html"] : ["summary.json"];
  const addCheck = (id, title, status, method, evidenceToAdd, artifacts = lighthouseArtifacts) => checks.push({ id, title, status, method, evidence: evidenceToAdd, artifacts });
  const httpStatus = summary.page.httpStatus;
  const audits = lighthouseResult?.audits ?? {};
  const performanceScore = lighthouseResult?.categories?.performance?.score;

  addCheck("page-http-status", "Site returns a successful HTTP response", typeof httpStatus !== "number" ? "warning" : httpStatus >= 200 && httpStatus < 400 ? "pass" : "fail", "browser", { finalUrl: summary.page.finalUrl, httpStatus }, ["summary.json"]);
  addCheck("lighthouse-performance-run", "Lighthouse completes a repeatable desktop lab run", lighthouseResult ? "pass" : "not-checked", "lighthouse", lighthouseResult ? { formFactor: summary.lighthouse.formFactor, lighthouseVersion: lighthouseResult.lighthouseVersion, requestedUrl: lighthouseResult.requestedUrl } : { error: summary.lighthouse.error ?? null, runtimeStatus: summary.lighthouse.status });
  addCheck("lighthouse-performance-score", "Lighthouse reports a desktop performance score", typeof performanceScore === "number" ? "informational" : "not-checked", "lighthouse", { score: typeof performanceScore === "number" ? Math.round(performanceScore * 100) : null });

  const lcp = audits["largest-contentful-paint"];
  addCheck("lab-largest-contentful-paint", "Desktop lab LCP is within 2.5 seconds", typeof lcp?.numericValue !== "number" ? "not-checked" : lcp.numericValue <= 2500 ? "pass" : "warning", "lighthouse", { audit: summarizeLighthouseAudit(lcp), goodThresholdMilliseconds: 2500 });

  const cls = audits["cumulative-layout-shift"];
  addCheck("lab-cumulative-layout-shift", "Desktop lab CLS is 0.1 or less", typeof cls?.numericValue !== "number" ? "not-checked" : cls.numericValue <= 0.1 ? "pass" : "warning", "lighthouse", { audit: summarizeLighthouseAudit(cls), goodThreshold: 0.1 });

  const tbt = audits["total-blocking-time"];
  addCheck("lab-total-blocking-time", "Desktop lab TBT does not trigger Lighthouse attention", lighthouseAuditStatus([tbt]), "lighthouse", { audit: summarizeLighthouseAudit(tbt), note: "TBT is a lab diagnostic for responsiveness risk, not an INP measurement." });
  addCheck("lab-supporting-metrics", "Desktop lab reports supporting paint metrics", lighthouseResult ? "informational" : "not-checked", "lighthouse", {
    firstContentfulPaint: summarizeLighthouseAudit(audits["first-contentful-paint"]),
    speedIndex: summarizeLighthouseAudit(audits["speed-index"])
  });

  addAuditGroup("server-response-and-redirects", "Initial response and redirects do not trigger Lighthouse attention", ["server-response-time", "redirects", "document-latency-insight"]);
  addAuditGroup("resource-caching-and-compression", "Caching and compression do not trigger Lighthouse attention", ["cache-insight", "uses-long-cache-ttl", "uses-text-compression"]);
  addAuditGroup("image-delivery", "Image delivery does not trigger Lighthouse attention", ["image-delivery-insight", "image-size-responsive", "unsized-images"]);
  addAuditGroup("lcp-resource-loading", "LCP resource loading does not trigger Lighthouse attention", ["lcp-discovery-insight", "lcp-breakdown-insight"]);
  addAuditGroup("render-blocking-resources", "Render-blocking resources do not trigger Lighthouse attention", ["render-blocking-insight", "network-dependency-tree-insight"]);
  addAuditGroup("unused-code", "Unused and duplicated code does not trigger Lighthouse attention", ["unused-css-rules", "unused-javascript", "duplicated-javascript-insight", "legacy-javascript-insight"]);
  addAuditGroup("main-thread-work", "Main-thread work does not trigger Lighthouse attention", ["mainthread-work-breakdown", "long-tasks"]);
  addAuditGroup("layout-stability", "Layout shifts and animations do not trigger Lighthouse attention", ["layout-shifts", "non-composited-animations"]);
  addAuditGroup("third-party-impact", "Third-party code does not trigger Lighthouse attention", ["third-parties-insight", "third-party-summary"]);

  const browserErrorCount = summary.page.browserErrors.consoleErrorCount + summary.page.browserErrors.pageErrorCount;
  addCheck("browser-errors", "Page loads without browser console or page errors", browserErrorCount === 0 ? "pass" : "warning", "browser", { consoleErrorCount: summary.page.browserErrors.consoleErrorCount, detailsIncluded: summary.page.browserErrors.detailsFile !== null, pageErrorCount: summary.page.browserErrors.pageErrorCount }, summary.page.browserErrors.detailsFile ? ["summary.json", summary.page.browserErrors.detailsFile] : ["summary.json"]);

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["lighthouse-report.json", "Machine-readable Lighthouse report"],
    ["lighthouse-report.html", "Detailed human-readable Lighthouse report"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = [];

  for (const [artifactPath, purpose] of artifactDefinitions) {
    if (await exists(path.join(outputDirectory, artifactPath))) artifacts.push({ path: artifactPath, purpose });
  }

  const limitations = [
    "This package covers one URL and one 1440 × 900 desktop lab run; it does not prove whole-site or real-user performance.",
    "Lighthouse does not measure field INP in this page-load run. TBT is a diagnostic proxy, not an INP result.",
    "The runner does not collect mobile, warm-cache, geographic, authenticated, important-interaction, or degraded-dependency evidence.",
    "Lab metrics and scores can vary between runs and should be compared only under equivalent conditions.",
    "Source, CDN, private-cache, performance-budget, and production-monitoring conclusions require additional evidence."
  ];

  if (summary.lighthouse.status !== "completed") limitations.push(`Lighthouse evidence was not completed: ${summary.lighthouse.error ?? summary.lighthouse.status}`);

  return {
    schemaVersion: "1.0.0",
    profile: { id: profileToUse.id, standard: profileToUse.standard, version: profileToUse.version },
    target: { finalUrl: summary.page.finalUrl, requestedUrl: summary.requestedUrl },
    run: { browser: summary.browser, completedAt: summary.completedAt, startedAt: summary.startedAt },
    checks,
    artifacts,
    limitations
  };

  function addAuditGroup(id, title, auditIds) {
    const selectedAudits = auditIds.map((auditId) => audits[auditId]).filter(Boolean);
    addCheck(id, title, lighthouseAuditStatus(selectedAudits), "lighthouse", { audits: selectedAudits.map(summarizeLighthouseAudit) });
  }
}

function lighthouseAuditStatus(audits) {
  if (!audits.some(Boolean)) return "not-checked";
  const scoredAudits = audits.filter((audit) => typeof audit?.score === "number" && !new Set(["informative", "manual", "notApplicable"]).has(audit.scoreDisplayMode));
  if (scoredAudits.some((audit) => audit.score < 0.9)) return "warning";
  return scoredAudits.length > 0 ? "pass" : "informational";
}

function summarizeLighthouseAudit(audit) {
  if (!audit) return null;
  return {
    displayValue: audit.displayValue ?? null,
    id: audit.id,
    numericUnit: audit.numericUnit ?? null,
    numericValue: typeof audit.numericValue === "number" ? audit.numericValue : null,
    score: typeof audit.score === "number" ? audit.score : null,
    scoreDisplayMode: audit.scoreDisplayMode,
    title: audit.title
  };
}

async function buildTechnicalSeoEvidence(profileToUse, summary, lighthouseResult, seoResult, outputDirectory) {
  const checks = [];
  const audits = lighthouseResult?.audits ?? {};
  const lighthouseArtifacts = lighthouseResult ? ["lighthouse-report.json", "lighthouse-report.html"] : ["summary.json"];
  const seoArtifacts = seoResult ? ["seo-results.json"] : ["summary.json"];
  const addCheck = (id, title, status, method, evidenceToAdd, artifacts = seoArtifacts) => checks.push({ id, title, status, method, evidence: evidenceToAdd, artifacts });
  const httpStatus = summary.page.httpStatus;
  const finalUrl = new URL(summary.page.finalUrl);
  const documentSeo = seoResult?.document ?? null;

  addCheck("page-http-status", "Site returns an HTTP 200 response", typeof httpStatus !== "number" ? "not-checked" : httpStatus === 200 ? "pass" : "fail", "browser", { finalUrl: summary.page.finalUrl, httpStatus }, ["summary.json"]);
  addCheck("seo-collection", "Runner completes bounded technical SEO evidence collection", seoResult ? "pass" : "not-checked", "browser", seoResult ? { runtimeStatus: "completed" } : { error: summary.seo?.error ?? null, runtimeStatus: summary.seo?.status ?? "missing" }, ["summary.json"]);

  const seoScore = lighthouseResult?.categories?.seo?.score;
  addCheck("lighthouse-seo-run", "Lighthouse completes a desktop SEO review", lighthouseResult ? "pass" : "not-checked", "lighthouse", lighthouseResult ? { formFactor: summary.lighthouse.formFactor, lighthouseVersion: lighthouseResult.lighthouseVersion, requestedUrl: lighthouseResult.requestedUrl } : { error: summary.lighthouse.error ?? null, runtimeStatus: summary.lighthouse.status }, lighthouseArtifacts);
  addCheck("lighthouse-seo-score", "Lighthouse reports a desktop SEO score", typeof seoScore === "number" ? "informational" : "not-checked", "lighthouse", { score: typeof seoScore === "number" ? Math.round(seoScore * 100) : null }, lighthouseArtifacts);

  const crawlabilityAudit = audits["is-crawlable"];
  const robotDirectives = [seoResult?.responseHeaders?.["x-robots-tag"], ...(documentSeo?.metaRobots ?? []).map((directive) => directive.content)].filter(Boolean);
  const hasNoIndex = robotDirectives.some((directive) => /(?:^|[,\s])(noindex|none)(?:$|[,\s])/i.test(directive));
  const indexingStatus = typeof crawlabilityAudit?.score === "number" ? crawlabilityAudit.score === 1 ? "pass" : "fail" : hasNoIndex ? "fail" : "not-checked";
  addCheck("indexing-allowed", "Site allows the reviewed public page to be indexed", indexingStatus, "lighthouse", { audit: summarizeLighthouseAudit(crawlabilityAudit), directives: robotDirectives, noIndexObserved: hasNoIndex }, [...new Set([...lighthouseArtifacts, ...seoArtifacts])]);

  const titles = documentSeo?.titles ?? [];
  addCheck("document-title", "Site provides one non-empty document title", !documentSeo ? "not-checked" : titles.length === 1 && titles[0].length > 0 ? "pass" : "fail", "browser", { audit: summarizeLighthouseAudit(audits["document-title"]), titles }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const descriptions = documentSeo?.metaDescriptions ?? [];
  addCheck("meta-description", "Site provides one useful meta-description candidate", !documentSeo ? "not-checked" : descriptions.length === 1 && descriptions[0].length > 0 ? "pass" : "warning", "browser", { audit: summarizeLighthouseAudit(audits["meta-description"]), descriptions }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const headings = documentSeo?.headings ?? null;
  addCheck("main-heading", "Site exposes a main page heading", !headings ? "not-checked" : headings.h1Count > 0 ? "pass" : "warning", "browser", headings, seoArtifacts);

  const renderedContent = documentSeo?.content ?? null;
  addCheck("rendered-content", "Site exposes rendered text content without user interaction", !renderedContent ? "not-checked" : renderedContent.bodyTextLength === 0 ? "fail" : renderedContent.mainTextLength === 0 ? "warning" : "pass", "browser", renderedContent, ["seo-results.json", "page.png"]);

  const canonicals = [...(documentSeo?.canonicalElements ?? []), ...(seoResult?.httpCanonicalElements ?? [])];
  const canonicalAudit = audits.canonical;
  let canonicalStatus = "not-checked";
  if (documentSeo) {
    if (canonicals.length !== 1) canonicalStatus = "warning";
    else if (!canonicals[0].resolvedUrl || !canonicals[0].absolute || canonicals[0].hasFragment) canonicalStatus = "warning";
    else if (typeof canonicalAudit?.score === "number" && canonicalAudit.score < 1) canonicalStatus = "warning";
    else canonicalStatus = "pass";
  }
  addCheck("canonical-declaration", "Site declares one valid absolute canonical URL", canonicalStatus, "browser", { audit: summarizeLighthouseAudit(canonicalAudit), canonicals, finalUrl: summary.page.finalUrl, selfReferential: canonicals.length === 1 && stripFragment(canonicals[0].resolvedUrl) === stripFragment(summary.page.finalUrl) }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const linkAudits = [audits["crawlable-anchors"], audits["link-text"]];
  addCheck("crawlable-links", "Site uses crawlable links with descriptive text on the reviewed page", documentSeo ? lighthouseAuditStatus(linkAudits) : "not-checked", "lighthouse", { audits: linkAudits.filter(Boolean).map(summarizeLighthouseAudit), inventory: documentSeo?.linkInventory ?? null }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const robotsAudit = audits["robots-txt"];
  let robotsStatus = "not-checked";
  if (seoResult?.robotsTxt) {
    if (typeof robotsAudit?.score === "number" && robotsAudit.score < 1) robotsStatus = "warning";
    else robotsStatus = seoResult.robotsTxt.found ? "pass" : "informational";
  }
  addCheck("robots-txt", "Site provides valid robots.txt instructions when the file is present", robotsStatus, "lighthouse", { audit: summarizeLighthouseAudit(robotsAudit), observation: seoResult?.robotsTxt ?? null }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const sitemapResults = seoResult?.sitemaps ?? [];
  const accessibleSitemap = sitemapResults.find((sitemap) => sitemap.status === 200 && new Set(["urlset", "sitemapindex"]).has(sitemap.rootType) && !sitemap.contentType?.toLowerCase().includes("text/html"));
  addCheck("sitemap-discovery", "Site exposes an accessible XML sitemap", !seoResult ? "not-checked" : accessibleSitemap ? "pass" : "warning", "http", { declaredByRobotsTxt: seoResult?.robotsTxt?.sitemapUrls ?? [], results: sitemapResults }, seoArtifacts);

  const structuredData = documentSeo?.structuredData ?? null;
  let structuredDataStatus = "not-checked";
  if (structuredData) {
    if (structuredData.jsonLdParseErrorCount > 0) structuredDataStatus = "warning";
    else if (structuredData.jsonLdBlockCount > 0) structuredDataStatus = "pass";
    else structuredDataStatus = "informational";
  }
  addCheck("structured-data", "Site provides syntactically readable structured data when markup is present", structuredDataStatus, "browser", { audit: summarizeLighthouseAudit(audits["structured-data"]), observation: structuredData }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const alternateLanguages = documentSeo?.alternateLanguages ?? [];
  const hreflangAudit = audits.hreflang;
  const hreflangStatus = !documentSeo ? "not-checked" : alternateLanguages.length === 0 ? "informational" : typeof hreflangAudit?.score === "number" && hreflangAudit.score < 1 ? "warning" : "pass";
  addCheck("language-alternates", "Site declares valid language alternates when localized versions are present", hreflangStatus, "lighthouse", { alternates: alternateLanguages, audit: summarizeLighthouseAudit(hreflangAudit), htmlLanguage: documentSeo?.htmlLanguage ?? null }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  addCheck("https-url", "Site resolves the reviewed page to HTTPS", finalUrl.protocol === "https:" ? "pass" : "fail", "browser", { finalProtocol: finalUrl.protocol, finalUrl: finalUrl.href }, ["summary.json"]);

  const redirectChain = seoResult?.redirectChain ?? [];
  const redirectHops = Math.max(0, redirectChain.length - 1);
  addCheck("redirect-chain", "Site reaches the final page without a long redirect chain", !seoResult || redirectChain.length === 0 ? "not-checked" : redirectHops <= 1 ? "pass" : "warning", "browser", { hops: redirectHops, redirects: redirectChain }, seoArtifacts);

  const browserErrorCount = summary.page.browserErrors.consoleErrorCount + summary.page.browserErrors.pageErrorCount;
  addCheck("browser-errors", "Site renders without browser console or page errors", browserErrorCount === 0 ? "pass" : "warning", "browser", { consoleErrorCount: summary.page.browserErrors.consoleErrorCount, detailsIncluded: summary.page.browserErrors.detailsFile !== null, pageErrorCount: summary.page.browserErrors.pageErrorCount }, summary.page.browserErrors.detailsFile ? ["summary.json", summary.page.browserErrors.detailsFile] : ["summary.json"]);

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["seo-results.json", "Reduced rendered metadata, robots.txt, sitemap, link, and redirect observations"],
    ["lighthouse-report.json", "Machine-readable Lighthouse report"],
    ["lighthouse-report.html", "Detailed human-readable Lighthouse report"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = [];

  for (const [artifactPath, purpose] of artifactDefinitions) {
    if (await exists(path.join(outputDirectory, artifactPath))) artifacts.push({ path: artifactPath, purpose });
  }

  const limitations = [
    "This package covers one public URL and does not prove whole-site crawlability, indexability, metadata quality, or search performance.",
    "The runner inventories links on the reviewed page but does not fetch every link or perform an unbounded site crawl.",
    "robots.txt and sitemap collection is bounded to the authorized origin, one robots.txt file, and up to three sitemap previews; large files can be truncated.",
    "Canonical targets, hreflang relationships, structured data meaning, visible-content accuracy, and migration mappings require representative page and source review.",
    "The runner does not access Search Console, analytics, server logs, index coverage, ranking data, or historical baselines."
  ];

  if (summary.seo?.status !== "completed") limitations.push(`Technical SEO collection was not completed: ${summary.seo?.error ?? summary.seo?.status ?? "missing"}`);
  if (summary.lighthouse.status !== "completed") limitations.push(`Lighthouse evidence was not completed: ${summary.lighthouse.error ?? summary.lighthouse.status}`);

  return {
    schemaVersion: "1.0.0",
    profile: { id: profileToUse.id, standard: profileToUse.standard, version: profileToUse.version },
    target: { finalUrl: summary.page.finalUrl, requestedUrl: summary.requestedUrl },
    run: { browser: summary.browser, completedAt: summary.completedAt, startedAt: summary.startedAt },
    checks,
    artifacts,
    limitations
  };
}

async function buildLaunchEvidence(profileToUse, summary, launchResult, outputDirectory) {
  const checks = [];
  const launchArtifacts = ["launch-results.json"];
  const addCheck = (id, title, status, method, evidenceToAdd, artifacts = launchArtifacts) => checks.push({ id, title, status, method, evidence: evidenceToAdd, artifacts });
  const finalUrl = new URL(summary.page.finalUrl);
  const httpStatus = summary.page.httpStatus;

  addCheck("launch-collection", "Runner completes the bounded homepage launch preflight", launchResult ? "pass" : "not-checked", "browser", { checkedLinks: launchResult?.linkProbe?.tested ?? 0, error: summary.launch?.error ?? null, runtimeStatus: summary.launch?.status ?? "missing" }, launchResult ? launchArtifacts : ["summary.json"]);
  addCheck("page-http-status", "Homepage returns a successful HTTP response", typeof httpStatus !== "number" ? "warning" : httpStatus >= 200 && httpStatus < 300 ? "pass" : "fail", "browser", { finalUrl: summary.page.finalUrl, httpStatus }, ["summary.json"]);
  addCheck("https-url", "Homepage uses HTTPS", finalUrl.protocol === "https:" ? "pass" : "fail", "browser", { finalProtocol: finalUrl.protocol, finalUrl: finalUrl.href }, ["summary.json"]);

  const redirectAssessment = assessHttpRedirect(launchResult?.httpRedirect);
  addCheck("http-to-https-redirect", "Site redirects plain HTTP to HTTPS", redirectAssessment.status, "http", { ...(launchResult?.httpRedirect ?? { attempted: false }), assessment: redirectAssessment.reason });

  const regions = launchResult?.document?.regions;
  const missingRegions = !regions ? [] : [
    regions.headerCount === 0 ? "header" : null,
    regions.navigationCount === 0 ? "navigation" : null,
    regions.mainCount === 0 ? "main" : null,
    regions.footerCount === 0 ? "footer" : null
  ].filter(Boolean);
  addCheck("homepage-structure", "Homepage renders its header, navigation, main content, and footer", !regions ? "not-checked" : missingRegions.length === 0 ? "pass" : "warning", "browser", { missingRegions, regions: regions ?? null });

  addCheck("homepage-content-summary", "Homepage content is available for a high-level visual review", launchResult ? "informational" : "not-checked", "browser", { h1Text: launchResult?.document?.content?.h1Text ?? [], title: launchResult?.document?.content?.title ?? summary.page.title ?? "" }, ["summary.json", "page.png"]);

  const issues = launchResult?.document?.issues ?? [];
  const probeResults = launchResult?.linkProbe?.results ?? [];
  const visibleCounts = regions?.visibleLinkCounts ?? {};
  const addRegionCheck = (id, title, regionNames, visibleLinkCount, emptyStatus) => {
    const regionIssues = issues.filter((issue) => regionNames.includes(issue.region));
    const regionResults = probeResults.filter((result) => (result.regions ?? [result.region]).some((region) => regionNames.includes(region)));
    const confirmedBroken = regionResults.filter((result) => result.outcome === "fail");
    const inconclusive = regionResults.filter((result) => result.outcome === "warning");
    const unsetOrInvalid = launchResult?.document?.issueCountsByRegion
      ? regionNames.reduce((total, region) => total + (launchResult.document.issueCountsByRegion[region] ?? 0), 0)
      : regionIssues.length;
    const skippedByLimit = regionNames.reduce((total, region) => total + (launchResult?.linkProbe?.byRegion?.[region]?.skippedByLimit ?? 0), 0);
    const skippedByCollectorLimit = regionNames.reduce((total, region) => total + (launchResult?.document?.testCandidatesTruncatedByRegion?.[region] ?? 0), 0);
    let status = "pass";

    if (!launchResult) status = "not-checked";
    else if (visibleLinkCount === 0) status = emptyStatus;
    else if (confirmedBroken.length > 0) status = "fail";
    else if (unsetOrInvalid > 0 || inconclusive.length > 0) status = "warning";
    else if (skippedByLimit > 0 || skippedByCollectorLimit > 0) status = "not-checked";
    else if (regionResults.length === 0) status = "informational";

    addCheck(id, title, status, "http", {
      confirmedBroken: confirmedBroken.length,
      inconclusive: inconclusive.length,
      issues: regionIssues,
      linkResultsRequiringAttention: [...confirmedBroken, ...inconclusive],
      scope: "HTTP results cover sampled same-host destinations only; external destinations are not requested.",
      skippedByCollectorLimit,
      skippedByLimit,
      testedDestinations: regionResults.length,
      unsetOrInvalid,
      visibleLinks: visibleLinkCount
    });
  };

  addRegionCheck("homepage-navigation-links", "Homepage navigation links have usable destinations", ["navigation", "header"], (visibleCounts.navigation ?? 0) + (visibleCounts.header ?? 0), "fail");
  addRegionCheck("homepage-footer-links", "Homepage footer links have usable destinations", ["footer"], visibleCounts.footer ?? 0, "warning");
  addRegionCheck("homepage-content-links", "Homepage content links have usable destinations", ["main", "other"], (visibleCounts.main ?? 0) + (visibleCounts.other ?? 0), "informational");

  const linkProbe = launchResult?.linkProbe;
  const inventory = launchResult?.document?.inventory;
  const truncatedCandidates = launchResult?.document?.testCandidatesTruncated ?? 0;
  addCheck("homepage-link-check-coverage", "Runner checks a bounded same-host sample of homepage links", !linkProbe ? "not-checked" : linkProbe.skippedByLimit > 0 || truncatedCandidates > 0 ? "informational" : "pass", "http", {
    candidateCount: linkProbe?.candidateCount ?? 0,
    confirmedBrokenDestinations: linkProbe?.failed ?? 0,
    externalLinksNotRequested: inventory?.externalHttp ?? 0,
    limit: linkProbe?.limit ?? null,
    skippedByCollectorLimit: truncatedCandidates,
    skippedByProbeLimit: linkProbe?.skippedByLimit ?? 0,
    tested: linkProbe?.tested ?? 0
  });

  addCheck("indexing-allowed", "Homepage does not declare a noindex directive", !launchResult ? "not-checked" : launchResult.indexing.noindex ? "fail" : "pass", "browser", { metaRobots: launchResult?.document?.metaRobots ?? [], noindex: launchResult?.indexing?.noindex ?? null, xRobotsTag: launchResult?.indexing?.xRobotsTag ?? null });

  const browserErrorCount = summary.page.browserErrors.consoleErrorCount + summary.page.browserErrors.pageErrorCount;
  addCheck("browser-errors", "Homepage renders without browser console or page errors", browserErrorCount === 0 ? "pass" : "warning", "browser", { consoleErrorCount: summary.page.browserErrors.consoleErrorCount, detailsIncluded: summary.page.browserErrors.detailsFile !== null, pageErrorCount: summary.page.browserErrors.pageErrorCount }, summary.page.browserErrors.detailsFile ? ["summary.json", summary.page.browserErrors.detailsFile] : ["summary.json"]);

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered homepage screenshot"],
    ["launch-results.json", "Homepage structure, link, indexing, and redirect observations"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = [];

  for (const [artifactPath, purpose] of artifactDefinitions) {
    if (await exists(path.join(outputDirectory, artifactPath))) artifacts.push({ path: artifactPath, purpose });
  }

  const limitations = [
    "This is a high-level pre-launch review of one supplied homepage, not a whole-site audit or replacement for specialist accessibility, security, performance, SEO, privacy, or application testing.",
    "The runner checks at most 50 unique same-host HTTP(S) links found on the rendered homepage, prioritizing navigation, header, footer, and then content links; it does not request external destinations.",
    "Unset or JavaScript link destinations can represent intentional controls and require human review before being treated as broken.",
    "The runner does not submit forms, send email, authenticate, change content, deploy releases, inspect backups, access monitoring, or perform DNS, cache, search-index, analytics, consent, or rollback operations.",
    "The final go/no-go recommendation requires the exact release scope, current specialist-review status, known issues, owners, rollback readiness, and applicable human confirmations."
  ];

  if (summary.launch?.status !== "completed") limitations.push(`Launch collection was not completed: ${summary.launch?.error ?? summary.launch?.status ?? "missing"}`);

  return {
    schemaVersion: "1.0.0",
    profile: { id: profileToUse.id, standard: profileToUse.standard, version: profileToUse.version },
    target: { finalUrl: summary.page.finalUrl, requestedUrl: summary.requestedUrl },
    run: { browser: summary.browser, completedAt: summary.completedAt, startedAt: summary.startedAt },
    checks,
    artifacts,
    limitations
  };
}

function stripFragment(value) {
  if (!value) return null;
  const url = new URL(value);
  url.hash = "";
  return url.href;
}

async function buildSecurityEvidence(profileToUse, summary, securityResult, outputDirectory) {
  const checks = [];
  const finalUrl = new URL(summary.page.finalUrl);
  const headers = securityResult?.headers ?? {};
  const addCheck = (id, title, status, method, evidence, artifacts = ["security-results.json"]) => checks.push({ id, title, status, method, evidence, artifacts });
  const httpStatus = summary.page.httpStatus;

  addCheck("page-http-status", "Site returns a successful HTTP response", typeof httpStatus !== "number" ? "warning" : httpStatus >= 200 && httpStatus < 400 ? "pass" : "fail", "browser", { finalUrl: summary.page.finalUrl, httpStatus }, ["summary.json"]);

  if (!securityResult) {
    addCheck("security-collection", "Runner completes public security evidence collection", "not-checked", "browser", { error: summary.security?.error ?? null, runtimeStatus: summary.security?.status ?? "missing" }, ["summary.json"]);
  } else {
    addCheck("security-collection", "Runner completes public security evidence collection", "pass", "browser", { runtimeStatus: "completed" });
  }

  const certificate = securityResult?.certificate ?? null;
  addCheck("https-transport", "Site uses HTTPS", finalUrl.protocol === "https:" ? "pass" : "fail", "browser", { certificateObserved: certificate !== null, finalProtocol: finalUrl.protocol });

  if (certificate) {
    const now = Date.now();
    const validFrom = certificate.validFrom ? Date.parse(certificate.validFrom) : null;
    const validTo = certificate.validTo ? Date.parse(certificate.validTo) : null;
    const certificateDatesKnown = validFrom !== null && validTo !== null;
    const certificateCurrent = certificateDatesKnown && validFrom <= now && validTo >= now;
    addCheck("certificate-validity", "Site presents a currently valid HTTPS certificate", !certificateDatesKnown ? "warning" : certificateCurrent ? "pass" : "fail", "browser", certificate);
  } else {
    addCheck("certificate-validity", "Site presents a currently valid HTTPS certificate", "not-checked", "browser", { reason: finalUrl.protocol === "https:" ? "Certificate details were unavailable." : "The rendered page did not use HTTPS." });
  }

  const tlsBaseline = securityResult?.tlsBaseline ?? null;
  const negotiatedTls = tlsBaseline?.negotiated ?? null;
  const negotiatedTlsAccepted = negotiatedTls?.outcome === "accepted";
  const modernVersions = [tlsBaseline?.versions?.tls13, tlsBaseline?.versions?.tls12];
  const deprecatedVersions = [tlsBaseline?.versions?.tls11, tlsBaseline?.versions?.tls10];
  const supportsModernTls = modernVersions.some((result) => result?.outcome === "accepted");
  const modernTlsRejected = modernVersions.every((result) => result?.outcome === "rejected");
  const acceptsDeprecatedTls = deprecatedVersions.some((result) => result?.outcome === "accepted");
  const rejectsDeprecatedTls = deprecatedVersions.every((result) => result?.outcome === "rejected");

  addCheck("tls-cipher-suite", "Site negotiates a strong cipher suite", !tlsBaseline?.attempted || !negotiatedTlsAccepted ? "not-checked" : negotiatedTls.strongCipher ? "pass" : "fail", "tls", { cipher: negotiatedTls?.cipher ?? null, protocol: negotiatedTls?.protocol ?? null });
  addCheck("tls-forward-secrecy", "Site uses a forward-secret key exchange", !tlsBaseline?.attempted || !negotiatedTlsAccepted ? "not-checked" : negotiatedTls.forwardSecret ? "pass" : "fail", "tls", { cipher: negotiatedTls?.cipher ?? null, ephemeralKey: negotiatedTls?.ephemeralKey ?? null, protocol: negotiatedTls?.protocol ?? null });
  addCheck("tls-key-exchange-group", "Site negotiates an approved key-exchange group", !tlsBaseline?.attempted || !negotiatedTlsAccepted || negotiatedTls.approvedKeyExchangeGroup === null ? "not-checked" : negotiatedTls.approvedKeyExchangeGroup ? "pass" : "warning", "tls", { ephemeralKey: negotiatedTls?.ephemeralKey ?? null });
  addCheck("tls-supported-versions", "Site supports TLS 1.3 or TLS 1.2", !tlsBaseline?.attempted ? "not-checked" : supportsModernTls ? "pass" : modernTlsRejected ? "fail" : "not-checked", "tls", { tls12: tlsBaseline?.versions?.tls12 ?? null, tls13: tlsBaseline?.versions?.tls13 ?? null });
  addCheck("tls-deprecated-versions", "Site rejects TLS 1.0 and TLS 1.1", !tlsBaseline?.attempted ? "not-checked" : acceptsDeprecatedTls ? "fail" : rejectsDeprecatedTls ? "pass" : "not-checked", "tls", { tls10: tlsBaseline?.versions?.tls10 ?? null, tls11: tlsBaseline?.versions?.tls11 ?? null });

  const redirect = securityResult?.httpRedirect;
  const redirectAssessment = assessHttpRedirect(redirect);
  addCheck("http-to-https-redirect", "Site redirects plain HTTP to HTTPS", redirectAssessment.status, "http", { ...(redirect ?? { attempted: false }), assessment: redirectAssessment.reason });

  const insecureResourceCounts = securityResult?.document?.insecureResourceCounts ?? {};
  const insecureReferenceCount = Object.values(insecureResourceCounts).reduce((total, count) => total + count, 0) + (securityResult?.document?.insecureFormActionCount ?? 0);
  const insecureRequestCount = finalUrl.protocol === "https:" ? securityResult?.requestProtocolCounts?.http ?? 0 : 0;
  addCheck("insecure-page-resources", "Site uses HTTPS for rendered resources and form actions", !securityResult || finalUrl.protocol !== "https:" ? "not-checked" : insecureReferenceCount + insecureRequestCount === 0 ? "pass" : "fail", "browser", { insecureFormActionCount: securityResult?.document?.insecureFormActionCount ?? null, insecureRequestCount, insecureResourceCounts });

  const hsts = headers["strict-transport-security"] ?? null;
  const hstsMaxAge = hsts?.match(/(?:^|;)\s*max-age=(\d+)/i)?.[1] ?? null;
  addCheck("strict-transport-security", "Site presents an active HSTS policy", !securityResult || finalUrl.protocol !== "https:" ? "not-checked" : hstsMaxAge && Number(hstsMaxAge) > 0 ? "pass" : "warning", "browser", { header: hsts, maxAge: hstsMaxAge === null ? null : Number(hstsMaxAge) });

  const csp = headers["content-security-policy"] ?? null;
  const cspConcerns = [];

  if (csp?.includes("'unsafe-eval'")) cspConcerns.push("unsafe-eval");
  if (csp?.includes("'unsafe-inline'") && !/nonce-|sha(256|384|512)-|'strict-dynamic'/.test(csp)) cspConcerns.push("unsafe-inline without a nonce, hash, or strict-dynamic");
  addCheck("content-security-policy", "Site includes an enforced Content Security Policy", !securityResult ? "not-checked" : csp ? cspConcerns.length === 0 ? "pass" : "warning" : "warning", "browser", { concerns: cspConcerns, enforcedPolicy: csp, reportOnlyPolicy: headers["content-security-policy-report-only"] ?? null });

  const frameAncestors = csp?.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i)?.[1]?.trim() ?? null;
  const xFrameOptions = headers["x-frame-options"] ?? null;
  const framingRestricted = frameAncestors !== null && frameAncestors !== "*" || /^(DENY|SAMEORIGIN)$/i.test(xFrameOptions ?? "");
  addCheck("framing-protection", "Site restricts framing", !securityResult ? "not-checked" : framingRestricted ? "pass" : "warning", "browser", { frameAncestors, xFrameOptions });

  const contentTypeOptions = headers["x-content-type-options"] ?? null;
  addCheck("content-type-protection", "Site prevents content-type sniffing", !securityResult ? "not-checked" : contentTypeOptions?.toLowerCase() === "nosniff" ? "pass" : "warning", "browser", { xContentTypeOptions: contentTypeOptions });

  const referrerPolicy = headers["referrer-policy"] ?? null;
  addCheck("referrer-policy", "Site sends an explicit Referrer-Policy header", !securityResult ? "not-checked" : referrerPolicy === null ? "informational" : referrerPolicy.toLowerCase().includes("unsafe-url") ? "warning" : "pass", "browser", { referrerPolicy });

  const issuedCookies = securityResult?.cookies?.issued ?? [];
  const cookieConcerns = issuedCookies.flatMap((cookie) => {
    const concerns = [];

    if (finalUrl.protocol === "https:" && !cookie.secure) concerns.push(`${cookie.name}: missing Secure`);
    if (cookie.sameSite?.toLowerCase() === "none" && !cookie.secure) concerns.push(`${cookie.name}: SameSite=None without Secure`);
    return concerns;
  });
  addCheck("public-cookie-flags", "Site protects public cookies with appropriate attributes", !securityResult ? "not-checked" : cookieConcerns.length > 0 ? "warning" : issuedCookies.length > 0 ? "pass" : "informational", "browser", { accepted: securityResult?.cookies?.accepted ?? [], concerns: cookieConcerns, issued: issuedCookies });

  const cors = securityResult?.cors ?? {};
  const corsInvalid = cors["access-control-allow-origin"] === "*" && cors["access-control-allow-credentials"]?.toLowerCase() === "true";
  addCheck("cors-policy", "Site avoids unsafe wildcard CORS with credentials", !securityResult ? "not-checked" : corsInvalid ? "warning" : "informational", "browser", { headers: cors, invalidWildcardWithCredentials: corsInvalid });

  const disclosureHeaders = Object.fromEntries(["server", "x-powered-by", "x-aspnet-version", "x-xss-protection"].filter((name) => headers[name] !== undefined).map((name) => [name, headers[name]]));
  const disclosureConcerns = [];

  if (headers["x-powered-by"]) disclosureConcerns.push("x-powered-by is exposed");
  if (headers["x-aspnet-version"]) disclosureConcerns.push("x-aspnet-version is exposed");
  if (/\d/.test(headers.server ?? "")) disclosureConcerns.push("server appears to expose a version");
  if (headers["x-xss-protection"] && headers["x-xss-protection"] !== "0") disclosureConcerns.push("deprecated x-xss-protection is enabled");
  addCheck("response-disclosure", "Site avoids disclosing unnecessary server details", !securityResult ? "not-checked" : disclosureConcerns.length > 0 ? "warning" : "pass", "browser", { concerns: disclosureConcerns, headers: disclosureHeaders });

  const securityTxt = securityResult?.securityTxt ?? null;
  addCheck("security-txt", "Site publishes a valid security.txt file", !securityResult ? "not-checked" : securityTxt?.valid ? "pass" : securityTxt?.found ? "warning" : "informational", "http", securityTxt ?? { found: false });

  const browserErrorCount = summary.page.browserErrors.consoleErrorCount + summary.page.browserErrors.pageErrorCount;
  addCheck("browser-errors", "Site loads without browser console or page errors", browserErrorCount === 0 ? "pass" : "warning", "browser", { consoleErrorCount: summary.page.browserErrors.consoleErrorCount, detailsIncluded: summary.page.browserErrors.detailsFile !== null, pageErrorCount: summary.page.browserErrors.pageErrorCount }, summary.page.browserErrors.detailsFile ? ["summary.json", summary.page.browserErrors.detailsFile] : ["summary.json"]);

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["security-results.json", "Reduced public transport, header, cookie, and disclosure evidence"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = [];

  for (const [artifactPath, purpose] of artifactDefinitions) {
    if (await exists(path.join(outputDirectory, artifactPath))) artifacts.push({ path: artifactPath, purpose });
  }

  return {
    schemaVersion: "1.0.0",
    profile: { id: profileToUse.id, standard: profileToUse.standard, version: profileToUse.version },
    target: { finalUrl: summary.page.finalUrl, requestedUrl: summary.requestedUrl },
    run: { browser: summary.browser, completedAt: summary.completedAt, startedAt: summary.startedAt },
    checks,
    artifacts,
    limitations: [
      "This package covers one public URL and does not prove whole-site or whole-application security.",
      "No injection payloads, authentication attempts, endpoint enumeration, port scans, form submissions, or vulnerability exploitation were performed.",
      "The runner performs bounded TLS version handshakes and evaluates the normally negotiated cipher and key exchange; it does not enumerate every accepted cipher suite or test server cipher preference.",
      "Headers, cookies, and browser observations require application context and do not prove that source code, authorization, authenticated workflows, or operational controls are secure.",
      "The HTTP redirect and security.txt probes are limited to the authorized hostname or origin."
    ]
  };
}

function parseArguments(argumentsToParse) {
  const optionsToReturn = { allowNoSandbox: false, browser: "auto", includeErrorDetails: false, outputDirectory: null, profile: null, timeoutMs: 45000, url: null };

  for (let index = 0; index < argumentsToParse.length; index += 1) {
    const argument = argumentsToParse[index];

    if (["--browser", "--output", "--profile", "--timeout-ms", "--url"].includes(argument)) {
      const value = argumentsToParse[index + 1];

      if (!value) throw new Error(`Missing value for ${argument}.`);
      index += 1;
      if (argument === "--browser") optionsToReturn.browser = value;
      if (argument === "--output") optionsToReturn.outputDirectory = path.resolve(value);
      if (argument === "--profile") optionsToReturn.profile = value;
      if (argument === "--timeout-ms") optionsToReturn.timeoutMs = Number.parseInt(value, 10);
      if (argument === "--url") optionsToReturn.url = new URL(value).href;
      continue;
    }

    if (argument === "--allow-no-sandbox") optionsToReturn.allowNoSandbox = true;
    else if (argument === "--include-error-details") optionsToReturn.includeErrorDetails = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (!optionsToReturn.profile || !optionsToReturn.url) throw new Error("--profile and --url are required.");
  if (!new Set(["auto", "chrome", "edge", "chromium"]).has(optionsToReturn.browser)) throw new Error("--browser must be auto, chrome, edge, or chromium.");
  if (!Number.isInteger(optionsToReturn.timeoutMs) || optionsToReturn.timeoutMs < 1000 || optionsToReturn.timeoutMs > 120000) throw new Error("--timeout-ms must be an integer from 1000 through 120000.");

  // Keep old CLI commands working, but use one canonical profile and output group.
  if (optionsToReturn.profile === "prepare-website-launch") optionsToReturn.profile = "review-website-launch";

  if (!optionsToReturn.outputDirectory) {
    optionsToReturn.outputDirectory = getDefaultEvidenceOutputDirectory(optionsToReturn.profile, new URL(optionsToReturn.url));
  }

  return optionsToReturn;
}

async function loadProfile(profileId) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profileId)) throw new Error(`Invalid profile id: ${profileId}`);
  const profilePath = path.join(runtimeSourceDirectory, "profiles", `${profileId}.json`);

  try {
    return await readJson(profilePath);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`Unknown review profile: ${profileId}`);
    throw error;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function printUsage() {
  console.log("Usage: node runtime/scripts/review.mjs --profile <profile-id> --url <https://site.example> [options]");
  console.log("Launch profile: review-website-launch (legacy alias: prepare-website-launch)");
  console.log("");
  console.log("Options:");
  console.log(`  --output <directory>                    Override the default ${DEFAULT_EVIDENCE_ROOT_DIRECTORY}/<profile>/<host>/<run-id> directory`);
  console.log("  --browser <auto|chrome|edge|chromium>  Browser selection; default: auto");
  console.log("  --allow-no-sandbox                       Allow an unsandboxed root run in an isolated environment");
  console.log("  --include-error-details                  Write truncated console/page error details");
  console.log("  --timeout-ms <milliseconds>             Navigation timeout; default: 45000");
}
