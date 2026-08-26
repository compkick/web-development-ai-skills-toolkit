import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { DEFAULT_EVIDENCE_ROOT_DIRECTORY, getDefaultEvidenceOutputDirectory, RAW_AUDIT_OUTPUT_GROUP } from "../config/runtime-config.mjs";
import { getRuntimeStatus } from "../config/runtime-status.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
  process.exit(0);
}

const runtimeStatus = await getRuntimeStatus();
const { browserDirectory, runtimeDirectory } = runtimeStatus;
const workerPath = path.join(runtimeDirectory, "scripts", "worker.mjs");
const workerArguments = [...process.argv.slice(2)];

if (!runtimeStatus.ready) {
  console.error("The plugin-owned website audit runtime is not ready.");

  for (const reason of runtimeStatus.reasons) console.error(`- ${reason}`);

  console.error(`Runtime directory: ${runtimeStatus.runtimeDirectory}`);
  console.error("After receiving permission to download its pinned dependencies, run `node runtime/scripts/bootstrap.mjs` from the plugin root.");
  process.exit(1);
}

if (!workerArguments.includes("--output")) {
  const url = getArgumentValue(workerArguments, "--url");

  if (url) workerArguments.push("--output", getDefaultEvidenceOutputDirectory(RAW_AUDIT_OUTPUT_GROUP, new URL(url)));
}

const result = spawnSync(process.execPath, [workerPath, ...workerArguments], { cwd: process.cwd(), env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browserDirectory }, stdio: "inherit" });

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);

function getArgumentValue(argumentsToRead, option) {
  const optionIndex = argumentsToRead.indexOf(option);
  return optionIndex === -1 ? null : argumentsToRead[optionIndex + 1] ?? null;
}

function printUsage() {
  console.log("Usage: node runtime/scripts/audit.mjs --url <https://site.example> [options]");
  console.log("");
  console.log("Options:");
  console.log(`  --output <directory>                    Override the default ${DEFAULT_EVIDENCE_ROOT_DIRECTORY}/${RAW_AUDIT_OUTPUT_GROUP}/<host>/<run-id> directory`);
  console.log("  --browser <auto|chrome|edge|chromium>  Browser selection; default: auto");
  console.log("  --collect-security                      Collect read-only public security observations");
  console.log("  --collect-seo                           Collect rendered metadata plus bounded robots.txt and sitemap observations");
  console.log("  --allow-no-sandbox                       Allow an unsandboxed root run in an isolated environment");
  console.log("  --include-error-details                  Write console/page error text to browser-errors.json");
  console.log("  --timeout-ms <milliseconds>             Navigation timeout; default: 45000");
  console.log("  --skip-accessibility                    Skip the automated axe review");
  console.log("  --skip-lighthouse                       Skip Lighthouse");
}
