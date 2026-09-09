import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function createEvidence(profile, summary, { checks, artifacts, limitations }) {
  return {
    schemaVersion: "1.0.0",
    profile: { id: profile.id, standard: profile.standard, version: profile.version },
    target: { finalUrl: summary.page.finalUrl, requestedUrl: summary.requestedUrl },
    run: { browser: summary.browser, completedAt: summary.completedAt, startedAt: summary.startedAt },
    checks, artifacts, limitations
  };
}

export async function collectArtifacts(outputDirectory, definitions) {
  const artifacts = [];
  for (const [artifactPath, purpose] of definitions) {
    if (await exists(path.join(outputDirectory, artifactPath))) artifacts.push({ path: artifactPath, purpose });
  }
  return artifacts;
}

export function buildCoverage(profileToUse) {
  return {
    schemaVersion: "1.0.0",
    profile: { id: profileToUse.id, version: profileToUse.version },
    checklistSource: profileToUse.checklistSource,
    items: profileToUse.coverage
  };
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function prepareOutputDirectory(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const existingEntries = await readdir(outputDirectory);

  if (existingEntries.length > 0) {
    throw new Error(`Output directory must be empty: ${outputDirectory}`);
  }
}
