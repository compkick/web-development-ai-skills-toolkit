import { buildCoverage } from "../plugins/web-dev-checklists/runtime/evidence/package.mjs";
import { validateCoverage } from "../plugins/web-dev-checklists/runtime/testing/schema-validation.mjs";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDirectory = path.join(repositoryRoot, "plugins", "web-dev-checklists", "runtime");
const profileDirectory = path.join(runtimeDirectory, "profiles");
const errors = [];
const profiles = (await readdir(profileDirectory)).filter((file) => file.endsWith(".json")).map((file) => file.slice(0, -5)).sort();

for (const profileId of profiles) {
  const profilePath = path.join(profileDirectory, `${profileId}.json`);
  const profile = await readJson(profilePath);
  validateCoverage(buildCoverage(profile), profileId);

  if (profile.id !== profileId) errors.push(`${profilePath} id must match its filename.`);
  if (!/^\d+\.\d+\.\d+$/.test(profile.version)) errors.push(`${profilePath} version must be semantic versioning without a range.`);
  if (!Array.isArray(profile.coverage) || profile.coverage.length === 0) errors.push(`${profilePath} must define coverage items.`);

  const checklistPath = path.resolve(repositoryRoot, profile.checklistSource);
  const relativeChecklistPath = path.relative(repositoryRoot, checklistPath);

  if (relativeChecklistPath.startsWith("..") || path.isAbsolute(relativeChecklistPath)) {
    errors.push(`${profilePath} checklistSource must stay inside the repository.`);
    continue;
  }

  const checklistContent = await readFile(checklistPath, "utf8");
  const checklistItems = [...checklistContent.matchAll(/^- \[ \] (.+)$/gm)].map((match) => match[1]);
  const profileItems = profile.coverage.map((item) => item.checklistItem);
  const duplicateIds = findDuplicates(profile.coverage.map((item) => item.id));
  const duplicateItems = findDuplicates(profileItems);

  if (duplicateIds.length > 0) errors.push(`${profilePath} has duplicate coverage ids: ${duplicateIds.join(", ")}`);
  if (duplicateItems.length > 0) errors.push(`${profilePath} maps checklist items more than once: ${duplicateItems.join(" | ")}`);

  for (const checklistItem of checklistItems) {
    if (!profileItems.includes(checklistItem)) errors.push(`${profilePath} does not map checklist item: ${checklistItem}`);
  }

  for (const profileItem of profileItems) {
    if (!checklistItems.includes(profileItem)) errors.push(`${profilePath} maps text that is not a current checklist item: ${profileItem}`);
  }

  for (const item of profile.coverage) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) errors.push(`${profilePath} has invalid coverage id: ${item.id}`);
    if (!new Set(["automated", "partial", "manual"]).has(item.automation)) errors.push(`${profilePath} has invalid automation value for ${item.id}: ${item.automation}`);
    if (!Array.isArray(item.evidenceCheckIds)) errors.push(`${profilePath} evidenceCheckIds must be an array for ${item.id}.`);

  }
}

for (const fixtureName of ["accessibility-pass.html", "accessibility-fail.html", "security-pass.html", "security-fail.html", "performance-pass.html", "performance-fail.html", "technical-seo-pass.html", "technical-seo-fail.html", "launch-pass.html", "launch-fail.html", "audit-pass.html", "audit-fail.html"]) {
  try {
    await access(path.join(runtimeDirectory, "fixtures", fixtureName));
  } catch {
    errors.push(`Missing deterministic fixture: ${fixtureName}`);
  }
}

if (errors.length > 0) {
  console.error("Deterministic review runner validation failed:");

  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Deterministic review runner: ${profiles.length} profiles map every canonical checklist item and coverage conforms to its JSON schema.`);

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function findDuplicates(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}
