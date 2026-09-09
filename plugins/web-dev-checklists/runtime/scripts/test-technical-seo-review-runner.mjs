import { createFixtureDirectory, listen, closeFixture, runCommand, readJson, assertEvidence, assertCheckStatus, assertArtifacts, sendHtml } from "../testing/fixture-harness.mjs";
import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const runtimeDirectory = path.resolve(scriptsDirectory, "..");
const reviewScript = path.join(scriptsDirectory, "review.mjs");
const passFixtureTemplate = await readFile(path.join(runtimeDirectory, "fixtures", "technical-seo-pass.html"), "utf8");
const failFixtureTemplate = await readFile(path.join(runtimeDirectory, "fixtures", "technical-seo-fail.html"), "utf8");
const testDirectory = await createFixtureDirectory("web-dev-checklists-technical-seo-test-");
const run = (command, args, cwd = testDirectory) => runCommand(command, args, cwd);
const passOutputDirectory = path.join(testDirectory, "pass-output");
const failOutputDirectory = path.join(testDirectory, "fail-output");
let baseUrl;
const server = http.createServer((request, response) => {
  if (request.url === "/favicon.ico") {
    response.writeHead(204);
    return response.end();
  }

  if (request.url === "/robots.txt") {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return response.end(`User-agent: *\nDisallow: /fail\nSitemap: ${baseUrl}/sitemap.xml\n`);
  }

  if (request.url === "/sitemap.xml") {
    response.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
    return response.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/pass</loc></url></urlset>`);
  }

  if (request.url === "/pass") return sendHtml(response, passFixtureTemplate.replaceAll("{{BASE_URL}}", baseUrl));
  if (request.url === "/fail") return sendHtml(response, failFixtureTemplate.replaceAll("{{BASE_URL}}", baseUrl), { "X-Robots-Tag": "noindex, nofollow" });
  if (request.url === "/about") return sendHtml(response, "<!doctype html><html lang=\"en\"><head><title>About</title></head><body><main><h1>About</h1></main></body></html>");
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

try {
  await listen(server);

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
  await run(process.execPath, [reviewScript, "--profile", "review-technical-seo", "--url", `${baseUrl}/pass`, "--output", passOutputDirectory]);
  await run(process.execPath, [reviewScript, "--profile", "review-technical-seo", "--url", `${baseUrl}/fail`, "--output", failOutputDirectory]);

  const passEvidence = await readJson(path.join(passOutputDirectory, "evidence.json"));
  const failEvidence = await readJson(path.join(failOutputDirectory, "evidence.json"));
  const coverage = await readJson(path.join(failOutputDirectory, "coverage.json"));
  const passSeoResult = await readJson(path.join(passOutputDirectory, "seo-results.json"));

  assertEvidence(passEvidence, "review-technical-seo");
  assertEvidence(failEvidence, "review-technical-seo");
  assertCheckStatus(passEvidence, "page-http-status", "pass");
  assertCheckStatus(passEvidence, "indexing-allowed", "pass");
  assertCheckStatus(passEvidence, "document-title", "pass");
  assertCheckStatus(passEvidence, "canonical-declaration", "pass");
  assertCheckStatus(passEvidence, "sitemap-discovery", "pass");
  assertCheckStatus(passEvidence, "structured-data", "pass");
  assertCheckStatus(failEvidence, "indexing-allowed", "fail");
  assertCheckStatus(failEvidence, "document-title", "fail");
  assertCheckStatus(failEvidence, "canonical-declaration", "warning");
  assertCheckStatus(failEvidence, "structured-data", "warning");

  if (passSeoResult.robotsTxt.status !== 200 || passSeoResult.sitemaps[0]?.rootType !== "urlset" || passSeoResult.sitemaps[0]?.targetIncludedInPreview !== true) {
    throw new Error("Technical SEO collector did not record the expected robots.txt and sitemap evidence.");
  }

  if (coverage.schemaVersion !== "1.0.0" || coverage.profile.id !== "review-technical-seo" || coverage.items.length !== 20) {
    throw new Error("Coverage output does not contain the complete technical SEO profile.");
  }

  for (const automation of ["automated", "partial", "manual"]) {
    if (!coverage.items.some((item) => item.automation === automation)) throw new Error(`Coverage output is missing ${automation} technical SEO requirements.`);
  }

  for (const outputDirectory of [passOutputDirectory, failOutputDirectory]) {
    await assertArtifacts(outputDirectory, ["evidence.json", "coverage.json", "summary.json", "page.png", "seo-results.json", "lighthouse-report.json", "lighthouse-report.html", "technical-seo-report.html"]);

    const report = await readFile(path.join(outputDirectory, "technical-seo-report.html"), "utf8");
    if (!report.includes("Technical SEO review evidence") || !report.includes("Canonical checklist coverage") || /<script(?:\s|>)/i.test(report)) {
      throw new Error("Technical SEO HTML report is missing expected safe human-readable sections.");
    }
  }

  console.log("Deterministic review runner self-test passed for technical SEO pass and attention fixtures.");
} finally {
  await closeFixture(server, testDirectory);
}
