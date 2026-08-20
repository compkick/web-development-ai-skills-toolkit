import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const auditScript = path.join(scriptsDirectory, "audit.mjs");
const testDirectory = await mkdtemp(path.join(os.tmpdir(), "web-dev-checklists-runtime-test-"));
const outputDirectory = path.join(testDirectory, "output");
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
  await run(process.execPath, [auditScript, "--url", url, "--output", outputDirectory]);
  const summary = JSON.parse(await readFile(path.join(outputDirectory, "summary.json"), "utf8"));

  if (summary.browser.sandboxed !== true || summary.page.httpStatus !== 200 || summary.page.browserErrors.consoleErrorCount < 1 || summary.page.browserErrors.pageErrorCount < 1 || summary.page.browserErrors.detailsFile !== null || summary.axe.status !== "completed" || summary.axe.violations < 1 || summary.lighthouse.status !== "completed" || typeof summary.lighthouse.scores.performance !== "number") {
    throw new Error("Audit runtime self-test did not produce the expected browser, axe, and Lighthouse evidence.");
  }

  for (const artifact of ["summary.json", "page.png", "axe-results.json", "lighthouse-report.json", "lighthouse-report.html"]) {
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

function run(command, argumentsToRun) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsToRun, { env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Audit command exited with code ${code}.`)));
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
