import { createFixtureDirectory, listen, closeFixture, runCommand, readJson, assertEvidence, assertCheckStatus, assertArtifacts, sendHtml } from "../testing/fixture-harness.mjs";
import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const runtimeDirectory = path.resolve(scriptsDirectory, "..");
const reviewScript = path.join(scriptsDirectory, "review.mjs");
const passFixture = await readFile(path.join(runtimeDirectory, "fixtures", "performance-pass.html"), "utf8");
const failFixture = await readFile(path.join(runtimeDirectory, "fixtures", "performance-fail.html"), "utf8");
const testDirectory = await createFixtureDirectory("web-dev-checklists-performance-test-");
const run = (command, args, cwd = testDirectory) => runCommand(command, args, cwd);
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
  await listen(server);

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  await run(process.execPath, [reviewScript, "--profile", "review-web-performance", "--url", `${baseUrl}/pass`, "--output", passOutputDirectory]);
  await run(process.execPath, [reviewScript, "--profile", "review-web-performance", "--url", `${baseUrl}/fail`, "--output", failOutputDirectory]);

  const passEvidence = await readJson(path.join(passOutputDirectory, "evidence.json"));
  const failEvidence = await readJson(path.join(failOutputDirectory, "evidence.json"));
  const coverage = await readJson(path.join(failOutputDirectory, "coverage.json"));

  assertEvidence(passEvidence, "review-web-performance");
  assertEvidence(failEvidence, "review-web-performance");
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
    await assertArtifacts(outputDirectory, ["evidence.json", "coverage.json", "summary.json", "page.png", "lighthouse-report.json", "lighthouse-report.html", "performance-report.html"]);

    const report = await readFile(path.join(outputDirectory, "performance-report.html"), "utf8");
    if (!report.includes("Web performance review evidence") || !report.includes("Canonical checklist coverage")) throw new Error("Performance HTML report is missing its expected human-readable sections.");
  }

  console.log("Deterministic review runner self-test passed for performance pass and attention fixtures.");
} finally {
  await closeFixture(server, testDirectory);
}
