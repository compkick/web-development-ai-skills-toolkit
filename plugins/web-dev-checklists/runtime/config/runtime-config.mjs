import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_EVIDENCE_ROOT_DIRECTORY = ".output";
export const DEFAULT_AXE_ELEMENT_SCREENSHOT_LIMIT = 50;
export const DEFAULT_LAUNCH_LINK_CHECK_LIMIT = 50;
export const AUDIT_FORM_FACTOR = "desktop";
export const AUDIT_VIEWPORT = Object.freeze({ height: 900, width: 1440 });
export const AUDIT_USER_AGENT = "AI-Agent-Skills-Toolkit-for-Web-Development/0.1";
export const SCREENSHOT_READINESS = Object.freeze({ timeoutMs: 8000, loadTimeoutMs: 5000, maxScrollSteps: 40, scrollPauseMs: 150, settleMs: 300 });
export const RAW_AUDIT_OUTPUT_GROUP = "runtime-audit";
export const RUNTIME_CACHE_ENVIRONMENT_VARIABLE = "WEB_DEV_CHECKLISTS_CACHE";
export const runtimeSourceDirectory = path.resolve(configDirectory, "..");

export async function getRuntimeLocation() {
  const manifest = JSON.parse(await readFile(path.join(runtimeSourceDirectory, "package.json"), "utf8"));
  const lock = JSON.parse(await readFile(path.join(runtimeSourceDirectory, "package-lock.json"), "utf8"));
  const runtimeKey = dependencyFingerprint(manifest, lock);
  const sourceFiles = ["scripts/worker.mjs"];
  for (const directory of ["browser", "collectors", "config", "evidence", "reporting"]) {
    sourceFiles.push(...await listModules(path.join(runtimeSourceDirectory, directory), directory));
  }
  sourceFiles.sort();
  const hash = createHash("sha256");
  for (const sourceFile of sourceFiles) hash.update(sourceFile).update("\0").update(await readFile(path.join(runtimeSourceDirectory, sourceFile)));
  const workerKey = hash.digest("hex").slice(0, 16);
  const configuredCacheRoot = process.env[RUNTIME_CACHE_ENVIRONMENT_VARIABLE];
  const cacheRoot = configuredCacheRoot ? path.resolve(configuredCacheRoot) : getDefaultRuntimeCacheRoot();
  const runtimeDirectory = path.join(cacheRoot, runtimeKey);
  // Each immutable worker revision resolves dependencies from its parent runtime directory.
  const workerDirectory = path.join(runtimeDirectory, "workers", workerKey);

  return {
    browserDirectory: path.join(cacheRoot, "browsers"),
    cacheRoot,
    runtimeDirectory,
    runtimeKey,
    workerDirectory,
    workerKey,
    workerPath: path.join(workerDirectory, "scripts", "worker.mjs"),
    sourceFiles,
    dependencies: manifest.dependencies
  };
}

export function dependencyFingerprint(manifest, lock, environment = { platform: process.platform, arch: process.arch, abi: process.versions.modules }) {
  const packages = { ...lock.packages };
  delete packages[""];
  const installation = { dependencies: manifest.dependencies, optionalDependencies: manifest.optionalDependencies, overrides: manifest.overrides, engines: manifest.engines, lockfileVersion: lock.lockfileVersion, packages, environment };
  return createHash("sha256").update(JSON.stringify(sortKeys(installation))).digest("hex").slice(0, 16);
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
}

async function listModules(directory, relativeDirectory) {
  const modules = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = `${relativeDirectory}/${entry.name}`;
    if (entry.isDirectory()) modules.push(...await listModules(path.join(directory, entry.name), relativePath));
    else if (entry.isFile() && entry.name.endsWith(".mjs")) modules.push(relativePath);
  }
  return modules;
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
