import { createEvidence, collectArtifacts } from "../evidence/package.mjs";
import { browserErrorsCheck } from "./browser.mjs";
import { lighthouseAuditStatus, summarizeLighthouseAudit } from "./lighthouse.mjs";

export async function buildPerformanceEvidence(profileToUse, summary, lighthouseResult, outputDirectory) {
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

  checks.push(browserErrorsCheck(summary, "Page loads without browser console or page errors"));

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["lighthouse-report.json", "Machine-readable Lighthouse report"],
    ["lighthouse-report.html", "Detailed human-readable Lighthouse report"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = await collectArtifacts(outputDirectory, artifactDefinitions);

  const limitations = [
    "This package covers one URL and one 1440 × 900 desktop lab run; it does not prove whole-site or real-user performance.",
    "Lighthouse does not measure field INP in this page-load run. TBT is a diagnostic proxy, not an INP result.",
    "The runner does not collect mobile, warm-cache, geographic, authenticated, important-interaction, or degraded-dependency evidence.",
    "Lab metrics and scores can vary between runs and should be compared only under equivalent conditions.",
    "Source, CDN, private-cache, performance-budget, and production-monitoring conclusions require additional evidence."
  ];

  if (summary.lighthouse.status !== "completed") limitations.push(`Lighthouse evidence was not completed: ${summary.lighthouse.error ?? summary.lighthouse.status}`);

  return createEvidence(profileToUse, summary, {
    checks,
    artifacts,
    limitations
  });

  function addAuditGroup(id, title, auditIds) {
    const selectedAudits = auditIds.map((auditId) => audits[auditId]).filter(Boolean);
    addCheck(id, title, lighthouseAuditStatus(selectedAudits), "lighthouse", { audits: selectedAudits.map(summarizeLighthouseAudit) });
  }
}
