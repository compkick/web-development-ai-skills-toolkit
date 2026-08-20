import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const configPath = path.join(scriptDirectory, "skill-reference-map.json");
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
}

if (staleReferences.length > 0) {
  console.error("Skill references are missing or stale:");

  for (const reference of staleReferences) {
    console.error(`- ${reference}`);
  }

  console.error("Run `npm run skills:refs` to regenerate them.");
  process.exit(1);
}

if (checkOnly) {
  console.log(`Skill references are current. ${pendingCount} planned skill${pendingCount === 1 ? " is" : "s are"} not scaffolded yet.`);
} else {
  console.log(`Synchronized ${synchronizedCount} reference file${synchronizedCount === 1 ? "" : "s"}. ${pendingCount} planned skill${pendingCount === 1 ? " is" : "s are"} not scaffolded yet.`);
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
