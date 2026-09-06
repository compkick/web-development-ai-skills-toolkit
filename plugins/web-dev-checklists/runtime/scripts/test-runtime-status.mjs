import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { getRuntimeLocation, RUNTIME_CACHE_ENVIRONMENT_VARIABLE } from "../config/runtime-config.mjs";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const statusScript = path.join(scriptsDirectory, "status.mjs");
const testCacheRoot = await mkdtemp(path.join(os.tmpdir(), "web-dev-checklists-runtime-status-test-"));
const originalCacheOverride = process.env[RUNTIME_CACHE_ENVIRONMENT_VARIABLE];

try {
  process.env[RUNTIME_CACHE_ENVIRONMENT_VARIABLE] = testCacheRoot;
  const location = await getRuntimeLocation();
  const missingStatus = runStatus(testCacheRoot);

  if (missingStatus.status !== 1 || missingStatus.output.ready !== false || missingStatus.output.runtimeDirectory !== location.runtimeDirectory) {
    throw new Error("Runtime status did not report an empty cache as not ready.");
  }

  for (const [name, version] of Object.entries(location.dependencies)) {
    const packageDirectory = path.join(location.runtimeDirectory, "node_modules", name);
    await mkdir(packageDirectory, { recursive: true });
    await writeFile(path.join(packageDirectory, "package.json"), JSON.stringify({ version }), "utf8");
  }
  await writeFile(path.join(location.runtimeDirectory, "runtime-ready.json"), `${JSON.stringify({ installedAt: "2026-08-25T00:00:00.000Z", runtimeKey: location.runtimeKey }, null, 2)}\n`, "utf8");

  const readyStatus = runStatus(testCacheRoot);

  if (readyStatus.status !== 0 || readyStatus.output.ready !== true || readyStatus.output.reasons.length !== 0) {
    throw new Error("Runtime status did not recognize a complete matching cache.");
  }

  if (readyStatus.output.workerInstalled !== false) throw new Error("Worker staging must be independent of dependency readiness.");

  await writeFile(path.join(location.runtimeDirectory, "runtime-ready.json"), `${JSON.stringify({ runtimeKey: "outdated" }, null, 2)}\n`, "utf8");
  const outdatedStatus = runStatus(testCacheRoot);

  if (outdatedStatus.status !== 1 || outdatedStatus.output.readyMarkerMatches !== false) {
    throw new Error("Runtime status did not reject an outdated ready marker.");
  }

  console.log("Website audit runtime status test passed.");
} finally {
  if (originalCacheOverride === undefined) delete process.env[RUNTIME_CACHE_ENVIRONMENT_VARIABLE];
  else process.env[RUNTIME_CACHE_ENVIRONMENT_VARIABLE] = originalCacheOverride;
  await rm(testCacheRoot, { recursive: true, force: true });
}

function runStatus(cacheRoot) {
  const result = spawnSync(process.execPath, [statusScript, "--json"], {
    encoding: "utf8",
    env: { ...process.env, [RUNTIME_CACHE_ENVIRONMENT_VARIABLE]: cacheRoot }
  });

  if (result.error) throw result.error;
  if (![0, 1].includes(result.status)) throw new Error(`Runtime status command exited unexpectedly: ${result.status}\n${result.stderr}`);
  return { output: JSON.parse(result.stdout), status: result.status };
}
