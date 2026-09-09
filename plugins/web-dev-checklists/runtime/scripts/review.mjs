import { buildFailureEvidence } from "../evidence/run-failure.mjs";
import { buildCoverage, prepareOutputDirectory, readJson, writeJson } from "../evidence/package.mjs";
import { loadProfile } from "../config/review-profiles.mjs";
import { buildAccessibilityEvidence } from "../evaluators/accessibility.mjs";
import { buildPerformanceEvidence } from "../evaluators/performance.mjs";
import { buildTechnicalSeoEvidence } from "../evaluators/technical-seo.mjs";
import { buildLaunchEvidence } from "../evaluators/launch.mjs";
import { buildSecurityEvidence } from "../evaluators/security.mjs";
import { buildWebProjectAuditEvidence } from "../evaluators/web-project-audit.mjs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { DEFAULT_EVIDENCE_ROOT_DIRECTORY, getDefaultEvidenceOutputDirectory } from "../config/runtime-config.mjs";
import { writeLaunchHtmlReport } from "../reporting/launch-report.mjs";
import { writePerformanceHtmlReport } from "../reporting/performance-report.mjs";
import { writeSecurityHtmlReport } from "../reporting/security-report.mjs";
import { writeTechnicalSeoHtmlReport } from "../reporting/technical-seo-report.mjs";
import { writeWebProjectAuditHtmlReport } from "../reporting/web-project-audit-report.mjs";

const REPORTS = {
  "audit-web-project": { file: "web-project-audit-report.html", write: writeWebProjectAuditHtmlReport, artifacts: [
    { path: "evidence.json", purpose: "Normalized high-level public audit results" },
    { path: "coverage.json", purpose: "Canonical web project audit checklist automation map" },
    { path: "web-project-audit-report.html", purpose: "Human-readable cross-discipline public audit evidence" }
  ] },
  "review-web-security": { file: "security-report.html", write: writeSecurityHtmlReport, artifacts: [
    { path: "evidence.json", purpose: "Normalized security check results" },
    { path: "coverage.json", purpose: "Canonical checklist automation map" },
    { path: "security-report.html", purpose: "Human-readable normalized security evidence and checklist coverage" }
  ] },
  "review-website-launch": { file: "launch-readiness-report.html", write: writeLaunchHtmlReport, artifacts: [
    { path: "evidence.json", purpose: "Normalized launch preflight results" },
    { path: "coverage.json", purpose: "Canonical launch checklist automation map" },
    { path: "launch-readiness-report.html", purpose: "Human-readable homepage preflight and launch checklist coverage" }
  ] },
  "review-web-performance": { file: "performance-report.html", write: writePerformanceHtmlReport, artifacts: [
    { path: "evidence.json", purpose: "Normalized performance check results" },
    { path: "coverage.json", purpose: "Canonical checklist automation map" },
    { path: "performance-report.html", purpose: "Human-readable normalized performance evidence and checklist coverage" }
  ] },
  "review-technical-seo": { file: "technical-seo-report.html", write: writeTechnicalSeoHtmlReport, artifacts: [
    { path: "evidence.json", purpose: "Normalized technical SEO check results" },
    { path: "coverage.json", purpose: "Canonical checklist automation map" },
    { path: "technical-seo-report.html", purpose: "Human-readable normalized technical SEO evidence and checklist coverage" }
  ] }
};

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const auditScript = path.join(scriptsDirectory, "audit.mjs");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
  process.exit(0);
}

const options = parseArguments(process.argv.slice(2));
const profile = await loadProfile(options.profile);
await prepareOutputDirectory(options.outputDirectory);
const auditArguments = ["--url", options.url, "--output", options.outputDirectory];

if (options.browser !== "auto") auditArguments.push("--browser", options.browser);
if (options.timeoutMs !== 45000) auditArguments.push("--timeout-ms", String(options.timeoutMs));
if (options.allowNoSandbox) auditArguments.push("--allow-no-sandbox");
if (options.includeErrorDetails) auditArguments.push("--include-error-details");
if (profile.runtime?.collectLaunch) auditArguments.push("--collect-launch");
if (profile.runtime?.collectSecurity) auditArguments.push("--collect-security");
if (profile.runtime?.collectSeo) auditArguments.push("--collect-seo");
if (profile.runtime?.skipAccessibility) auditArguments.push("--skip-accessibility");
if (profile.runtime?.skipLighthouse) auditArguments.push("--skip-lighthouse");

const auditResult = spawnSync(process.execPath, [auditScript, ...auditArguments], { cwd: process.cwd(), env: process.env, stdio: "inherit" });

if (auditResult.error) {
  throw auditResult.error;
}

const summary = await readJson(path.join(options.outputDirectory, "summary.json"));
const axeResult = summary.axe.status === "completed" ? await readJson(path.join(options.outputDirectory, "axe-results.json")) : null;
const lighthouseResult = summary.lighthouse.status === "completed" ? await readJson(path.join(options.outputDirectory, "lighthouse-report.json")) : null;
const securityResult = summary.security?.status === "completed" ? await readJson(path.join(options.outputDirectory, "security-results.json")) : null;
const seoResult = summary.seo?.status === "completed" ? await readJson(path.join(options.outputDirectory, "seo-results.json")) : null;
const launchResult = summary.launch?.status === "completed" ? await readJson(path.join(options.outputDirectory, "launch-results.json")) : null;
let evidence;
let auditComponents = null;

