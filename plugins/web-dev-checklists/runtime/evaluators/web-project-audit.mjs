import { createEvidence, collectArtifacts, exists } from "../evidence/package.mjs";
import path from "node:path";


export async function buildWebProjectAuditEvidence(profileToUse, summary, components, outputDirectory) {
  const areaDefinitions = [
    { area: "Accessibility", collectorCheckId: "automated-axe-scan", evidence: components.accessibility, id: "audit-accessibility-summary", artifacts: ["accessibility-report.html", "lighthouse-report.html"] },
    { area: "Security", collectorCheckId: "security-collection", evidence: components.security, id: "audit-security-summary", artifacts: ["security-report.html"] },
    { area: "Performance", collectorCheckId: "lighthouse-performance-run", evidence: components.performance, id: "audit-performance-summary", artifacts: ["performance-report.html", "lighthouse-report.html"] },
    { area: "Technical SEO", collectorCheckId: "seo-collection", evidence: components.seo, id: "audit-technical-seo-summary", artifacts: ["technical-seo-report.html", "lighthouse-report.html"] },
    { area: "Homepage and links", collectorCheckId: "launch-collection", evidence: components.launch, id: "audit-homepage-summary", artifacts: ["launch-readiness-report.html"] }
  ];
  const areaChecks = [];

  for (const definition of areaDefinitions) {
    definition.artifacts = (await Promise.all(definition.artifacts.map(async (artifactPath) => ({ artifactPath, exists: await exists(path.join(outputDirectory, artifactPath)) })))).filter((artifact) => artifact.exists).map((artifact) => artifact.artifactPath);
    areaChecks.push(summarizeAuditArea(definition));
  }
  const overallCounts = countStatuses(areaChecks);
  const overallStatus = overallCounts.fail > 0 ? "fail" : overallCounts["not-checked"] > 0 ? "not-checked" : overallCounts.warning > 0 ? "warning" : "pass";
  const checks = [{
    id: "audit-public-site-summary",
    title: "Public website baseline is collected across the core review areas",
    status: overallStatus,
    method: "combined",
    evidence: { areas: areaChecks.map((check) => ({ area: check.evidence.area, status: check.status })), counts: overallCounts },
    artifacts: ["web-project-audit-report.html"]
  }, ...areaChecks];
  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["axe-results.json", "Reduced axe rule evidence"],
    ["accessibility-report.html", "Human-readable axe report with bounded element screenshots"],
    ["lighthouse-report.json", "Machine-readable Lighthouse report"],
    ["lighthouse-report.html", "Detailed human-readable Lighthouse report"],
    ["security-results.json", "Reduced public security observations"],
    ["security-report.html", "Human-readable security evidence"],
    ["seo-results.json", "Reduced technical SEO observations"],
    ["technical-seo-report.html", "Human-readable technical SEO evidence"],
    ["launch-results.json", "Reduced homepage and link observations"],
    ["launch-readiness-report.html", "Human-readable homepage preflight evidence"],
    ["performance-report.html", "Human-readable performance evidence"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = await collectArtifacts(outputDirectory, artifactDefinitions);

  return createEvidence(profileToUse, summary, {
    checks,
    artifacts,
    limitations: [
      "This deterministic package reviews one public desktop page and does not prove whole-project or whole-site health.",
      "Repository setup, architecture, dependencies, tests, deployment, private environments, operations, backups, ownership, privacy, CMS governance, and authenticated journeys require agent or human evidence.",
      "Automated accessibility evidence does not replace keyboard, responsive, zoom, content-quality, workflow, or assistive-technology review.",
      "Lighthouse provides one desktop lab run, not real-user, mobile, warm-cache, geographic, or field performance evidence.",
      "Public security observations are not a penetration test and do not verify source, authenticated controls, authorization, data handling, or operations.",
      "Technical SEO and homepage evidence cover one supplied page plus bounded supporting requests, not a representative whole-site crawl."
    ]
  });
}

function summarizeAuditArea(definition) {
  const counts = countStatuses(definition.evidence.checks);
  const collectorCheck = definition.evidence.checks.find((check) => check.id === definition.collectorCheckId);
  const collectorIncomplete = !collectorCheck || collectorCheck.status === "not-checked";
  const status = collectorIncomplete ? "not-checked" : counts.fail > 0 ? "fail" : counts.warning > 0 ? "warning" : "pass";
  const observations = definition.evidence.checks
    .filter((check) => new Set(["fail", "warning", "not-checked"]).has(check.status))
    .slice(0, 12)
    .map((check) => ({ id: check.id, status: check.status, title: check.title }));

  return {
    id: definition.id,
    title: `${definition.area} public evidence`,
    status,
    method: "combined",
    evidence: { area: definition.area, counts, observations, omittedObservationCount: Math.max(0, counts.fail + counts.warning + counts["not-checked"] - observations.length) },
    artifacts: definition.artifacts
  };
}

function countStatuses(checks) {
  return Object.fromEntries(["fail", "warning", "not-checked", "informational", "pass"].map((status) => [status, checks.filter((check) => check.status === status).length]));
}
