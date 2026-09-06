import { exists } from "../evidence/package.mjs";
import { createFixtureDirectory, listen, closeFixture, runCommand, readJson, assertEvidence, assertCheckStatus, assertArtifacts, sendHtml } from "../testing/fixture-harness.mjs";
import { readFile, readdir, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import http from "node:http";
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
const testDirectory = await createFixtureDirectory("web-dev-checklists-launch-test-");
const run = (command, args, cwd = testDirectory) => runCommand(command, args, cwd);
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
  await listen(server);

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  await run(process.execPath, [reviewScript, "--profile", "review-website-launch", "--url", `${baseUrl}/pass`, "--output", passOutputDirectory]);
  await run(process.execPath, [reviewScript, "--profile", "review-website-launch", "--url", `${baseUrl}/fail`, "--output", failOutputDirectory]);
  await run(process.execPath, [reviewScript, "--profile", "review-website-launch", "--url", `${baseUrl}/limit`, "--output", limitOutputDirectory]);
  await run(process.execPath, [reviewScript, "--profile", "prepare-website-launch", "--url", `${baseUrl}/pass`], testDirectory);
  const aliasRoot = path.join(testDirectory, ".output", "review-website-launch", `127.0.0.1-${address.port}`);
  const aliasRuns = await readdir(aliasRoot);
  assert.equal(aliasRuns.length, 1, "The legacy alias must use the canonical default output group.");
  const aliasEvidence = await readJson(path.join(aliasRoot, aliasRuns[0], "evidence.json"));
  assert.equal(aliasEvidence.profile.id, "review-website-launch");
  assert.equal(await exists(path.join(testDirectory, ".output", "prepare-website-launch")), false);

  const passEvidence = await readJson(path.join(passOutputDirectory, "evidence.json"));
  const failEvidence = await readJson(path.join(failOutputDirectory, "evidence.json"));
  const limitEvidence = await readJson(path.join(limitOutputDirectory, "evidence.json"));
  const passLaunch = await readJson(path.join(passOutputDirectory, "launch-results.json"));
  const failLaunch = await readJson(path.join(failOutputDirectory, "launch-results.json"));
  const limitLaunch = await readJson(path.join(limitOutputDirectory, "launch-results.json"));
  const passReport = await readFile(path.join(passOutputDirectory, "launch-readiness-report.html"), "utf8");
  const failReport = await readFile(path.join(failOutputDirectory, "launch-readiness-report.html"), "utf8");
  const coverage = await readJson(path.join(failOutputDirectory, "coverage.json"));
  const failSummary = await readJson(path.join(failOutputDirectory, "summary.json"));
  assert.equal(failSummary.page.screenshotReadiness.status, "incomplete");
  assert.equal(failSummary.page.screenshotReadiness.images.failed, 1);
  assert.ok(failEvidence.limitations.some((note) => note.includes("Screenshot preparation was incomplete")));
  assert.ok(failReport.includes("Screenshot preparation was incomplete"), "Capture limitations must reach the human-readable report.");

  assertEvidence(passEvidence, "review-website-launch");
  assertEvidence(failEvidence, "review-website-launch");
  assertEvidence(limitEvidence, "review-website-launch");
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

  if (!passReport.includes("Website Launch Readiness Report") || !failReport.includes("Automated preflight: Blocked") || !failReport.includes("Canonical launch checklist coverage") || /<script(?:\s|>)/i.test(`${passReport}${failReport}`)) {
    throw new Error("Launch review runner did not produce the expected safe human-readable report.");
  }

  if (coverage.schemaVersion !== "1.0.0" || coverage.profile.id !== "review-website-launch" || coverage.profile.version !== "1.1.0" || coverage.items.length !== 34) {
    throw new Error("Coverage output does not contain the complete website launch profile.");
  }

  if (!coverage.items.some((item) => item.automation === "partial") || !coverage.items.some((item) => item.automation === "manual")) {
    throw new Error("Launch coverage must distinguish partial and manual review requirements.");
  }

  await verifyReportStates(passEvidence, failEvidence, limitEvidence, coverage);

  for (const outputDirectory of [passOutputDirectory, failOutputDirectory, limitOutputDirectory]) {
    await assertArtifacts(outputDirectory, ["evidence.json", "coverage.json", "summary.json", "page.png", "launch-results.json", "launch-readiness-report.html"]);

    for (const unexpectedArtifact of ["axe-results.json", "accessibility-report.html", "lighthouse-report.json", "lighthouse-report.html", "security-results.json", "seo-results.json"]) {
      if (await exists(path.join(outputDirectory, unexpectedArtifact))) throw new Error(`Launch profile unexpectedly produced ${unexpectedArtifact}.`);
    }
  }

  console.log("Deterministic launch review runner self-test passed for ready, attention, shared-link, sample-limit, footer-navigation, and incomplete-report cases.");
} finally {
  await closeFixture(server, testDirectory);
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
