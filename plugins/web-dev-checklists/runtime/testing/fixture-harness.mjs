import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { validateEvidence, validateCoverage } from "./schema-validation.mjs";

const ownedDirectories = new Set();

export async function createFixtureDirectory(prefix) {
  const directory = await mkdtemp(path.join(os.tmpdir(), prefix));
  ownedDirectories.add(directory);
  return directory;
}

export async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => { server.off("error", reject); resolve(); });
  });
  return server.address();
}

export async function closeFixture(server, directory) {
  if (server) {
    const closed = new Promise((resolve) => server.close(resolve));
    server.closeAllConnections();
    await closed;
  }
  assert.ok(ownedDirectories.has(directory), "Only fixture-owned temporary directories may be removed.");
  await rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  ownedDirectories.delete(directory);
}

export function runCommand(command, args, workingDirectory = process.cwd(), { timeoutMs = 300000, expectedExitCode = 0, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: workingDirectory, env, stdio: "inherit", detached: process.platform !== "win32" });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // Terminate only this test's subprocess tree, not unrelated browser processes.
      if (process.platform === "win32") spawnSync("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
      else { try { process.kill(-child.pid, "SIGKILL"); } catch {} }
    }, timeoutMs);
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (timedOut) reject(new Error(`Fixture command exceeded ${timeoutMs} ms.`));
      else if (code !== expectedExitCode) reject(new Error(`Fixture command exited with ${code}; expected ${expectedExitCode}.`));
      else resolve(code);
    });
  });
}

export async function readJson(filePath) {
  const value = JSON.parse(await readFile(filePath, "utf8"));
  if (path.basename(filePath) === "evidence.json") validateEvidence(value);
  if (path.basename(filePath) === "coverage.json") validateCoverage(value);
  return value;
}

export function assertEvidence(evidence, profile) {
  validateEvidence(evidence, profile);
  assert.equal(evidence.run.browser.formFactor, "desktop", "The runner must record the desktop baseline.");
}

export function assertCheckStatus(evidence, checkId, expectedStatus) {
  const check = evidence.checks.find((candidate) => candidate.id === checkId);
  assert.equal(check?.status, expectedStatus, `Unexpected status for ${checkId}.`);
}

export async function assertArtifacts(outputDirectory, paths) {
  for (const artifact of paths) {
    const info = await stat(path.join(outputDirectory, artifact));
    assert.ok(info.isFile() && info.size > 0, `Empty or invalid artifact: ${artifact}`);
  }
}

export function sendHtml(response, html, headers = {}) {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", ...headers });
  response.end(html);
}
