import { access, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { evaluateNegotiatedTls } from "../collectors/tls-baseline.mjs";

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

assertTlsEvaluation();

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
  assertCheckTitle(failEvidence, "tls-cipher-suite", "Site negotiates a strong cipher suite");
  assertCheckTitle(failEvidence, "tls-forward-secrecy", "Site uses a forward-secret key exchange");
  assertCheckTitle(failEvidence, "tls-key-exchange-group", "Site negotiates an approved key-exchange group");
  assertCheckTitle(failEvidence, "tls-supported-versions", "Site supports TLS 1.3 or TLS 1.2");
  assertCheckTitle(failEvidence, "tls-deprecated-versions", "Site rejects TLS 1.0 and TLS 1.1");

  for (const check of [...passEvidence.checks, ...failEvidence.checks]) {
    if (!/^(Site|Runner) /.test(check.title)) throw new Error(`Security check title is not declarative: ${check.title}`);
  }

  if (!passReport.includes("Web security review evidence") || !failReport.includes("Checks requiring attention") || !failReport.includes("Content Security Policy") || !failReport.includes("Canonical checklist coverage") || !failReport.includes("Partially automated") || /<script(?:\s|>)/i.test(`${passReport}${failReport}`)) {
    throw new Error("Security review runner did not produce the expected safe human-readable report.");
  }

  if (!failEvidence.artifacts.some((artifact) => artifact.path === "security-report.html")) {
    throw new Error("Security evidence does not reference the human-readable report.");
  }

  if (coverage.schemaVersion !== "1.0.0" || coverage.profile.id !== "review-web-security" || coverage.profile.version !== "1.1.0" || coverage.items.length !== 40) {
    throw new Error("Coverage output does not contain the complete security profile.");
  }

  if (!coverage.items.some((item) => item.automation === "partial") || !coverage.items.some((item) => item.automation === "manual")) {
    throw new Error("Coverage output must distinguish partial and manual review requirements.");
  }

  for (const checkId of ["security-tls-supported-versions", "security-tls-deprecated-versions"]) {
    if (coverage.items.find((item) => item.id === checkId)?.automation !== "automated") throw new Error(`${checkId} must be classified as automated coverage.`);
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

function assertTlsEvaluation() {
  const tls13 = evaluateNegotiatedTls({ cipher: { name: "TLS_AES_128_GCM_SHA256", standardName: "TLS_AES_128_GCM_SHA256" }, ephemeralKey: { name: "X25519", size: 253, type: "ECDH" }, outcome: "accepted", protocol: "TLSv1.3" });
  const tls12 = evaluateNegotiatedTls({ cipher: { name: "ECDHE-RSA-AES256-GCM-SHA384", standardName: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384" }, ephemeralKey: { name: "prime256v1", size: 256, type: "ECDH" }, outcome: "accepted", protocol: "TLSv1.2" });
  const weakTls12 = evaluateNegotiatedTls({ cipher: { name: "AES128-SHA", standardName: "TLS_RSA_WITH_AES_128_CBC_SHA" }, ephemeralKey: null, outcome: "accepted", protocol: "TLSv1.2" });

  if (!tls13.strongCipher || !tls13.forwardSecret || !tls13.approvedKeyExchangeGroup || !tls12.strongCipher || !tls12.forwardSecret || !tls12.approvedKeyExchangeGroup || weakTls12.strongCipher || weakTls12.forwardSecret || weakTls12.approvedKeyExchangeGroup !== null) {
    throw new Error("TLS baseline evaluation did not distinguish strong, forward-secret negotiations from a weak static-RSA negotiation.");
  }
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
