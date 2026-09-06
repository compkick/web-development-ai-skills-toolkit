import { copyFile, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import path from "node:path";
import { getRuntimeLocation, runtimeSourceDirectory } from "./runtime-config.mjs";
import { exists, writeJson } from "../evidence/package.mjs";

// Stage current plugin code without reinstalling dependencies. Immutable revisions also
// allow parallel reviews from different installed plugin releases to finish safely.
export async function stageRuntimeWorker(location) {
  location ??= await getRuntimeLocation();
  const markerPath = path.join(location.workerDirectory, "worker-ready.json");
  if (await exists(markerPath) && await exists(location.workerPath)) return location.workerPath;

  const workersDirectory = path.dirname(location.workerDirectory);
  await mkdir(workersDirectory, { recursive: true });
  const stagingDirectory = await mkdtemp(path.join(workersDirectory, ".staging-"));
  try {
    for (const file of location.sourceFiles) {
      const target = path.join(stagingDirectory, file);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join(runtimeSourceDirectory, file), target);
    }
    await writeJson(path.join(stagingDirectory, "worker-ready.json"), { workerKey: location.workerKey });
    try {
      await rename(stagingDirectory, location.workerDirectory);
    } catch (error) {
      // A concurrent run may have published the same complete immutable worker.
      if (!await exists(markerPath) || !await exists(location.workerPath)) throw error;
    }
  } finally {
    // This exact directory was created above under the validated workers directory.
    await rm(stagingDirectory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
  return location.workerPath;
}
