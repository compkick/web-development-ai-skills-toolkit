import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const runtimeSourceDirectory = path.resolve(scriptsDirectory, "..");
const auditScript = path.join(scriptsDirectory, "audit.mjs");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
  process.exit(0);
}

const options = parseArguments(process.argv.slice(2));
const profile = await loadProfile(options.profile);
const auditArguments = ["--url", options.url, "--output", options.outputDirectory];

if (options.browser !== "auto") auditArguments.push("--browser", options.browser);
if (options.timeoutMs !== 45000) auditArguments.push("--timeout-ms", String(options.timeoutMs));
if (options.allowNoSandbox) auditArguments.push("--allow-no-sandbox");
if (options.includeErrorDetails) auditArguments.push("--include-error-details");

const auditResult = spawnSync(process.execPath, [auditScript, ...auditArguments], { cwd: process.cwd(), env: process.env, stdio: "inherit" });

if (auditResult.error) {
  throw auditResult.error;
}

if (auditResult.status !== 0) {
  process.exit(auditResult.status ?? 1);
}

const summary = await readJson(path.join(options.outputDirectory, "summary.json"));
const axeResult = summary.axe.status === "completed" ? await readJson(path.join(options.outputDirectory, "axe-results.json")) : null;
const evidence = await buildEvidence(profile, summary, axeResult, options.outputDirectory);
const coverage = {
  schemaVersion: "1.0.0",
  profile: { id: profile.id, version: profile.version },
  checklistSource: profile.checklistSource,
  items: profile.coverage
};

await writeJson(path.join(options.outputDirectory, "evidence.json"), evidence);
await writeJson(path.join(options.outputDirectory, "coverage.json"), coverage);
console.log(`Deterministic ${profile.id} evidence package ready at ${options.outputDirectory}`);

