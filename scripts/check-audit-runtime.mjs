import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDirectory = path.join(repositoryRoot, "plugins", "web-dev-checklists", "runtime");
const packageJson = JSON.parse(await readFile(path.join(runtimeDirectory, "package.json"), "utf8"));
const packageLock = JSON.parse(await readFile(path.join(runtimeDirectory, "package-lock.json"), "utf8"));
const lockedRoot = packageLock.packages?.[""];
const errors = [];

if (!lockedRoot) {
  errors.push("Runtime package-lock.json is missing its root package entry.");
} else if (JSON.stringify(packageJson.dependencies) !== JSON.stringify(lockedRoot.dependencies)) {
  errors.push("Runtime package.json dependencies do not match package-lock.json.");
}

for (const [dependency, version] of Object.entries(packageJson.dependencies ?? {})) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    errors.push(`Runtime dependency ${dependency} must use an exact version, found ${version}.`);
  }
}

const scripts = [
  "collectors/homepage-links.mjs",
  "collectors/http-redirect.mjs",
  "collectors/tls-baseline.mjs",
  "config/runtime-config.mjs",
  "config/runtime-status.mjs",
  "reporting/axe-report.mjs",
  "reporting/launch-report.mjs",
  "reporting/page-screenshot.mjs",
  "reporting/performance-report.mjs",
  "reporting/security-report.mjs",
  "reporting/technical-seo-report.mjs",
  "reporting/web-project-audit-report.mjs",
  "scripts/audit.mjs",
  "scripts/bootstrap.mjs",
  "scripts/review.mjs",
  "scripts/status.mjs",
  "scripts/test-runtime-status.mjs",
  "scripts/test-review-runner.mjs",
  "scripts/test-performance-review-runner.mjs",
  "scripts/test-launch-review-runner.mjs",
  "scripts/test-security-review-runner.mjs",
  "scripts/test-technical-seo-review-runner.mjs",
  "scripts/test-web-project-audit-runner.mjs",
  "scripts/test-runtime.mjs",
  "scripts/test-page-screenshot.mjs",
  "scripts/worker.mjs"
];

for (const script of scripts) {
  const scriptPath = path.join(runtimeDirectory, script);
  const result = spawnSync(process.execPath, ["--check", scriptPath], { encoding: "utf8" });

  if (result.status !== 0) {
    errors.push(`${script} failed Node.js syntax validation: ${result.stderr.trim()}`);
  }
}

if (errors.length > 0) {
  console.error("Website audit runtime validation failed:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log(`Website audit runtime: ${scripts.length} scripts valid and ${Object.keys(packageJson.dependencies).length} dependencies pinned.`);
