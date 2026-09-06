import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { getRuntimeLocation } from "./runtime-config.mjs";

export async function getRuntimeStatus() {
  const location = await getRuntimeLocation();
  const readyMarkerPath = path.join(location.runtimeDirectory, "runtime-ready.json");
  const playwrightPackagePath = path.join(location.runtimeDirectory, "node_modules", "playwright", "package.json");
  const workerPath = location.workerPath;
  const [readyMarker, playwrightInstalled, workerInstalled, browserCacheExists] = await Promise.all([
    readJson(readyMarkerPath),
    exists(playwrightPackagePath),
    exists(workerPath),
    exists(location.browserDirectory)
  ]);
  const readyMarkerMatches = readyMarker?.runtimeKey === location.runtimeKey;
  const reasons = [];

  if (!readyMarker) reasons.push("The matching runtime-ready.json marker is missing or unreadable.");
  else if (!readyMarkerMatches) reasons.push("The runtime-ready.json marker does not match this plugin runtime.");
  if (!playwrightInstalled) reasons.push("The pinned Playwright dependency is not installed in the runtime cache.");
  for (const [name, version] of Object.entries(location.dependencies)) {
    const installed = await readJson(path.join(location.runtimeDirectory, "node_modules", name, "package.json"));
    if (installed?.version !== version) reasons.push(`The pinned ${name}@${version} dependency is missing or does not match.`);
  }

  return {
    browserCacheExists,
    browserDirectory: location.browserDirectory,
    installedAt: readyMarker?.installedAt ?? null,
    playwrightInstalled,
    ready: reasons.length === 0,
    readyMarkerMatches,
    readyMarkerPath,
    reasons,
    runtimeDirectory: location.runtimeDirectory,
    runtimeKey: location.runtimeKey,
    workerInstalled,
    workerDirectory: location.workerDirectory,
    workerKey: location.workerKey
  };
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
