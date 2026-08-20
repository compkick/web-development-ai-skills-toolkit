import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { getRuntimeLocation } from "../lib/runtime-location.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
  process.exit(0);
}

const { browserDirectory, runtimeDirectory } = await getRuntimeLocation();
const workerPath = path.join(runtimeDirectory, "worker.mjs");
const readyMarkerPath = path.join(runtimeDirectory, "runtime-ready.json");

if (!(await exists(workerPath)) || !(await exists(readyMarkerPath))) {
  console.error("The plugin-owned website audit runtime is not installed.");
  console.error("After receiving permission to download its pinned dependencies, run `node runtime/scripts/bootstrap.mjs` from the plugin root.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [workerPath, ...process.argv.slice(2)], { cwd: process.cwd(), env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browserDirectory }, stdio: "inherit" });

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function printUsage() {
  console.log("Usage: node runtime/scripts/audit.mjs --url <https://site.example> --output <directory> [options]");
  console.log("");
  console.log("Options:");
  console.log("  --browser <auto|chrome|edge|chromium>  Browser selection; default: auto");
  console.log("  --allow-no-sandbox                       Allow an unsandboxed root run in an isolated environment");
  console.log("  --include-error-details                  Write console/page error text to browser-errors.json");
  console.log("  --timeout-ms <milliseconds>             Navigation timeout; default: 45000");
  console.log("  --skip-accessibility                    Skip the automated axe review");
  console.log("  --skip-lighthouse                       Skip Lighthouse");
}