if (summary.runFailure) evidence = await buildFailureEvidence(profile, summary, options.outputDirectory);
else if (profile.id === "review-web-accessibility") evidence = await buildAccessibilityEvidence(profile, summary, axeResult, options.outputDirectory);
else if (profile.id === "audit-web-project") {
  auditComponents = await buildWebProjectAuditComponents(summary, axeResult, lighthouseResult, securityResult, seoResult, launchResult, options.outputDirectory);
  evidence = await buildWebProjectAuditEvidence(profile, summary, auditComponents, options.outputDirectory);
}
else if (profile.id === "review-website-launch") evidence = await buildLaunchEvidence(profile, summary, launchResult, options.outputDirectory);
else if (profile.id === "review-web-performance") evidence = await buildPerformanceEvidence(profile, summary, lighthouseResult, options.outputDirectory);
else if (profile.id === "review-web-security") evidence = await buildSecurityEvidence(profile, summary, securityResult, options.outputDirectory);
else if (profile.id === "review-technical-seo") evidence = await buildTechnicalSeoEvidence(profile, summary, lighthouseResult, seoResult, options.outputDirectory);
else throw new Error(`The review profile does not have an evidence builder: ${profile.id}`);

if (summary.page.screenshotReadiness?.status === "incomplete") {
  const readiness = summary.page.screenshotReadiness;
  evidence.limitations.push(`Screenshot preparation was incomplete: ${readiness.images.pending} pending, ${readiness.images.failed} failed, and ${readiness.images.missingSource} missing-source images; load state ${readiness.loadState}; time limit reached: ${readiness.timedOut}; scroll limit reached: ${readiness.scroll.limitReached}. See summary.json page.screenshotReadiness. This is a capture limitation, not a whole-site result.`);
}

const coverage = buildCoverage(profile);
await writeProfileReport(profile, evidence, options.outputDirectory, true);

await writeJson(path.join(options.outputDirectory, "evidence.json"), evidence);
await writeJson(path.join(options.outputDirectory, "coverage.json"), coverage);
console.log(`Deterministic ${profile.id} evidence package ${summary.runFailure ? "incomplete" : "ready"} at ${options.outputDirectory}`);
process.exitCode = auditResult.status ?? 1;

async function buildWebProjectAuditComponents(summary, axeResult, lighthouseResult, securityResult, seoResult, launchResult, outputDirectory) {
  const [accessibilityProfile, securityProfile, performanceProfile, seoProfile, launchProfile] = await Promise.all([
    loadProfile("review-web-accessibility"),
    loadProfile("review-web-security"),
    loadProfile("review-web-performance"),
    loadProfile("review-technical-seo"),
    loadProfile("review-website-launch")
  ]);
  const accessibility = await buildAccessibilityEvidence(accessibilityProfile, summary, axeResult, outputDirectory);
  const security = await buildSecurityEvidence(securityProfile, summary, securityResult, outputDirectory);
  const performance = await buildPerformanceEvidence(performanceProfile, summary, lighthouseResult, outputDirectory);
  const seo = await buildTechnicalSeoEvidence(seoProfile, summary, lighthouseResult, seoResult, outputDirectory);
  const launch = await buildLaunchEvidence(launchProfile, summary, launchResult, outputDirectory);

  await Promise.all([
    [securityProfile, security], [performanceProfile, performance], [seoProfile, seo], [launchProfile, launch]
  ].map(([componentProfile, componentEvidence]) => writeProfileReport(componentProfile, componentEvidence, outputDirectory)));

  return { accessibility, launch, performance, security, seo };
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

  if (optionsToReturn.url && !["http:", "https:"].includes(new URL(optionsToReturn.url).protocol)) throw new Error("Only http and https URLs are supported.");
  if (!optionsToReturn.profile || !optionsToReturn.url) throw new Error("--profile and --url are required.");
  if (!new Set(["auto", "chrome", "edge", "chromium"]).has(optionsToReturn.browser)) throw new Error("--browser must be auto, chrome, edge, or chromium.");
  if (!Number.isInteger(optionsToReturn.timeoutMs) || optionsToReturn.timeoutMs < 1000 || optionsToReturn.timeoutMs > 120000) throw new Error("--timeout-ms must be an integer from 1000 through 120000.");

  // Keep old CLI commands working, but use one canonical profile and output group.
  if (optionsToReturn.profile === "prepare-website-launch") optionsToReturn.profile = "review-website-launch";

  if (!optionsToReturn.outputDirectory) {
    optionsToReturn.outputDirectory = getDefaultEvidenceOutputDirectory(optionsToReturn.profile, new URL(optionsToReturn.url));
  }

  return optionsToReturn;
}

function printUsage() {
  console.log("Usage: node runtime/scripts/review.mjs --profile <profile-id> --url <https://site.example> [options]");
  console.log("Launch profile: review-website-launch (legacy alias: prepare-website-launch)");
  console.log("");
  console.log("Options:");
  console.log(`  --output <directory>                    Override the default ${DEFAULT_EVIDENCE_ROOT_DIRECTORY}/<profile>/<host>/<run-id> directory`);
  console.log("  --browser <auto|chrome|edge|chromium>  Browser selection; default: auto");
  console.log("  --allow-no-sandbox                       Allow an unsandboxed root run in an isolated environment");
  console.log("  --include-error-details                  Write truncated console/page error details");
  console.log("  --timeout-ms <milliseconds>             Navigation timeout; default: 45000");
}

async function writeProfileReport(profile, evidence, outputDirectory, includePackageArtifacts = false) {
  const report = REPORTS[profile.id];
  if (!report) return;
  if (includePackageArtifacts) evidence.artifacts.push(...report.artifacts);
  await report.write(evidence, buildCoverage(profile), path.join(outputDirectory, report.file));
}
