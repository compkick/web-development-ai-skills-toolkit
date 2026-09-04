import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const locations = {
  repositoryPackage: "package.json",
  repositoryLock: "package-lock.json",
  runtimePackage: "plugins/web-dev-checklists/runtime/package.json",
  runtimeLock: "plugins/web-dev-checklists/runtime/package-lock.json",
  pluginManifest: "plugins/web-dev-checklists/.codex-plugin/plugin.json"
};

const files = Object.fromEntries(await Promise.all(Object.entries(locations).map(async ([key, relativePath]) => {
  const content = await readFile(path.join(repositoryRoot, relativePath), "utf8");
  return [key, JSON.parse(content)];
})));
const releaseVersion = files.repositoryPackage.version;
const publicName = "Web Development Toolkit & AI Skill Pack";
const repositoryPackageName = "web-development-toolkit-ai-skill-pack";
const runtimePackageName = "web-development-toolkit-audit-runtime";
const pluginVersion = files.pluginManifest.version;
const pluginBaseVersion = typeof pluginVersion === "string" ? pluginVersion.split("+", 1)[0] : undefined;
const versions = [
  [locations.repositoryPackage, releaseVersion],
  [`${locations.repositoryLock} top level`, files.repositoryLock.version],
  [`${locations.repositoryLock} root package`, files.repositoryLock.packages?.[""]?.version],
  [locations.runtimePackage, files.runtimePackage.version],
  [`${locations.runtimeLock} top level`, files.runtimeLock.version],
  [`${locations.runtimeLock} root package`, files.runtimeLock.packages?.[""]?.version],
  [`${locations.pluginManifest} base version`, pluginBaseVersion]
];
const errors = [];

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(releaseVersion)) {
  errors.push(`${locations.repositoryPackage} must contain a semantic release version without build metadata; found ${releaseVersion}.`);
}

for (const [location, version] of versions) {
  if (version !== releaseVersion) errors.push(`${location} must use release version ${releaseVersion}; found ${version ?? "missing"}.`);
}

if (typeof pluginVersion === "string" && pluginVersion.includes("+") && !/^.+\+codex\.[0-9A-Za-z.-]+$/.test(pluginVersion)) {
  errors.push(`${locations.pluginManifest} may only add a +codex.<cachebuster> build suffix; found ${pluginVersion}.`);
}

for (const [location, name, expectedName] of [
  [locations.repositoryPackage, files.repositoryPackage.name, repositoryPackageName],
  [`${locations.repositoryLock} top level`, files.repositoryLock.name, repositoryPackageName],
  [`${locations.repositoryLock} root package`, files.repositoryLock.packages?.[""]?.name, repositoryPackageName],
  [locations.runtimePackage, files.runtimePackage.name, runtimePackageName],
  [`${locations.runtimeLock} top level`, files.runtimeLock.name, runtimePackageName],
  [`${locations.runtimeLock} root package`, files.runtimeLock.packages?.[""]?.name, runtimePackageName],
  [`${locations.pluginManifest} display name`, files.pluginManifest.interface?.displayName, publicName]
]) {
  if (name !== expectedName) errors.push(`${location} must use ${expectedName}; found ${name ?? "missing"}.`);
}

if (errors.length > 0) {
  console.error("Release version validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Release version ${releaseVersion} and toolkit names are consistent across the repository, audit runtime, and plugin manifest.`);
