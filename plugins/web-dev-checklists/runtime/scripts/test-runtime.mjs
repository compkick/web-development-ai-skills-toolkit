import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { DEFAULT_EVIDENCE_ROOT_DIRECTORY, RAW_AUDIT_OUTPUT_GROUP } from "../config/runtime-config.mjs";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const auditScript = path.join(scriptsDirectory, "audit.mjs");
const testDirectory = await mkdtemp(path.join(os.tmpdir(), "web-dev-checklists-runtime-test-"));
let outputDirectory;
const detailedOutputDirectory = path.join(testDirectory, "output-with-error-details");
const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>Audit fixture</title></head><body><main><h1>Audit fixture</h1><img src=\"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==\"><button></button></main><script>console.error('fixture console error'); setTimeout(() => { throw new Error('fixture page error'); }, 0);</script></body></html>");
});

try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/`;
  await run(process.execPath, [auditScript, "--url", url], testDirectory);
  outputDirectory = await findSingleDefaultOutputDirectory(testDirectory, RAW_AUDIT_OUTPUT_GROUP);
  const summary = JSON.parse(await readFile(path.join(outputDirectory, "summary.json"), "utf8"));
  const axeResult = JSON.parse(await readFile(path.join(outputDirectory, "axe-results.json"), "utf8"));
  const axeReport = await readFile(path.join(outputDirectory, "accessibility-report.html"), "utf8");
  const lighthouseReport = JSON.parse(await readFile(path.join(outputDirectory, "lighthouse-report.json"), "utf8"));

  if (summary.page.screenshotReadiness?.status !== "ready" || summary.page.screenshotReadiness.images.loaded !== 1) {
    throw new Error("The shared worker must prepare page.png and record image readiness.");
  }

  if (summary.browser.sandboxed !== true || summary.browser.formFactor !== "desktop" || summary.browser.viewport.width !== 1440 || summary.browser.viewport.height !== 900 || summary.page.httpStatus !== 200 || summary.page.browserErrors.consoleErrorCount < 1 || summary.page.browserErrors.pageErrorCount < 1 || summary.page.browserErrors.detailsFile !== null || summary.axe.status !== "completed" || summary.axe.violations < 1 || summary.lighthouse.status !== "completed" || summary.lighthouse.formFactor !== "desktop" || lighthouseReport.configSettings.formFactor !== "desktop" || typeof summary.lighthouse.scores.performance !== "number") {
    throw new Error("Audit runtime self-test did not produce the expected browser, axe, and Lighthouse evidence.");
  }

  if (axeResult.auditEnvironment?.formFactor !== "desktop" || axeResult.testEnvironment?.windowWidth !== 1440 || axeResult.testEnvironment?.windowHeight !== 900 || axeResult.elementScreenshots.captured < 1 || !axeReport.includes("desktop mode at 1440 × 900") || !axeReport.includes("Confirmed violations") || !axeReport.includes("Needs manual review") || /<script(?:\s|>)/i.test(axeReport)) {
    throw new Error("Audit runtime self-test did not produce the expected safe human-readable axe report and element screenshots.");
  }

  const capturedScreenshot = [...axeResult.violations, ...axeResult.incomplete].flatMap((rule) => rule.nodes).find((node) => node.screenshot?.status === "captured")?.screenshot.path;

  if (!capturedScreenshot || !(await stat(path.join(outputDirectory, ...capturedScreenshot.split("/")))).isFile()) {
    throw new Error("Audit runtime self-test did not produce a referenced axe element screenshot.");
  }

  for (const artifact of ["summary.json", "page.png", "axe-results.json", "accessibility-report.html", "lighthouse-report.json", "lighthouse-report.html"]) {
    const artifactStats = await stat(path.join(outputDirectory, artifact));

    if (!artifactStats.isFile() || artifactStats.size === 0) {
      throw new Error(`Audit runtime self-test produced an empty or invalid artifact: ${artifact}`);
    }
  }

  if (await exists(path.join(outputDirectory, "browser-errors.json"))) {
    throw new Error("Audit runtime self-test exposed browser error details without --include-error-details.");
  }

  await run(process.execPath, [auditScript, "--url", url, "--output", detailedOutputDirectory, "--skip-accessibility", "--skip-lighthouse", "--include-error-details"]);
  const detailedSummary = JSON.parse(await readFile(path.join(detailedOutputDirectory, "summary.json"), "utf8"));
  const errorDetails = JSON.parse(await readFile(path.join(detailedOutputDirectory, "browser-errors.json"), "utf8"));

  if (detailedSummary.page.browserErrors.detailsFile !== "browser-errors.json" || errorDetails.consoleErrors.length < 1 || errorDetails.pageErrors.length < 1) {
    throw new Error("Audit runtime self-test did not produce opt-in browser error details.");
  }

  for (const artifact of ["summary.json", "page.png", "browser-errors.json"]) {
    const artifactStats = await stat(path.join(detailedOutputDirectory, artifact));

    if (!artifactStats.isFile() || artifactStats.size === 0) {
      throw new Error(`Audit runtime self-test produced an empty or invalid opt-in artifact: ${artifact}`);
    }
  }

  console.log("Website audit runtime self-test passed.");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(testDirectory, { recursive: true, force: true });
}

function run(command, argumentsToRun, workingDirectory = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsToRun, { cwd: workingDirectory, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Audit command exited with code ${code}.`)));
  });
}

async function findSingleDefaultOutputDirectory(workingDirectory, outputGroup) {
  const outputGroupDirectory = path.join(workingDirectory, DEFAULT_EVIDENCE_ROOT_DIRECTORY, outputGroup);
  const targetEntries = (await readdir(outputGroupDirectory, { withFileTypes: true })).filter((entry) => entry.isDirectory());

  if (targetEntries.length !== 1) throw new Error(`Expected one default target directory under ${outputGroupDirectory}, found ${targetEntries.length}.`);
  if (!/^127\.0\.0\.1-\d+$/.test(targetEntries[0].name)) throw new Error(`Default target directory does not contain the fixture host and port: ${targetEntries[0].name}`);

  const targetDirectory = path.join(outputGroupDirectory, targetEntries[0].name);
  const runDirectories = (await readdir(targetDirectory, { withFileTypes: true })).filter((entry) => entry.isDirectory());

  if (runDirectories.length !== 1) throw new Error(`Expected one default run directory under ${targetDirectory}, found ${runDirectories.length}.`);
  if (!/^\d{8}-\d{6}-\d{3}Z$/.test(runDirectories[0].name)) throw new Error(`Default run directory has an invalid timestamp: ${runDirectories[0].name}`);
  return path.join(targetDirectory, runDirectories[0].name);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
