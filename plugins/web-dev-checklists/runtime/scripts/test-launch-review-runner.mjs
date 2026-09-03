import { access, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { writeLaunchHtmlReport } from "../reporting/launch-report.mjs";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const runtimeDirectory = path.resolve(scriptsDirectory, "..");
const reviewScript = path.join(scriptsDirectory, "review.mjs");
const passFixture = await readFile(path.join(runtimeDirectory, "fixtures", "launch-pass.html"), "utf8");
const failFixture = await readFile(path.join(runtimeDirectory, "fixtures", "launch-fail.html"), "utf8");
const limitFixture = passFixture.replace(/<nav aria-label="Primary navigation">[\s\S]*?<\/nav>/, `<nav aria-label="Primary navigation">${Array.from({ length: 51 }, (_, index) => `<a href="/sample-${index}">Page ${index}</a>`).join(" ")}</nav>`);
const testDirectory = await mkdtemp(path.join(os.tmpdir(), "web-dev-checklists-launch-test-"));
const passOutputDirectory = path.join(testDirectory, "pass-output");
const failOutputDirectory = path.join(testDirectory, "fail-output");
const limitOutputDirectory = path.join(testDirectory, "limit-output");
const requests = new Map();
const server = http.createServer((request, response) => {
  requests.set(request.url, (requests.get(request.url) ?? 0) + 1);
  if (request.url === "/favicon.ico") {
    response.writeHead(204);
    return response.end();
  }

  if (request.url === "/pass") return sendHtml(response, passFixture);
  if (request.url === "/fail") return sendHtml(response, failFixture);
  if (request.url === "/limit") return sendHtml(response, limitFixture);
  if (["/about", "/services", "/details", "/privacy"].includes(request.url) || /^\/sample-\d+$/.test(request.url)) return sendHtml(response, "<!doctype html><title>Linked fixture page</title><p>Linked page</p>");

  if (request.url === "/server-error") {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    return response.end("Intentional server error");
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  await run(process.execPath, [reviewScript, "--profile", "prepare-website-launch", "--url", `${baseUrl}/pass`, "--output", passOutputDirectory]);
  await run(process.execPath, [reviewScript, "--profile", "prepare-website-launch", "--url", `${baseUrl}/fail`, "--output", failOutputDirectory]);
  await run(process.execPath, [reviewScript, "--profile", "prepare-website-launch", "--url", `${baseUrl}/limit`, "--output", limitOutputDirectory]);

  const passEvidence = await readJson(path.join(passOutputDirectory, "evidence.json"));
  const failEvidence = await readJson(path.join(failOutputDirectory, "evidence.json"));
  const limitEvidence = await readJson(path.join(limitOutputDirectory, "evidence.json"));
  const passLaunch = await readJson(path.join(passOutputDirectory, "launch-results.json"));
  const failLaunch = await readJson(path.join(failOutputDirectory, "launch-results.json"));
  const limitLaunch = await readJson(path.join(limitOutputDirectory, "launch-results.json"));
  const passReport = await readFile(path.join(passOutputDirectory, "launch-readiness-report.html"), "utf8");
  const failReport = await readFile(path.join(failOutputDirectory, "launch-readiness-report.html"), "utf8");
  const coverage = await readJson(path.join(failOutputDirectory, "coverage.json"));

  validateEvidenceShape(passEvidence);
  validateEvidenceShape(failEvidence);
  validateEvidenceShape(limitEvidence);
  assertCheckStatus(passEvidence, "launch-collection", "pass");
  assertCheckStatus(passEvidence, "homepage-structure", "pass");
  assertCheckStatus(passEvidence, "homepage-navigation-links", "pass");
  assertCheckStatus(passEvidence, "homepage-footer-links", "pass");
  assertCheckStatus(passEvidence, "homepage-content-links", "pass");
  assertCheckStatus(passEvidence, "indexing-allowed", "pass");
  assertCheckStatus(failEvidence, "homepage-navigation-links", "fail");
  assertCheckStatus(failEvidence, "homepage-footer-links", "fail");
  assertCheckStatus(failEvidence, "homepage-content-links", "fail");
  assertCheckStatus(failEvidence, "indexing-allowed", "fail");
  assertCheckStatus(failEvidence, "browser-errors", "warning");
  for (const id of ["homepage-navigation-links", "homepage-footer-links", "homepage-content-links"]) {
    assertCheckStatus(limitEvidence, id, "not-checked");
  }

  assert.equal(passLaunch.document.regions.visibleLinkCounts.footer, 2, "Footer nav links must stay in the footer region.");
  assert.equal(passLaunch.document.regions.visibleLinkCounts.navigation, 2, "Footer nav links must not inflate primary navigation counts.");
  assert.deepEqual(failLaunch.linkProbe.results.find((result) => result.initialUrl.endsWith("/missing")).regions, ["navigation", "footer"]);
  assert.equal(requests.get("/missing"), 1, "A broken destination shared by navigation and footer should only be requested once.");
  assert.equal(limitLaunch.linkProbe.tested, 50, "The HTTP sample must remain bounded.");
  assert.equal(limitLaunch.linkProbe.byRegion.navigation.skippedByLimit, 1);
  assert.equal(limitLaunch.linkProbe.byRegion.footer.tested, 0);
  assert.equal(limitEvidence.checks.find((check) => check.id === "homepage-footer-links").evidence.skippedByLimit, 2);
  assert.match(failReport, /<strong>2<\/strong><span>Confirmed broken<\/span>/, "Shared broken destinations must not be counted twice in the summary.");

  if (passLaunch.linkProbe.failed !== 0 || passLaunch.linkProbe.tested !== 4 || passLaunch.linkProbe.results[0]?.region !== "navigation" || passLaunch.linkProbe.results[2]?.region !== "footer") {
    throw new Error("Launch link probing did not check the expected successful links in navigation-first order.");
  }

  if (failLaunch.linkProbe.failed !== 2 || failLaunch.document.inventory.issueCount !== 3 || !failLaunch.indexing.noindex) {
    throw new Error("Launch attention fixture did not produce the expected broken-link, unset-link, and noindex evidence.");
  }

  if (!passReport.includes("Website launch preflight evidence") || !failReport.includes("Automated preflight: Blocked") || !failReport.includes("Canonical launch checklist coverage") || /<script(?:\s|>)/i.test(`${passReport}${failReport}`)) {
    throw new Error("Launch review runner did not produce the expected safe human-readable report.");
  }

  if (coverage.schemaVersion !== "1.0.0" || coverage.profile.id !== "prepare-website-launch" || coverage.profile.version !== "1.0.1" || coverage.items.length !== 34) {
    throw new Error("Coverage output does not contain the complete website launch profile.");
  }

  if (!coverage.items.some((item) => item.automation === "partial") || !coverage.items.some((item) => item.automation === "manual")) {
    throw new Error("Launch coverage must distinguish partial and manual review requirements.");
  }

  await verifyReportStates(passEvidence, failEvidence, limitEvidence, coverage);

  for (const outputDirectory of [passOutputDirectory, failOutputDirectory, limitOutputDirectory]) {
    for (const artifact of ["evidence.json", "coverage.json", "summary.json", "page.png", "launch-results.json", "launch-readiness-report.html"]) {
      const artifactStats = await stat(path.join(outputDirectory, artifact));
      if (!artifactStats.isFile() || artifactStats.size === 0) throw new Error(`Launch review runner produced an empty or invalid artifact: ${artifact}`);
    }

    for (const unexpectedArtifact of ["axe-results.json", "axe-report.html", "lighthouse-report.json", "lighthouse-report.html", "security-results.json", "seo-results.json"]) {
      if (await exists(path.join(outputDirectory, unexpectedArtifact))) throw new Error(`Launch profile unexpectedly produced ${unexpectedArtifact}.`);
    }
  }

  console.log("Deterministic launch review runner self-test passed for ready, attention, shared-link, sample-limit, footer-navigation, and incomplete-report cases.");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(testDirectory, { recursive: true, force: true });
}

async function verifyReportStates(passEvidence, failEvidence, limitEvidence, coverage) {
  // HTTP local fixtures cannot exercise a clear HTTPS preflight; use their evidence shape to isolate the report's decision logic.
  const clear = structuredClone(passEvidence);
  for (const check of clear.checks) {
    if (check.status === "fail" || check.status === "not-checked") check.status = "pass";
  }
  const warning = structuredClone(clear);
  warning.checks.find((check) => check.id === "browser-errors").status = "warning";
  const incomplete = structuredClone(clear);
  for (const check of incomplete.checks) {
    if (check.artifacts.includes("launch-results.json")) check.status = "not-checked";
  }
  incomplete.checks.find((check) => check.id === "launch-collection").evidence = { runtimeStatus: "error", error: "Fixture collector failure" };
  const missingCollector = structuredClone(clear);
  missingCollector.checks = missingCollector.checks.filter((check) => check.id !== "launch-collection");
  const limited = structuredClone(limitEvidence);
  for (const id of ["https-url", "http-to-https-redirect"]) limited.checks.find((check) => check.id === id).status = "pass";

  for (const [name, evidence, expected] of [
    ["clear", clear, "Clear"],
    ["warning", warning, "Attention"],
    ["collector-error", incomplete, "Incomplete"],
    ["collector-missing", missingCollector, "Incomplete"],
    ["sample-limited", limited, "Incomplete"],
    ["blocked", failEvidence, "Blocked"]
  ]) {
    const reportPath = path.join(testDirectory, `${name}-report.html`);
    await writeLaunchHtmlReport(evidence, coverage, reportPath);
    const report = await readFile(reportPath, "utf8");
    assert.ok(report.includes(`Automated preflight: ${expected}</strong>`), `${name} should produce ${expected}, not a false Clear.`);
    if (expected === "Incomplete") assert.ok(!report.includes("Automated preflight: Clear"));
  }
}

function sendHtml(response, html) {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

function assertCheckStatus(evidence, checkId, expectedStatus) {
  const check = evidence.checks.find((candidate) => candidate.id === checkId);
  if (!check || check.status !== expectedStatus) throw new Error(`Expected ${checkId} to be ${expectedStatus}, found ${check?.status ?? "missing"}.`);
}

function validateEvidenceShape(evidence) {
  if (evidence.schemaVersion !== "1.0.0" || evidence.profile.id !== "prepare-website-launch" || !Array.isArray(evidence.checks) || !Array.isArray(evidence.artifacts) || !Array.isArray(evidence.limitations)) {
    throw new Error("Launch evidence output does not match the required top-level shape.");
  }

  for (const check of evidence.checks) {
    if (!check.id || !check.title || !new Set(["pass", "fail", "warning", "informational", "not-checked"]).has(check.status) || !check.method || typeof check.evidence !== "object" || !Array.isArray(check.artifacts)) {
      throw new Error(`Invalid launch evidence check shape: ${check.id ?? "missing id"}`);
    }
  }
}

function run(command, argumentsToRun, workingDirectory = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsToRun, { cwd: workingDirectory, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Launch review command exited with code ${code}.`)));
  });
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}
