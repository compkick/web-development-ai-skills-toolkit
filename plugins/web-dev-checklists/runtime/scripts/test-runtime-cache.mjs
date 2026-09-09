import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { dependencyFingerprint, getRuntimeLocation, runtimeSourceDirectory } from "../config/runtime-config.mjs";
import { stageRuntimeWorker } from "../config/runtime-worker.mjs";
import { exists } from "../evidence/package.mjs";
import { createFixtureDirectory, closeFixture } from "../testing/fixture-harness.mjs";

const directory = await createFixtureDirectory("toolkit-cache-test-");
try {
  const manifest = JSON.parse(await readFile(path.join(runtimeSourceDirectory, "package.json"), "utf8"));
  const lock = JSON.parse(await readFile(path.join(runtimeSourceDirectory, "package-lock.json"), "utf8"));
  const key = dependencyFingerprint(manifest, lock);
  const updatedLock = structuredClone(lock);
  updatedLock.version = updatedLock.packages[""].version = "99.0.0";
  assert.equal(dependencyFingerprint({ ...manifest, version: "99.0.0", description: "New release metadata" }, updatedLock), key);
  const changedDependencies = { ...manifest, dependencies: { ...manifest.dependencies, playwright: "99.0.0" } };
  assert.notEqual(dependencyFingerprint(changedDependencies, lock), key);
  updatedLock.packages["node_modules/playwright"].integrity = "changed";
  assert.notEqual(dependencyFingerprint(manifest, updatedLock), key);
  assert.notEqual(dependencyFingerprint(manifest, lock, { platform: "other", arch: "other", abi: "other" }), key);

  const location = await getRuntimeLocation();
  const workerDirectory = path.join(directory, "workers", location.workerKey);
  const staged = { ...location, runtimeDirectory: directory, workerDirectory, workerPath: path.join(workerDirectory, "scripts", "worker.mjs") };
  const [first, concurrent] = await Promise.all([stageRuntimeWorker(staged), stageRuntimeWorker(staged)]);
  assert.equal(first, concurrent);
  assert.equal(await readFile(first, "utf8"), await readFile(path.join(runtimeSourceDirectory, "scripts", "worker.mjs"), "utf8"));
  assert.equal(await stageRuntimeWorker(staged), first);
  assert.equal(await exists(path.join(directory, "node_modules")), false, "Worker updates must not install dependencies.");
  for (const file of location.sourceFiles) assert.ok(await exists(path.join(workerDirectory, file)), `Missing staged module ${file}`);
  console.log("Runtime cache tests passed: release-independent dependency keys and atomic, dependency-free worker staging.");
} finally {
  await closeFixture(null, directory);
}
