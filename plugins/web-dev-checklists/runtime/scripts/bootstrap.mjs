import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { getRuntimeLocation, runtimeSourceDirectory } from "../config/runtime-config.mjs";
import { getRuntimeStatus } from "../config/runtime-status.mjs";
import { stageRuntimeWorker } from "../config/runtime-worker.mjs";
import { minimumNodeVersion, supportsNodeVersion } from "../config/node-version.mjs";

const skipBrowserDownload = parseArguments(process.argv.slice(2));
requireSupportedNode();

const location = await getRuntimeLocation();
const { browserDirectory, runtimeDirectory, runtimeKey } = location;
const readyMarkerPath = path.join(runtimeDirectory, "runtime-ready.json");
const runtimeStatus = await getRuntimeStatus();

if (!runtimeStatus.ready) {
  await mkdir(runtimeDirectory, { recursive: true });

  for (const sourceFile of ["package.json", "package-lock.json"]) {
    const targetPath = path.join(runtimeDirectory, sourceFile);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await copyFile(path.join(runtimeSourceDirectory, sourceFile), targetPath);
  }

  const npmInvocation = getNpmInvocation();
  runCommand(npmInvocation.command, [...npmInvocation.arguments, "ci", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: runtimeDirectory,
    env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1" },
    shell: false
  });

  await writeFile(readyMarkerPath, `${JSON.stringify({ runtimeKey, installedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
}

await stageRuntimeWorker(location);

if (!skipBrowserDownload) {
  const playwrightCli = path.join(runtimeDirectory, "node_modules", "playwright", "cli.js");
  runCommand(process.execPath, [playwrightCli, "install", "chromium"], { cwd: runtimeDirectory, env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browserDirectory }, shell: false });
}

console.log(`Website audit runtime is ready at ${runtimeDirectory}`);
console.log("Run an audit with `node runtime/scripts/audit.mjs --url <https://site.example>`. Add `--output <directory>` only to override the default output location.");

function parseArguments(argumentsToParse) {
  if (argumentsToParse.length === 0) {
    return null;
  }

  if (argumentsToParse.length === 1 && argumentsToParse[0] === "--skip-browser-download") {
    return true;
  }

  console.error("Usage: node runtime/scripts/bootstrap.mjs [--skip-browser-download]");
  process.exit(2);
}

function requireSupportedNode() {
  if (!supportsNodeVersion(process.versions.node)) {
    console.error(`Node.js ${minimumNodeVersion} or newer is required. Current version: ${process.versions.node}`);
    process.exit(1);
  }
}

function getNpmInvocation() {
  if (process.platform === "win32") {
    return { arguments: ["/d", "/s", "/c", "npm.cmd"], command: process.env.ComSpec || "cmd.exe" };
  }

  return { arguments: [], command: "npm" };
}

function runCommand(command, argumentsToRun, options) {
  const result = spawnSync(command, argumentsToRun, { ...options, stdio: "inherit" });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
