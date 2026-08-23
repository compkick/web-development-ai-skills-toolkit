import { access, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const runtimeDirectory = path.resolve(scriptsDirectory, "..");
const reviewScript = path.join(scriptsDirectory, "review.mjs");
const passFixture = await readFile(path.join(runtimeDirectory, "fixtures", "security-pass.html"), "utf8");
const failFixture = await readFile(path.join(runtimeDirectory, "fixtures", "security-fail.html"), "utf8");
const testDirectory = await mkdtemp(path.join(os.tmpdir(), "web-dev-checklists-security-review-test-"));
const passOutputDirectory = path.join(testDirectory, "pass-output");
const failOutputDirectory = path.join(testDirectory, "fail-output");
const server = http.createServer((request, response) => {
  if (request.url === "/favicon.ico") {
    response.writeHead(204);
    return response.end();
  }

  if (request.url === "/pass") {
    response.writeHead(200, {
      "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'; form-action 'self'",
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff"
    });
    return response.end(passFixture);
  }

  if (request.url === "/fail") {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Server": "FixtureServer/1.0",
      "X-Powered-By": "FixtureFramework/1.0",
      "X-XSS-Protection": "1; mode=block"
    });
    return response.end(failFixture);
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
  await run(process.execPath, [reviewScript, "--profile", "review-web-security", "--url", `${baseUrl}/pass`, "--output", passOutputDirectory]);
  await run(process.execPath, [reviewScript, "--profile", "review-web-security", "--url", `${baseUrl}/fail`, "--output", failOutputDirectory]);

  const passEvidence = await readJson(path.join(passOutputDirectory, "evidence.json"));
  const failEvidence = await readJson(path.join(failOutputDirectory, "evidence.json"));
  const passReport = await readFile(path.join(passOutputDirectory, "security-report.html"), "utf8");
  const failReport = await readFile(path.join(failOutputDirectory, "security-report.html"), "utf8");
  const coverage = await readJson(path.join(failOutputDirectory, "coverage.json"));

  validateEvidenceShape(passEvidence);
  validateEvidenceShape(failEvidence);
  assertCheckStatus(passEvidence, "security-collection", "pass");
  assertCheckStatus(passEvidence, "https-transport", "fail");
  assertCheckStatus(passEvidence, "content-security-policy", "pass");
  assertCheckStatus(passEvidence, "framing-protection", "pass");
  assertCheckStatus(passEvidence, "content-type-protection", "pass");
  assertCheckStatus(passEvidence, "referrer-policy", "pass");
  assertCheckStatus(passEvidence, "response-disclosure", "pass");
  assertCheckStatus(failEvidence, "content-security-policy", "warning");
  assertCheckStatus(failEvidence, "framing-protection", "warning");
  assertCheckStatus(failEvidence, "content-type-protection", "warning");
  assertCheckStatus(failEvidence, "response-disclosure", "warning");
  assertCheckTitle(failEvidence, "http-to-https-redirect", "Site redirects plain HTTP to HTTPS");
  assertCheckTitle(failEvidence, "strict-transport-security", "Site presents an active HSTS policy");
  assertCheckTitle(failEvidence, "content-security-policy", "Site includes an enforced Content Security Policy");

  for (const check of [...passEvidence.checks, ...failEvidence.checks]) {
    if (!/^(Site|Runner) /.test(check.title)) throw new Error(`Security check title is not declarative: ${check.title}`);
  }

  if (!passReport.includes("Web security review evidence") || !failReport.includes("Checks requiring attention") || !failReport.includes("Content Security Policy") || !failReport.includes("Canonical checklist coverage") || /<script(?:\s|>)/i.test(`${passReport}${failReport}`)) {
    throw new Error("Security review runner did not produce the expected safe human-readable report.");
  }

  if (!failEvidence.artifacts.some((artifact) => artifact.path === "security-report.html")) {
    throw new Error("Security evidence does not reference the human-readable report.");
  }

  if (coverage.schemaVersion !== "1.0.0" || coverage.profile.id !== "review-web-security" || coverage.items.length !== 36) {
    throw new Error("Coverage output does not contain the complete security profile.");
  }

  if (!coverage.items.some((item) => item.automation === "partial") || !coverage.items.some((item) => item.automation === "manual")) {
    throw new Error("Coverage output must distinguish partial and manual review requirements.");
  }

  for (const outputDirectory of [passOutputDirectory, failOutputDirectory]) {
    for (const artifact of ["evidence.json", "coverage.json", "summary.json", "page.png", "security-results.json", "security-report.html"]) {
      const artifactStats = await stat(path.join(outputDirectory, artifact));

      if (!artifactStats.isFile() || artifactStats.size === 0) throw new Error(`Security review runner produced an empty or invalid artifact: ${artifact}`);
    }

    for (const unexpectedArtifact of ["axe-results.json", "lighthouse-report.json", "lighthouse-report.html"]) {
      if (await exists(path.join(outputDirectory, unexpectedArtifact))) throw new Error(`Security profile unexpectedly produced ${unexpectedArtifact}.`);
    }
  }

  console.log("Deterministic security review runner self-test passed for protected-header and missing-header fixtures.");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(testDirectory, { recursive: true, force: true });
}

function assertCheckStatus(evidence, checkId, expectedStatus) {
  const check = evidence.checks.find((candidate) => candidate.id === checkId);

  if (!check || check.status !== expectedStatus) throw new Error(`Expected ${checkId} to be ${expectedStatus}, found ${check?.status ?? "missing"}.`);
}

function assertCheckTitle(evidence, checkId, expectedTitle) {
  const check = evidence.checks.find((candidate) => candidate.id === checkId);

  if (!check || check.title !== expectedTitle) throw new Error(`Expected ${checkId} title to be "${expectedTitle}", found "${check?.title ?? "missing"}".`);
}

function validateEvidenceShape(evidence) {
  if (evidence.schemaVersion !== "1.0.0" || evidence.profile.id !== "review-web-security" || !Array.isArray(evidence.checks) || !Array.isArray(evidence.artifacts) || !Array.isArray(evidence.limitations)) {
    throw new Error("Security evidence output does not match the required top-level shape.");
  }

  for (const check of evidence.checks) {
    if (!check.id || !check.title || !new Set(["pass", "fail", "warning", "informational", "not-checked"]).has(check.status) || !check.method || typeof check.evidence !== "object" || !Array.isArray(check.artifacts)) {
      throw new Error(`Invalid security evidence check shape: ${check.id ?? "missing id"}`);
    }
  }
}

function run(command, argumentsToRun, workingDirectory = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsToRun, { cwd: workingDirectory, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Security review command exited with code ${code}.`)));
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
