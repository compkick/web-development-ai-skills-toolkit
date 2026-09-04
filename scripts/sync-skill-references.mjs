import { access, mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const configPath = path.join(scriptDirectory, "skill-reference-map.json");
const generatedReferenceHeader = /^<!-- Generated from .+ by scripts\/sync-skill-references\.mjs\. Do not edit this copy\. -->\r?\n/;
const checkOnly = process.argv.includes("--check");
const unknownArguments = process.argv.slice(2).filter((argument) => argument !== "--check");

if (unknownArguments.length > 0) {
  console.error(`Unknown argument${unknownArguments.length === 1 ? "" : "s"}: ${unknownArguments.join(", ")}`);
  process.exit(2);
}

const config = JSON.parse(await readFile(configPath, "utf8"));
const pluginRoot = resolveInsideRepository(config.pluginRoot, "pluginRoot");
const staleReferences = [];
let synchronizedCount = 0;
let removedCount = 0;
let pendingCount = 0;

await access(pluginRoot);

for (const [skillName, sources] of Object.entries(config.skills)) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName)) {
    throw new Error(`Invalid skill name in ${path.relative(repositoryRoot, configPath)}: ${skillName}`);
  }

  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error(`Reference sources for ${skillName} must be a non-empty array.`);
  }

  const resolvedSources = sources.map((sourceEntry) => resolveInsideRepository(sourceEntry, `source for ${skillName}`));

  for (const sourcePath of resolvedSources) {
    await access(sourcePath);
  }

  const skillDirectory = path.join(pluginRoot, "skills", skillName);

  if (!(await exists(skillDirectory))) {
    pendingCount += 1;
    continue;
  }

  const referencesDirectory = path.join(skillDirectory, "references");
  const expectedReferenceNames = new Set(resolvedSources.map((sourcePath) => path.basename(sourcePath)));

  for (const sourcePath of resolvedSources) {
    const sourceContent = await readFile(sourcePath, "utf8");
    const sourceName = path.basename(sourcePath);
    const targetPath = path.join(referencesDirectory, sourceName);
    const relativeSource = path.relative(repositoryRoot, sourcePath).split(path.sep).join("/");
    const generatedContent = `<!-- Generated from ${relativeSource} by scripts/sync-skill-references.mjs. Do not edit this copy. -->\n\n${sourceContent}`;

    if (checkOnly) {
      const currentContent = await readFile(targetPath, "utf8").catch(() => null);

      if (currentContent !== generatedContent) {
        staleReferences.push(path.relative(repositoryRoot, targetPath));
      }

      continue;
    }

    await mkdir(referencesDirectory, { recursive: true });
    await writeFile(targetPath, generatedContent, "utf8");
    synchronizedCount += 1;
  }

  for (const directoryEntry of await readDirectory(referencesDirectory)) {
    if (!directoryEntry.isFile() || expectedReferenceNames.has(directoryEntry.name)) continue;

    const targetPath = path.join(referencesDirectory, directoryEntry.name);
    const currentContent = await readFile(targetPath, "utf8");

    if (!generatedReferenceHeader.test(currentContent)) continue;

    if (checkOnly) {
      staleReferences.push(path.relative(repositoryRoot, targetPath));
      continue;
    }

    await unlink(targetPath);
    removedCount += 1;
  }
}

if (staleReferences.length > 0) {
  console.error("Skill references are missing, stale, or obsolete:");

  for (const reference of staleReferences) {
    console.error(`- ${reference}`);
  }

  console.error("Run `npm run skills:refs` to regenerate them.");
  process.exit(1);
}

if (checkOnly) {
  console.log(`Skill references are current. ${pendingCount} planned skill${pendingCount === 1 ? " is" : "s are"} not scaffolded yet.`);
} else {
  console.log(`Synchronized ${synchronizedCount} reference file${synchronizedCount === 1 ? "" : "s"} and removed ${removedCount} obsolete generated reference${removedCount === 1 ? "" : "s"}. ${pendingCount} planned skill${pendingCount === 1 ? " is" : "s are"} not scaffolded yet.`);
}

function resolveInsideRepository(relativePath, label) {
  if (typeof relativePath !== "string" || relativePath.length === 0 || path.isAbsolute(relativePath)) {
    throw new Error(`${label} must be a non-empty repository-relative path.`);
  }

  const resolvedPath = path.resolve(repositoryRoot, relativePath);
  const relativeToRoot = path.relative(repositoryRoot, resolvedPath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new Error(`${label} resolves outside the repository: ${relativePath}`);
  }

  return resolvedPath;
}

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readDirectory(targetPath) {
  try {
    return await readdir(targetPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}
