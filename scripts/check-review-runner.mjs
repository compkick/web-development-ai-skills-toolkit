import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDirectory = path.join(repositoryRoot, "plugins", "web-dev-checklists", "runtime");
const profileDirectory = path.join(runtimeDirectory, "profiles");
const errors = [];
const knownEvidenceCheckIds = new Set([
  "automated-axe-scan",
  "browser-errors",
  "certificate-validity",
  "content-security-policy",
  "content-type-protection",
  "cors-policy",
  "document-language",
  "document-structure",
  "document-title",
  "framing-protection",
  "http-to-https-redirect",
  "https-transport",
  "insecure-page-resources",
  "lighthouse-accessibility",
  "lighthouse-performance-run",
  "lighthouse-performance-score",
  "lab-cumulative-layout-shift",
  "lab-largest-contentful-paint",
  "lab-supporting-metrics",
  "lab-total-blocking-time",
  "image-delivery",
  "layout-stability",
  "lcp-resource-loading",
  "main-thread-work",
  "page-http-status",
  "public-cookie-flags",
  "referrer-policy",
  "response-disclosure",
  "security-collection",
  "security-txt",
  "server-response-and-redirects",
  "strict-transport-security",
  "render-blocking-resources",
  "resource-caching-and-compression",
  "third-party-impact",
  "tls-cipher-suite",
  "tls-deprecated-versions",
  "tls-forward-secrecy",
  "tls-key-exchange-group",
  "tls-supported-versions",
  "unused-code"
]);
const profiles = ["review-web-accessibility", "review-web-security", "review-web-performance"];

for (const profileId of profiles) {
  const profilePath = path.join(profileDirectory, `${profileId}.json`);
  const profile = await readJson(profilePath);

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

    for (const evidenceCheckId of item.evidenceCheckIds ?? []) {
      if (!knownEvidenceCheckIds.has(evidenceCheckId)) errors.push(`${profilePath} references unknown evidence check ${evidenceCheckId} from ${item.id}.`);
    }
  }
}

for (const schemaName of ["review-evidence-v1.schema.json", "review-coverage-v1.schema.json"]) {
  const schema = await readJson(path.join(runtimeDirectory, "schemas", schemaName));

  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema" || schema.type !== "object" || !Array.isArray(schema.required)) {
    errors.push(`${schemaName} is not a supported object schema.`);
  }
}

for (const relativeScriptPath of ["runtime/scripts/review.mjs", "runtime/scripts/test-review-runner.mjs", "runtime/scripts/test-security-review-runner.mjs", "runtime/scripts/test-performance-review-runner.mjs"]) {
  const scriptPath = path.join(repositoryRoot, "plugins", "web-dev-checklists", relativeScriptPath);
  const result = spawnSync(process.execPath, ["--check", scriptPath], { encoding: "utf8" });

  if (result.status !== 0) errors.push(`${relativeScriptPath} failed Node.js syntax validation: ${result.stderr.trim()}`);
}

for (const fixtureName of ["accessibility-pass.html", "accessibility-fail.html", "security-pass.html", "security-fail.html", "performance-pass.html", "performance-fail.html"]) {
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

console.log(`Deterministic review runner: ${profiles.length} profiles map every canonical checklist item and schemas are valid JSON.`);

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function findDuplicates(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}
