import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const runtimeDirectory = path.resolve(scriptsDirectory, "..");
const reviewScript = path.join(scriptsDirectory, "review.mjs");
const passFixture = await readFile(path.join(runtimeDirectory, "fixtures", "performance-pass.html"), "utf8");
const failFixture = await readFile(path.join(runtimeDirectory, "fixtures", "performance-fail.html"), "utf8");
const testDirectory = await mkdtemp(path.join(os.tmpdir(), "web-dev-checklists-performance-test-"));
const passOutputDirectory = path.join(testDirectory, "pass-output");
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
  await run(process.execPath, [reviewScript, "--profile", "review-web-performance", "--url", `${baseUrl}/pass`, "--output", passOutputDirectory]);
  await run(process.execPath, [reviewScript, "--profile", "review-web-performance", "--url", `${baseUrl}/fail`, "--output", failOutputDirectory]);

  const passEvidence = await readJson(path.join(passOutputDirectory, "evidence.json"));
  const failEvidence = await readJson(path.join(failOutputDirectory, "evidence.json"));
  const coverage = await readJson(path.join(failOutputDirectory, "coverage.json"));

  validateEvidenceShape(passEvidence);
  validateEvidenceShape(failEvidence);
  assertCheckStatus(passEvidence, "page-http-status", "pass");
  assertCheckStatus(passEvidence, "lighthouse-performance-run", "pass");
  assertCheckStatus(passEvidence, "lighthouse-performance-score", "informational");
  assertCheckStatus(failEvidence, "lab-total-blocking-time", "warning");

  for (const checkId of ["lab-largest-contentful-paint", "lab-cumulative-layout-shift", "lab-supporting-metrics", "server-response-and-redirects", "image-delivery", "render-blocking-resources", "unused-code", "main-thread-work", "layout-stability", "third-party-impact", "browser-errors"]) {
    if (!failEvidence.checks.some((check) => check.id === checkId)) throw new Error(`Performance evidence is missing check: ${checkId}`);
  }

  if (coverage.schemaVersion !== "1.0.0" || coverage.profile.id !== "review-web-performance" || coverage.items.length !== 18) {
    throw new Error("Coverage output does not contain the complete performance profile.");
  }

  if (!coverage.items.some((item) => item.automation === "partial") || !coverage.items.some((item) => item.automation === "manual")) {
    throw new Error("Coverage output must distinguish partial and manual performance requirements.");
  }

  for (const outputDirectory of [passOutputDirectory, failOutputDirectory]) {
    for (const artifact of ["evidence.json", "coverage.json", "summary.json", "page.png", "lighthouse-report.json", "lighthouse-report.html", "performance-report.html"]) {
      const artifactStats = await stat(path.join(outputDirectory, artifact));
      if (!artifactStats.isFile() || artifactStats.size === 0) throw new Error(`Performance runner produced an empty or invalid artifact: ${artifact}`);
    }

    const report = await readFile(path.join(outputDirectory, "performance-report.html"), "utf8");
    if (!report.includes("Web performance review evidence") || !report.includes("Canonical checklist coverage")) throw new Error("Performance HTML report is missing its expected human-readable sections.");
  }

  console.log("Deterministic review runner self-test passed for performance pass and attention fixtures.");
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
  if (evidence.schemaVersion !== "1.0.0" || evidence.profile.id !== "review-web-performance" || !Array.isArray(evidence.checks) || !Array.isArray(evidence.artifacts) || !Array.isArray(evidence.limitations)) {
    throw new Error("Performance evidence output does not match the required top-level shape.");
  }

  if (evidence.run.browser.formFactor !== "desktop") throw new Error("Performance evidence must record the desktop browser baseline.");
}

function run(command, argumentsToRun) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsToRun, { cwd: testDirectory, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Review command exited with code ${code}.`)));
  });
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}
