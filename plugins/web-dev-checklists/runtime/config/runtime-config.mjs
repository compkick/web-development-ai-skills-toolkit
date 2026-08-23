import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_EVIDENCE_ROOT_DIRECTORY = ".output";
export const DEFAULT_AXE_ELEMENT_SCREENSHOT_LIMIT = 50;
export const RAW_AUDIT_OUTPUT_GROUP = "runtime-audit";
export const RUNTIME_CACHE_ENVIRONMENT_VARIABLE = "WEB_DEV_CHECKLISTS_CACHE";
export const runtimeSourceDirectory = path.resolve(configDirectory, "..");

const RUNTIME_SOURCE_FILES = ["package.json", "package-lock.json", "config/runtime-config.mjs", "reporting/axe-report.mjs", "scripts/worker.mjs"];

export async function getRuntimeLocation() {
  const hash = createHash("sha256");

  for (const sourceFile of RUNTIME_SOURCE_FILES) {
    hash.update(await readFile(path.join(runtimeSourceDirectory, sourceFile)));
  }

  const runtimeKey = hash.digest("hex").slice(0, 16);
  const configuredCacheRoot = process.env[RUNTIME_CACHE_ENVIRONMENT_VARIABLE];
  const cacheRoot = configuredCacheRoot ? path.resolve(configuredCacheRoot) : getDefaultRuntimeCacheRoot();

  return {
    browserDirectory: path.join(cacheRoot, "browsers"),
    cacheRoot,
    runtimeDirectory: path.join(cacheRoot, runtimeKey),
    runtimeKey,
    sourceFiles: RUNTIME_SOURCE_FILES
  };
}

export function getDefaultEvidenceOutputDirectory(profileId, targetUrl, runDate = new Date()) {
  const targetName = `${targetUrl.hostname}${targetUrl.port ? `-${targetUrl.port}` : ""}`.replace(/[^a-zA-Z0-9.-]+/g, "-").replace(/^-+|-+$/g, "") || "site";
  const isoTimestamp = runDate.toISOString();
  const runId = `${isoTimestamp.slice(0, 10).replaceAll("-", "")}-${isoTimestamp.slice(11, 19).replaceAll(":", "")}-${isoTimestamp.slice(20, 23)}Z`;
  return path.resolve(DEFAULT_EVIDENCE_ROOT_DIRECTORY, profileId, targetName, runId);
}

function getDefaultRuntimeCacheRoot() {
  if (process.platform === "win32") {
    return path.join(process.env.LOCALAPPDATA || os.homedir(), "web-dev-checklists", "audit-runtime");
  }

  return path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"), "web-dev-checklists", "audit-runtime");
}
