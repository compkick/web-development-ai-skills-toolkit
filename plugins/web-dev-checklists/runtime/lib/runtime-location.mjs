import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const libraryDirectory = path.dirname(fileURLToPath(import.meta.url));
export const runtimeSourceDirectory = path.resolve(libraryDirectory, "..");

export async function getRuntimeLocation() {
  const sourceFiles = ["package.json", "package-lock.json", "scripts/worker.mjs"];
  const hash = createHash("sha256");

  for (const sourceFile of sourceFiles) {
    hash.update(await readFile(path.join(runtimeSourceDirectory, sourceFile)));
  }

  const runtimeKey = hash.digest("hex").slice(0, 16);
  const cacheRoot = process.env.WEB_DEV_CHECKLISTS_CACHE ? path.resolve(process.env.WEB_DEV_CHECKLISTS_CACHE) : getDefaultCacheRoot();
  const runtimeDirectory = path.join(cacheRoot, runtimeKey);

  return {
    browserDirectory: path.join(cacheRoot, "browsers"),
    cacheRoot,
    runtimeDirectory,
    runtimeKey,
    sourceFiles
  };
}

function getDefaultCacheRoot() {
  if (process.platform === "win32") {
    return path.join(process.env.LOCALAPPDATA || os.homedir(), "web-dev-checklists", "audit-runtime");
  }

  return path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"), "web-dev-checklists", "audit-runtime");
}
