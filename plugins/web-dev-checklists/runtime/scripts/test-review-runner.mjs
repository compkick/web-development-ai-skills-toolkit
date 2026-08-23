import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { DEFAULT_EVIDENCE_ROOT_DIRECTORY } from "../config/runtime-config.mjs";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const runtimeDirectory = path.resolve(scriptsDirectory, "..");
const reviewScript = path.join(scriptsDirectory, "review.mjs");
const passFixture = await readFile(path.join(runtimeDirectory, "fixtures", "accessibility-pass.html"), "utf8");
const failFixture = await readFile(path.join(runtimeDirectory, "fixtures", "accessibility-fail.html"), "utf8");
const testDirectory = await mkdtemp(path.join(os.tmpdir(), "web-dev-checklists-review-test-"));
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
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  await run(process.execPath, [reviewScript, "--profile", "review-web-accessibility", "--url", `${baseUrl}/pass`], testDirectory);
  passOutputDirectory = await findSingleDefaultOutputDirectory(testDirectory, "review-web-accessibility");
  await run(process.execPath, [reviewScript, "--profile", "review-web-accessibility", "--url", `${baseUrl}/fail`, "--output", failOutputDirectory]);

  const passEvidence = await readJson(path.join(passOutputDirectory, "evidence.json"));
  const failEvidence = await readJson(path.join(failOutputDirectory, "evidence.json"));
  const coverage = await readJson(path.join(failOutputDirectory, "coverage.json"));

  validateEvidenceShape(passEvidence);
  validateEvidenceShape(failEvidence);

  assertCheckStatus(passEvidence, "page-http-status", "pass");
  assertCheckStatus(passEvidence, "document-title", "pass");
  assertCheckStatus(passEvidence, "document-language", "pass");
  assertCheckStatus(passEvidence, "automated-axe-scan", "pass");
  assertCheckStatus(passEvidence, "browser-errors", "pass");
  assertCheckStatus(failEvidence, "page-http-status", "pass");
  assertCheckStatus(failEvidence, "document-title", "fail");
  assertCheckStatus(failEvidence, "document-language", "fail");
  assertCheckStatus(failEvidence, "automated-axe-scan", "fail");

  for (const expectedRuleId of ["axe-button-name", "axe-document-title", "axe-html-has-lang", "axe-image-alt"]) {
    if (!failEvidence.checks.some((check) => check.id === expectedRuleId && check.status === "fail")) {
      throw new Error(`Fail fixture did not produce expected evidence check: ${expectedRuleId}`);
    }
  }

  if (coverage.schemaVersion !== "1.0.0" || coverage.profile.id !== "review-web-accessibility" || coverage.items.length !== 22) {
    throw new Error("Coverage output does not contain the complete accessibility profile.");
  }

  if (!coverage.items.some((item) => item.automation === "partial") || !coverage.items.some((item) => item.automation === "manual")) {
    throw new Error("Coverage output must distinguish partial and manual review requirements.");
  }

  for (const outputDirectory of [passOutputDirectory, failOutputDirectory]) {
    for (const artifact of ["evidence.json", "coverage.json", "summary.json", "page.png", "axe-results.json", "lighthouse-report.json", "lighthouse-report.html"]) {
      const artifactStats = await stat(path.join(outputDirectory, artifact));

      if (!artifactStats.isFile() || artifactStats.size === 0) throw new Error(`Review runner produced an empty or invalid artifact: ${artifact}`);
    }
  }

  console.log("Deterministic review runner self-test passed for accessibility pass and fail fixtures.");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(testDirectory, { recursive: true, force: true });
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
  if (evidence.schemaVersion !== "1.0.0" || evidence.profile.id !== "review-web-accessibility" || !Array.isArray(evidence.checks) || !Array.isArray(evidence.artifacts) || !Array.isArray(evidence.limitations)) {
    throw new Error("Evidence output does not match the required top-level shape.");
  }

  for (const check of evidence.checks) {
    if (!check.id || !check.title || !new Set(["pass", "fail", "warning", "informational", "not-checked"]).has(check.status) || !check.method || typeof check.evidence !== "object" || !Array.isArray(check.artifacts)) {
      throw new Error(`Invalid evidence check shape: ${check.id ?? "missing id"}`);
    }
  }
}

function run(command, argumentsToRun, workingDirectory = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsToRun, { cwd: workingDirectory, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Review command exited with code ${code}.`)));
  });
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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}
