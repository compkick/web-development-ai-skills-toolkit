import { createFixtureDirectory, listen, closeFixture, runCommand, readJson, assertEvidence, assertCheckStatus, assertArtifacts, sendHtml } from "../testing/fixture-harness.mjs";
import { readFile, readdir, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { AXE_REVIEW, DEFAULT_EVIDENCE_ROOT_DIRECTORY, getRuntimeLocation } from "../config/runtime-config.mjs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const runtimeDirectory = path.resolve(scriptsDirectory, "..");
const reviewScript = path.join(scriptsDirectory, "review.mjs");
const passFixture = await readFile(path.join(runtimeDirectory, "fixtures", "accessibility-pass.html"), "utf8");
const failFixture = await readFile(path.join(runtimeDirectory, "fixtures", "accessibility-fail.html"), "utf8");
const testDirectory = await createFixtureDirectory("web-dev-checklists-review-test-");
const run = (command, args, cwd = testDirectory) => runCommand(command, args, cwd);
let passOutputDirectory;
const failOutputDirectory = path.join(testDirectory, "fail-output");
const server = http.createServer((request, response) => {
  if (request.url === "/favicon.ico") {
    response.writeHead(204);
    return response.end();
  }

  if (request.url === "/pass") return sendHtml(response, passFixture);
  if (request.url === "/fail") return sendHtml(response, failFixture);
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

try {
  await listen(server);

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  await run(process.execPath, [reviewScript, "--profile", "review-web-accessibility", "--url", `${baseUrl}/pass`], testDirectory);
  passOutputDirectory = await findSingleDefaultOutputDirectory(testDirectory, "review-web-accessibility");
  await run(process.execPath, [reviewScript, "--profile", "review-web-accessibility", "--url", `${baseUrl}/fail`, "--output", failOutputDirectory]);

  const passEvidence = await readJson(path.join(passOutputDirectory, "evidence.json"));
  const failEvidence = await readJson(path.join(failOutputDirectory, "evidence.json"));
  const failAxeResult = await readJson(path.join(failOutputDirectory, "axe-results.json"));
  const passAxeResult = await readJson(path.join(passOutputDirectory, "axe-results.json"));
  const coverage = await readJson(path.join(failOutputDirectory, "coverage.json"));

  assertEvidence(passEvidence, "review-web-accessibility");
  assertEvidence(failEvidence, "review-web-accessibility");

  // Compare the actual scan results with this exact pinned engine's supported rules,
  // not just the standard label or a mocked configuration object.
  const { runtimeDirectory: installedRuntime } = await getRuntimeLocation();
  const requireRuntime = createRequire(path.join(installedRuntime, "package.json"));
  const axe = requireRuntime("axe-core");
  const expectedRules = axe.getRules([...AXE_REVIEW.tags]).filter((rule) => !rule.tags.some((tag) => ["experimental", "deprecated"].includes(tag))).map((rule) => rule.ruleId).sort();
  for (const result of [passAxeResult, failAxeResult]) {
    assert.equal(result.testEngine.version, axe.version);
    assert.equal(result.ruleSelection.standard, AXE_REVIEW.standard);
    assert.deepEqual(result.ruleSelection.tags, [...AXE_REVIEW.tags]);
    assert.deepEqual(result.ruleSelection.rules.map((rule) => rule.id).sort(), expectedRules);
    for (const tag of AXE_REVIEW.tags) {
      const supported = axe.getRules([tag]).filter((rule) => !rule.tags.some((value) => ["experimental", "deprecated"].includes(value)));
      assert.equal(result.ruleSelection.rules.filter((rule) => rule.tags.includes(tag)).length, supported.length, `Incorrect ${tag} coverage`);
    }
    assert.ok(result.ruleSelection.rules.every((rule) => !rule.tags.some((tag) => ["experimental", "deprecated", "wcag2aaa", "wcag21aaa", "wcag22aaa"].includes(tag))));
  }
  assert.ok(passAxeResult.ruleSelection.rules.find((rule) => rule.id === "target-size")?.outcomes.includes("passes"));
  assert.ok(failAxeResult.ruleSelection.rules.find((rule) => rule.id === "target-size")?.outcomes.includes("violations"));
  assertCheckStatus(failEvidence, "axe-target-size", "fail");
  const recordedSelection = failEvidence.checks.find((check) => check.id === "automated-axe-scan").evidence.ruleSelection;
  assert.deepEqual(recordedSelection, { standard: AXE_REVIEW.standard, tags: [...AXE_REVIEW.tags], ruleCount: expectedRules.length });
  const html = await readFile(path.join(failOutputDirectory, "accessibility-report.html"), "utf8");
  assert.ok(html.includes("Automated rule coverage") && html.includes("wcag22aa") && html.includes("wcag258") && html.includes("does not establish WCAG conformance"));

  assertCheckStatus(passEvidence, "page-http-status", "pass");
  assertCheckStatus(passEvidence, "document-title", "pass");
  assertCheckStatus(passEvidence, "document-language", "pass");
  assertCheckStatus(passEvidence, "automated-axe-scan", "pass");
  assertCheckStatus(passEvidence, "browser-errors", "pass");
  assertCheckStatus(failEvidence, "page-http-status", "pass");
  assertCheckStatus(failEvidence, "document-title", "fail");
  assertCheckStatus(failEvidence, "document-language", "fail");
  assertCheckStatus(failEvidence, "automated-axe-scan", "pass");
  assertCheckStatus(passEvidence, "axe-manual-review", "pass");
  assertCheckStatus(failEvidence, "axe-manual-review", failAxeResult.incomplete.length ? "warning" : "pass");
  const violationChecks = failEvidence.checks.filter((check) => check.id.startsWith("axe-") && check.status === "fail");
  if (violationChecks.length !== failAxeResult.violations.length) throw new Error("Axe violations were dropped or double-counted.");

  for (const expectedRuleId of ["axe-button-name", "axe-document-title", "axe-html-has-lang", "axe-image-alt"]) {
    if (!failEvidence.checks.some((check) => check.id === expectedRuleId && check.status === "fail")) {
      throw new Error(`Fail fixture did not produce expected evidence check: ${expectedRuleId}`);
    }
  }

  if (coverage.schemaVersion !== "1.0.0" || coverage.profile.id !== "review-web-accessibility" || coverage.profile.version !== "1.2.0" || coverage.items.length !== 25) {
    throw new Error("Coverage output does not contain the complete accessibility profile.");
  }

  if (!coverage.items.some((item) => item.automation === "partial") || !coverage.items.some((item) => item.automation === "manual")) {
    throw new Error("Coverage output must distinguish partial and manual review requirements.");
  }
  assert.equal(coverage.items.find((item) => item.id === "a11y-motion-target-size").automation, "partial");
  for (const id of ["a11y-consistent-help", "a11y-redundant-entry", "a11y-focus", "a11y-accessible-authentication"]) {
    assert.equal(coverage.items.find((item) => item.id === id).automation, "manual");
  }

  for (const outputDirectory of [passOutputDirectory, failOutputDirectory]) {
    await assertArtifacts(outputDirectory, ["evidence.json", "coverage.json", "summary.json", "page.png", "axe-results.json", "accessibility-report.html", "lighthouse-report.json", "lighthouse-report.html"]);
  }

  const capturedScreenshot = [...failAxeResult.violations, ...failAxeResult.incomplete].flatMap((rule) => rule.nodes).find((node) => node.screenshot?.status === "captured")?.screenshot.path;

  if (!capturedScreenshot || !(await stat(path.join(failOutputDirectory, ...capturedScreenshot.split("/")))).isFile()) {
    throw new Error("Accessibility fail fixture did not produce a referenced axe element screenshot.");
  }

  console.log(`Accessibility fixtures passed: axe ${axe.version}, ${expectedRules.length} explicit A/AA and best-practice rules, WCAG 2.2 target-size pass/fail, and manual boundaries.`);
} finally {
  await closeFixture(server, testDirectory);
}

async function findSingleDefaultOutputDirectory(workingDirectory, profileId) {
  const profileDirectory = path.join(workingDirectory, DEFAULT_EVIDENCE_ROOT_DIRECTORY, profileId);
  const targetEntries = (await readdir(profileDirectory, { withFileTypes: true })).filter((entry) => entry.isDirectory());

  if (targetEntries.length !== 1) throw new Error(`Expected one default target directory under ${profileDirectory}, found ${targetEntries.length}.`);
  if (!/^127\.0\.0\.1-\d+$/.test(targetEntries[0].name)) throw new Error(`Default target directory does not contain the fixture host and port: ${targetEntries[0].name}`);

  const targetDirectory = path.join(profileDirectory, targetEntries[0].name);
  const entries = await readdir(targetDirectory, { withFileTypes: true });
  const runDirectories = entries.filter((entry) => entry.isDirectory());

  if (runDirectories.length !== 1) throw new Error(`Expected one default run directory under ${targetDirectory}, found ${runDirectories.length}.`);
  if (!/^\d{8}-\d{6}-\d{3}Z$/.test(runDirectories[0].name)) throw new Error(`Default run directory has an invalid timestamp: ${runDirectories[0].name}`);
  return path.join(targetDirectory, runDirectories[0].name);
}
