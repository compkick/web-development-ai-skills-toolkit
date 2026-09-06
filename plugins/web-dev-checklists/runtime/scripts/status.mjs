import process from "node:process";
import { getRuntimeStatus } from "../config/runtime-status.mjs";

const jsonOutput = parseArguments(process.argv.slice(2));
const status = await getRuntimeStatus();

if (jsonOutput) {
  console.log(JSON.stringify(status, null, 2));
} else {
  console.log(`Website audit runtime status: ${status.ready ? "ready" : "not ready"}`);
  console.log(`Runtime directory: ${status.runtimeDirectory}`);
  console.log(`Runtime key: ${status.runtimeKey}`);
  console.log(`Worker revision: ${status.workerKey}${status.workerInstalled ? " (staged)" : " (will be staged on the next run)"}`);
  console.log(`Shared browser cache: ${status.browserDirectory}${status.browserCacheExists ? " (present)" : " (not present)"}`);

  if (status.installedAt) console.log(`Installed at: ${status.installedAt}`);

  for (const reason of status.reasons) console.log(`- ${reason}`);

  if (!status.ready) {
    console.log("After receiving permission to install the pinned dependencies, run `node runtime/scripts/bootstrap.mjs` from the plugin root.");
  }
}

process.exit(status.ready ? 0 : 1);

function parseArguments(argumentsToParse) {
  if (argumentsToParse.length === 0) return false;
  if (argumentsToParse.length === 1 && argumentsToParse[0] === "--json") return true;

  console.error("Usage: node runtime/scripts/status.mjs [--json]");
  process.exit(2);
}
