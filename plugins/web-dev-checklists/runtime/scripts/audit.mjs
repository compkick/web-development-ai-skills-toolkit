import path from "node:path";
import { parseArguments } from "../config/audit-options.mjs";
import { exists, prepareOutputDirectory, readJson } from "../evidence/package.mjs";
import { emptyRunSummary, recordRunFailure } from "../evidence/run-failure.mjs";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { DEFAULT_EVIDENCE_ROOT_DIRECTORY, getDefaultEvidenceOutputDirectory, RAW_AUDIT_OUTPUT_GROUP } from "../config/runtime-config.mjs";
import { getRuntimeStatus } from "../config/runtime-status.mjs";
import { stageRuntimeWorker } from "../config/runtime-worker.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
  process.exit(0);
}

const workerArguments = [...process.argv.slice(2)];
if (!workerArguments.includes("--output")) {
  const url = getArgumentValue(workerArguments, "--url");
  if (url) workerArguments.push("--output", getDefaultEvidenceOutputDirectory(RAW_AUDIT_OUTPUT_GROUP, new URL(url)));
}
const options = parseArguments(workerArguments);
// Never write failure evidence into a non-empty directory from an earlier run.
await prepareOutputDirectory(options.outputDirectory);
const startedAt = new Date().toISOString();
let stage = "runtime-readiness";
try {
  const runtimeStatus = await getRuntimeStatus();
  if (!runtimeStatus.ready) {
    console.error("The plugin-owned website audit runtime is not ready.");
    for (const reason of runtimeStatus.reasons) console.error(`- ${reason}`);
    console.error(`Runtime directory: ${runtimeStatus.runtimeDirectory}`);
    console.error("After receiving permission to download its pinned dependencies, run `node runtime/scripts/bootstrap.mjs` from the plugin root.");
    throw new Error("Runtime dependencies are not ready.");
  }
  stage = "worker-staging";
  const workerPath = await stageRuntimeWorker();
  stage = "worker-start";
  const result = spawnSync(process.execPath, [workerPath, ...workerArguments], { cwd: process.cwd(), env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: runtimeStatus.browserDirectory }, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const summaryPath = path.join(options.outputDirectory, "summary.json");
    const summary = await exists(summaryPath) ? await readJson(summaryPath) : emptyRunSummary(options, startedAt);
    if (!summary.runFailure) await recordRunFailure(options, summary, stage, new Error(`Worker exited with ${result.status}.`));
  }
  process.exitCode = result.status ?? 1;
} catch (error) {
  await recordRunFailure(options, emptyRunSummary(options, startedAt), stage, error);
  console.error(error.message);
  process.exitCode = 1;
}

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
  console.log("  --collect-launch                        Collect bounded homepage, navigation, footer, and same-host link evidence");
  console.log("  --collect-security                      Collect read-only public security observations");
  console.log("  --collect-seo                           Collect rendered metadata plus bounded robots.txt and sitemap observations");
  console.log("  --allow-no-sandbox                       Allow an unsandboxed root run in an isolated environment");
  console.log("  --include-error-details                  Write console/page error text to browser-errors.json");
  console.log("  --timeout-ms <milliseconds>             Navigation timeout; default: 45000");
  console.log("  --skip-accessibility                    Skip the automated axe review");
  console.log("  --skip-lighthouse                       Skip Lighthouse");
}
