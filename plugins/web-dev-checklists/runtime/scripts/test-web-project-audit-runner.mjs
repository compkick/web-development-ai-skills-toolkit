import { createFixtureDirectory, listen, closeFixture, runCommand, readJson, assertEvidence, assertCheckStatus, assertArtifacts, sendHtml } from "../testing/fixture-harness.mjs";
import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { writeWebProjectAuditHtmlReport } from "../reporting/web-project-audit-report.mjs";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const runtimeDirectory = path.resolve(scriptsDirectory, "..");
const reviewScript = path.join(scriptsDirectory, "review.mjs");
const passFixtureTemplate = await readFile(path.join(runtimeDirectory, "fixtures", "audit-pass.html"), "utf8");
const failFixture = await readFile(path.join(runtimeDirectory, "fixtures", "audit-fail.html"), "utf8");
const testDirectory = await createFixtureDirectory("ai-agent-skills-toolkit-web-audit-test-");
const run = (command, args, cwd = testDirectory) => runCommand(command, args, cwd);
const passOutputDirectory = path.join(testDirectory, "pass-output");
const failOutputDirectory = path.join(testDirectory, "fail-output");
let baseUrl;
const server = http.createServer((request, response) => {
  if (request.url === "/favicon.ico") return send(response, 204, "", { "Content-Type": "image/x-icon" });
  if (request.url === "/robots.txt") return send(response, 200, `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`, { "Content-Type": "text/plain; charset=utf-8" });
  if (request.url === "/sitemap.xml") return send(response, 200, `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/pass</loc></url></urlset>`, { "Content-Type": "application/xml; charset=utf-8" });
  if (request.url === "/.well-known/security.txt") return send(response, 200, "Contact: mailto:security@example.invalid\n", { "Content-Type": "text/plain; charset=utf-8" });
  if (request.url === "/pass") return sendHtml(response, passFixtureTemplate.replaceAll("{{BASE_URL}}", baseUrl), protectedHeaders());
  if (request.url === "/fail") return sendHtml(response, failFixture);
  if (request.url === "/about") return sendHtml(response, '<!doctype html><html lang="en"><head><title>About</title></head><body><main><h1>About</h1></main></body></html>');
  if (request.url === "/privacy") return sendHtml(response, '<!doctype html><html lang="en"><head><title>Privacy</title></head><body><main><h1>Privacy</h1></main></body></html>');
  return send(response, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
});

try {
  await listen(server);

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
  await run(process.execPath, [reviewScript, "--profile", "audit-web-project", "--url", `${baseUrl}/pass`, "--output", passOutputDirectory]);
  await run(process.execPath, [reviewScript, "--profile", "audit-web-project", "--url", `${baseUrl}/fail`, "--output", failOutputDirectory]);

  const passEvidence = await readJson(path.join(passOutputDirectory, "evidence.json"));
  const failEvidence = await readJson(path.join(failOutputDirectory, "evidence.json"));
  const coverage = await readJson(path.join(failOutputDirectory, "coverage.json"));
  const failReport = await readFile(path.join(failOutputDirectory, "web-project-audit-report.html"), "utf8");

  assertEvidence(passEvidence, "audit-web-project");
  assertEvidence(failEvidence, "audit-web-project");

  for (const checkId of ["audit-public-site-summary", "audit-accessibility-summary", "audit-security-summary", "audit-performance-summary", "audit-technical-seo-summary", "audit-homepage-summary"]) {
    if (!failEvidence.checks.some((check) => check.id === checkId)) throw new Error(`Web project audit evidence is missing ${checkId}.`);
  }

  assertCheckStatus(failEvidence, "audit-accessibility-summary", "fail");
  assertCheckStatus(failEvidence, "audit-technical-seo-summary", "fail");
  assertCheckStatus(failEvidence, "audit-homepage-summary", "fail");
  const accessibilitySummary = failEvidence.checks.find((check) => check.id === "audit-accessibility-summary");
  if (accessibilitySummary.evidence.observations.some((observation) => observation.id === "automated-axe-scan")) {
    throw new Error("Combined audit incorrectly reports a completed axe scan as a problem.");
  }
  const failAxe = await readJson(path.join(failOutputDirectory, "axe-results.json"));
  const manualReview = accessibilitySummary.evidence.observations.find((observation) => observation.id === "axe-manual-review");
  if (Boolean(manualReview) !== (failAxe.incomplete.length > 0) || manualReview && manualReview.status !== "warning") {
    throw new Error("Combined audit lost or misclassified axe manual-review results.");
  }

  if (coverage.schemaVersion !== "1.0.0" || coverage.profile.id !== "audit-web-project" || coverage.items.length !== 20) {
    throw new Error("Coverage output does not contain the complete web project audit profile.");
  }

  if (!coverage.items.some((item) => item.automation === "partial") || !coverage.items.some((item) => item.automation === "manual")) {
    throw new Error("Web project audit coverage must distinguish partial and manual review requirements.");
  }

  if (!failReport.includes("Web Project Audit Report") || !failReport.includes("Public evidence: Problems found") || !failReport.includes("Canonical audit checklist coverage") || !failReport.includes("Partially automated") || /<script(?:\s|>)/i.test(failReport)) {
    throw new Error("Web project audit did not produce the expected safe human-readable report.");
  }

  await verifyReportStates(passEvidence, coverage);

  for (const outputDirectory of [passOutputDirectory, failOutputDirectory]) {
    await assertArtifacts(outputDirectory, ["evidence.json", "coverage.json", "summary.json", "page.png", "axe-results.json", "accessibility-report.html", "lighthouse-report.json", "lighthouse-report.html", "security-results.json", "security-report.html", "seo-results.json", "technical-seo-report.html", "launch-results.json", "launch-readiness-report.html", "performance-report.html", "web-project-audit-report.html"]);
  }

  console.log("Deterministic web project audit self-test passed for combined public evidence, problem, healthy-summary, and incomplete-summary cases.");
} finally {
  await closeFixture(server, testDirectory);
}

async function verifyReportStates(sourceEvidence, coverage) {
  const healthy = structuredClone(sourceEvidence);
  for (const check of healthy.checks) check.status = "pass";
  const incomplete = structuredClone(healthy);
  incomplete.checks.find((check) => check.id === "audit-public-site-summary").status = "not-checked";
  incomplete.checks.find((check) => check.id === "audit-performance-summary").status = "not-checked";

  for (const [name, evidence, expected] of [["healthy", healthy, "Generally healthy"], ["incomplete", incomplete, "Incomplete evidence"]]) {
    const reportPath = path.join(testDirectory, `${name}-audit-report.html`);
    await writeWebProjectAuditHtmlReport(evidence, coverage, reportPath);
    const report = await readFile(reportPath, "utf8");
    if (!report.includes(`Public evidence: ${expected}`)) throw new Error(`${name} audit report did not show ${expected}.`);
  }
}

function protectedHeaders() {
  return {
    "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'; form-action 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff"
  };
}

function send(response, status, body, headers = {}) {
  response.writeHead(status, headers);
  response.end(body);
}