async function buildEvidence(profileToUse, summary, axeResult, outputDirectory) {
  const checks = [];
  const httpStatus = summary.page.httpStatus;
  const normalizedTitle = summary.page.title?.trim() ?? "";
  const normalizedLanguage = summary.page.language?.trim() ?? "";

  checks.push({
    id: "page-http-status",
    title: "The target returned a successful HTTP response",
    status: typeof httpStatus !== "number" ? "warning" : httpStatus >= 200 && httpStatus < 400 ? "pass" : "fail",
    method: "browser",
    evidence: { finalUrl: summary.page.finalUrl, httpStatus },
    artifacts: ["summary.json"]
  });
  checks.push({
    id: "document-title",
    title: "The rendered document has a title",
    status: normalizedTitle.length > 0 ? "pass" : "fail",
    method: "browser",
    evidence: { title: normalizedTitle || null },
    artifacts: ["summary.json"]
  });
  checks.push({
    id: "document-language",
    title: "The rendered document declares a language",
    status: normalizedLanguage.length > 0 ? "pass" : "fail",
    method: "browser",
    evidence: { language: normalizedLanguage || null },
    artifacts: ["summary.json"]
  });
  checks.push({
    id: "document-structure",
    title: "Rendered heading and landmark inventory",
    status: "informational",
    method: "browser",
    evidence: summary.page.structure,
    artifacts: ["summary.json", "page.png"]
  });

  if (summary.axe.status === "completed" && axeResult) {
    checks.push({
      id: "automated-axe-scan",
      title: "The automated axe scan completed",
      status: axeResult.violations.length === 0 ? "pass" : "fail",
      method: "axe",
      evidence: { incomplete: axeResult.incomplete.length, passes: axeResult.passes, violations: axeResult.violations.length },
      artifacts: ["axe-results.json"]
    });

    for (const violation of axeResult.violations) {
      checks.push({
        id: `axe-${violation.id}`,
        title: violation.help,
        status: "fail",
        method: "axe",
        evidence: { affectedNodes: violation.nodes.length, description: violation.description, helpUrl: violation.helpUrl, impact: violation.impact, ruleId: violation.id, tags: violation.tags },
        artifacts: ["axe-results.json"]
      });
    }
  } else {
    checks.push({
      id: "automated-axe-scan",
      title: "The automated axe scan completed",
      status: "not-checked",
      method: "axe",
      evidence: { error: summary.axe.error ?? null, runtimeStatus: summary.axe.status },
      artifacts: ["summary.json"]
    });
  }

  checks.push({
    id: "lighthouse-accessibility",
    title: "Lighthouse accessibility evidence",
    status: summary.lighthouse.status === "completed" ? "informational" : "not-checked",
    method: "lighthouse",
    evidence: summary.lighthouse.status === "completed" ? { score: summary.lighthouse.scores.accessibility } : { error: summary.lighthouse.error ?? null, runtimeStatus: summary.lighthouse.status },
    artifacts: summary.lighthouse.status === "completed" ? ["lighthouse-report.json", "lighthouse-report.html"] : ["summary.json"]
  });

  const browserErrorCount = summary.page.browserErrors.consoleErrorCount + summary.page.browserErrors.pageErrorCount;
  checks.push({
    id: "browser-errors",
    title: "Browser console and page error counts",
    status: browserErrorCount === 0 ? "pass" : "warning",
    method: "browser",
    evidence: { consoleErrorCount: summary.page.browserErrors.consoleErrorCount, detailsIncluded: summary.page.browserErrors.detailsFile !== null, pageErrorCount: summary.page.browserErrors.pageErrorCount },
    artifacts: summary.page.browserErrors.detailsFile ? ["summary.json", summary.page.browserErrors.detailsFile] : ["summary.json"]
  });

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["axe-results.json", "Reduced axe rule evidence"],
    ["lighthouse-report.json", "Machine-readable Lighthouse report"],
    ["lighthouse-report.html", "Human-readable Lighthouse report"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = [];

  for (const [artifactPath, purpose] of artifactDefinitions) {
    if (await exists(path.join(outputDirectory, artifactPath))) {
      artifacts.push({ path: artifactPath, purpose });
    }
  }

  const limitations = [
    "This package covers one URL and does not prove whole-site or whole-application accessibility.",
    "Automated results do not replace keyboard, zoom, reflow, content-quality, workflow, or assistive-technology review.",
    "Lighthouse and axe overlap; their results must not be counted as independent proof of conformance.",
    "No screen reader was used by this deterministic runner."
  ];

  if (summary.axe.status !== "completed") limitations.push(`axe evidence was not completed: ${summary.axe.error ?? summary.axe.status}`);
  if (summary.lighthouse.status !== "completed") limitations.push(`Lighthouse evidence was not completed: ${summary.lighthouse.error ?? summary.lighthouse.status}`);

  return {
    schemaVersion: "1.0.0",
    profile: { id: profileToUse.id, standard: profileToUse.standard, version: profileToUse.version },
    target: { finalUrl: summary.page.finalUrl, requestedUrl: summary.requestedUrl },
    run: { browser: summary.browser, completedAt: summary.completedAt, startedAt: summary.startedAt },
    checks,
    artifacts,
    limitations
  };
}

function parseArguments(argumentsToParse) {
  const optionsToReturn = { allowNoSandbox: false, browser: "auto", includeErrorDetails: false, outputDirectory: null, profile: null, timeoutMs: 45000, url: null };

  for (let index = 0; index < argumentsToParse.length; index += 1) {
    const argument = argumentsToParse[index];

    if (["--browser", "--output", "--profile", "--timeout-ms", "--url"].includes(argument)) {
      const value = argumentsToParse[index + 1];

      if (!value) throw new Error(`Missing value for ${argument}.`);
      index += 1;
      if (argument === "--browser") optionsToReturn.browser = value;
      if (argument === "--output") optionsToReturn.outputDirectory = path.resolve(value);
      if (argument === "--profile") optionsToReturn.profile = value;
      if (argument === "--timeout-ms") optionsToReturn.timeoutMs = Number.parseInt(value, 10);
      if (argument === "--url") optionsToReturn.url = new URL(value).href;
      continue;
    }

    if (argument === "--allow-no-sandbox") optionsToReturn.allowNoSandbox = true;
    else if (argument === "--include-error-details") optionsToReturn.includeErrorDetails = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (!optionsToReturn.profile || !optionsToReturn.url) throw new Error("--profile and --url are required.");
  if (!new Set(["auto", "chrome", "edge", "chromium"]).has(optionsToReturn.browser)) throw new Error("--browser must be auto, chrome, edge, or chromium.");
  if (!Number.isInteger(optionsToReturn.timeoutMs) || optionsToReturn.timeoutMs < 1000 || optionsToReturn.timeoutMs > 120000) throw new Error("--timeout-ms must be an integer from 1000 through 120000.");

  if (!optionsToReturn.outputDirectory) {
    optionsToReturn.outputDirectory = getDefaultOutputDirectory(optionsToReturn.profile, new URL(optionsToReturn.url));
  }

  return optionsToReturn;
}

function getDefaultOutputDirectory(profileId, targetUrl) {
  const targetName = `${targetUrl.hostname}${targetUrl.port ? `-${targetUrl.port}` : ""}`.replace(/[^a-zA-Z0-9.-]+/g, "-").replace(/^-+|-+$/g, "") || "site";
  const isoTimestamp = new Date().toISOString();
  const runId = `${isoTimestamp.slice(0, 10).replaceAll("-", "")}-${isoTimestamp.slice(11, 19).replaceAll(":", "")}-${isoTimestamp.slice(20, 23)}Z`;
  return path.resolve(".output", profileId, targetName, runId);
}

async function loadProfile(profileId) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profileId)) throw new Error(`Invalid profile id: ${profileId}`);
  const profilePath = path.join(runtimeSourceDirectory, "profiles", `${profileId}.json`);

  try {
    return await readJson(profilePath);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`Unknown review profile: ${profileId}`);
    throw error;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function printUsage() {
  console.log("Usage: node runtime/scripts/review.mjs --profile <profile-id> --url <https://site.example> [options]");
  console.log("");
  console.log("Options:");
  console.log("  --output <directory>                    Override the default .output/<profile>/<host>/<run-id> directory");
  console.log("  --browser <auto|chrome|edge|chromium>  Browser selection; default: auto");
  console.log("  --allow-no-sandbox                       Allow an unsandboxed root run in an isolated environment");
  console.log("  --include-error-details                  Write truncated console/page error details");
  console.log("  --timeout-ms <milliseconds>             Navigation timeout; default: 45000");
}
