import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { DEFAULT_EVIDENCE_ROOT_DIRECTORY, getDefaultEvidenceOutputDirectory, runtimeSourceDirectory } from "../config/runtime-config.mjs";
import { writeSecurityHtmlReport } from "../reporting/security-report.mjs";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
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
if (profile.runtime?.collectSecurity) auditArguments.push("--collect-security");
if (profile.runtime?.skipAccessibility) auditArguments.push("--skip-accessibility");
if (profile.runtime?.skipLighthouse) auditArguments.push("--skip-lighthouse");

const auditResult = spawnSync(process.execPath, [auditScript, ...auditArguments], { cwd: process.cwd(), env: process.env, stdio: "inherit" });

if (auditResult.error) {
  throw auditResult.error;
}

if (auditResult.status !== 0) {
  process.exit(auditResult.status ?? 1);
}

const summary = await readJson(path.join(options.outputDirectory, "summary.json"));
const axeResult = summary.axe.status === "completed" ? await readJson(path.join(options.outputDirectory, "axe-results.json")) : null;
const securityResult = summary.security?.status === "completed" ? await readJson(path.join(options.outputDirectory, "security-results.json")) : null;
const evidence = profile.id === "review-web-security" ? await buildSecurityEvidence(profile, summary, securityResult, options.outputDirectory) : await buildAccessibilityEvidence(profile, summary, axeResult, options.outputDirectory);
const coverage = {
  schemaVersion: "1.0.0",
  profile: { id: profile.id, version: profile.version },
  checklistSource: profile.checklistSource,
  items: profile.coverage
};

if (profile.id === "review-web-security") {
  evidence.artifacts.push(
    { path: "evidence.json", purpose: "Normalized security check results" },
    { path: "coverage.json", purpose: "Canonical checklist automation map" },
    { path: "security-report.html", purpose: "Human-readable normalized security evidence and checklist coverage" }
  );
  await writeSecurityHtmlReport(evidence, coverage, path.join(options.outputDirectory, "security-report.html"));
}

await writeJson(path.join(options.outputDirectory, "evidence.json"), evidence);
await writeJson(path.join(options.outputDirectory, "coverage.json"), coverage);
console.log(`Deterministic ${profile.id} evidence package ready at ${options.outputDirectory}`);

async function buildAccessibilityEvidence(profileToUse, summary, axeResult, outputDirectory) {
  const checks = [];
  const axeArtifacts = ["axe-results.json"];

  if (await exists(path.join(outputDirectory, "axe-report.html"))) axeArtifacts.push("axe-report.html");

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
      artifacts: axeArtifacts
    });

    for (const violation of axeResult.violations) {
      checks.push({
        id: `axe-${violation.id}`,
        title: violation.help,
        status: "fail",
        method: "axe",
        evidence: { affectedNodes: violation.nodes.length, description: violation.description, helpUrl: violation.helpUrl, impact: violation.impact, ruleId: violation.id, tags: violation.tags },
        artifacts: axeArtifacts
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
    ["axe-report.html", "Human-readable axe report with bounded element screenshots"],
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

async function buildSecurityEvidence(profileToUse, summary, securityResult, outputDirectory) {
  const checks = [];
  const finalUrl = new URL(summary.page.finalUrl);
  const headers = securityResult?.headers ?? {};
  const addCheck = (id, title, status, method, evidence, artifacts = ["security-results.json"]) => checks.push({ id, title, status, method, evidence, artifacts });
  const httpStatus = summary.page.httpStatus;

  addCheck("page-http-status", "Site returns a successful HTTP response", typeof httpStatus !== "number" ? "warning" : httpStatus >= 200 && httpStatus < 400 ? "pass" : "fail", "browser", { finalUrl: summary.page.finalUrl, httpStatus }, ["summary.json"]);

  if (!securityResult) {
    addCheck("security-collection", "Runner completes public security evidence collection", "not-checked", "browser", { error: summary.security?.error ?? null, runtimeStatus: summary.security?.status ?? "missing" }, ["summary.json"]);
  } else {
    addCheck("security-collection", "Runner completes public security evidence collection", "pass", "browser", { runtimeStatus: "completed" });
  }

  const certificate = securityResult?.certificate ?? null;
  addCheck("https-transport", "Site uses HTTPS", finalUrl.protocol === "https:" ? "pass" : "fail", "browser", { certificateObserved: certificate !== null, finalProtocol: finalUrl.protocol });

  if (certificate) {
    const now = Date.now();
    const validFrom = certificate.validFrom ? Date.parse(certificate.validFrom) : null;
    const validTo = certificate.validTo ? Date.parse(certificate.validTo) : null;
    const certificateDatesKnown = validFrom !== null && validTo !== null;
    const certificateCurrent = certificateDatesKnown && validFrom <= now && validTo >= now;
    addCheck("certificate-validity", "Site presents a currently valid HTTPS certificate", !certificateDatesKnown ? "warning" : certificateCurrent ? "pass" : "fail", "browser", certificate);
    addCheck("tls-negotiation", "Site negotiates HTTP and TLS protocols", "informational", "browser", { applicationProtocol: securityResult?.navigationProtocol ?? null, tlsProtocol: certificate.protocol });
  } else {
    addCheck("certificate-validity", "Site presents a currently valid HTTPS certificate", "not-checked", "browser", { reason: finalUrl.protocol === "https:" ? "Certificate details were unavailable." : "The rendered page did not use HTTPS." });
    addCheck("tls-negotiation", "Site negotiates HTTP and TLS protocols", "not-checked", "browser", { applicationProtocol: securityResult?.navigationProtocol ?? null, reason: "No HTTPS certificate details were available." });
  }

  const redirect = securityResult?.httpRedirect;
  let redirectStatus = "not-checked";

  if (redirect?.attempted) {
    if (redirect.error?.toLowerCase().includes("loop") || redirect.error?.includes("More than 10")) redirectStatus = "fail";
    else if (redirect.error) redirectStatus = "warning";
    else redirectStatus = redirect.chain?.[0]?.status >= 300 && redirect.chain?.[0]?.status < 400 && redirect.finalProtocol === "https:" ? "pass" : "fail";
  }

  addCheck("http-to-https-redirect", "Site redirects plain HTTP to HTTPS", redirectStatus, "http", redirect ?? { attempted: false });

  const insecureResourceCounts = securityResult?.document?.insecureResourceCounts ?? {};
  const insecureReferenceCount = Object.values(insecureResourceCounts).reduce((total, count) => total + count, 0) + (securityResult?.document?.insecureFormActionCount ?? 0);
  const insecureRequestCount = finalUrl.protocol === "https:" ? securityResult?.requestProtocolCounts?.http ?? 0 : 0;
  addCheck("insecure-page-resources", "Site uses HTTPS for rendered resources and form actions", !securityResult || finalUrl.protocol !== "https:" ? "not-checked" : insecureReferenceCount + insecureRequestCount === 0 ? "pass" : "fail", "browser", { insecureFormActionCount: securityResult?.document?.insecureFormActionCount ?? null, insecureRequestCount, insecureResourceCounts });

  const hsts = headers["strict-transport-security"] ?? null;
  const hstsMaxAge = hsts?.match(/(?:^|;)\s*max-age=(\d+)/i)?.[1] ?? null;
  addCheck("strict-transport-security", "Site presents an active HSTS policy", !securityResult || finalUrl.protocol !== "https:" ? "not-checked" : hstsMaxAge && Number(hstsMaxAge) > 0 ? "pass" : "warning", "browser", { header: hsts, maxAge: hstsMaxAge === null ? null : Number(hstsMaxAge) });

  const csp = headers["content-security-policy"] ?? null;
  const cspConcerns = [];

  if (csp?.includes("'unsafe-eval'")) cspConcerns.push("unsafe-eval");
  if (csp?.includes("'unsafe-inline'") && !/nonce-|sha(256|384|512)-|'strict-dynamic'/.test(csp)) cspConcerns.push("unsafe-inline without a nonce, hash, or strict-dynamic");
  addCheck("content-security-policy", "Site includes an enforced Content Security Policy", !securityResult ? "not-checked" : csp ? cspConcerns.length === 0 ? "pass" : "warning" : "warning", "browser", { concerns: cspConcerns, enforcedPolicy: csp, reportOnlyPolicy: headers["content-security-policy-report-only"] ?? null });

  const frameAncestors = csp?.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i)?.[1]?.trim() ?? null;
  const xFrameOptions = headers["x-frame-options"] ?? null;
  const framingRestricted = frameAncestors !== null && frameAncestors !== "*" || /^(DENY|SAMEORIGIN)$/i.test(xFrameOptions ?? "");
  addCheck("framing-protection", "Site restricts framing", !securityResult ? "not-checked" : framingRestricted ? "pass" : "warning", "browser", { frameAncestors, xFrameOptions });

  const contentTypeOptions = headers["x-content-type-options"] ?? null;
  addCheck("content-type-protection", "Site prevents content-type sniffing", !securityResult ? "not-checked" : contentTypeOptions?.toLowerCase() === "nosniff" ? "pass" : "warning", "browser", { xContentTypeOptions: contentTypeOptions });

  const referrerPolicy = headers["referrer-policy"] ?? null;
  addCheck("referrer-policy", "Site sends an explicit Referrer-Policy header", !securityResult ? "not-checked" : referrerPolicy === null ? "informational" : referrerPolicy.toLowerCase().includes("unsafe-url") ? "warning" : "pass", "browser", { referrerPolicy });

  const issuedCookies = securityResult?.cookies?.issued ?? [];
  const cookieConcerns = issuedCookies.flatMap((cookie) => {
    const concerns = [];

    if (finalUrl.protocol === "https:" && !cookie.secure) concerns.push(`${cookie.name}: missing Secure`);
    if (cookie.sameSite?.toLowerCase() === "none" && !cookie.secure) concerns.push(`${cookie.name}: SameSite=None without Secure`);
    return concerns;
  });
  addCheck("public-cookie-flags", "Site protects public cookies with appropriate attributes", !securityResult ? "not-checked" : cookieConcerns.length > 0 ? "warning" : issuedCookies.length > 0 ? "pass" : "informational", "browser", { accepted: securityResult?.cookies?.accepted ?? [], concerns: cookieConcerns, issued: issuedCookies });

  const cors = securityResult?.cors ?? {};
  const corsInvalid = cors["access-control-allow-origin"] === "*" && cors["access-control-allow-credentials"]?.toLowerCase() === "true";
  addCheck("cors-policy", "Site avoids unsafe wildcard CORS with credentials", !securityResult ? "not-checked" : corsInvalid ? "warning" : "informational", "browser", { headers: cors, invalidWildcardWithCredentials: corsInvalid });

  const disclosureHeaders = Object.fromEntries(["server", "x-powered-by", "x-aspnet-version", "x-xss-protection"].filter((name) => headers[name] !== undefined).map((name) => [name, headers[name]]));
  const disclosureConcerns = [];

  if (headers["x-powered-by"]) disclosureConcerns.push("x-powered-by is exposed");
  if (headers["x-aspnet-version"]) disclosureConcerns.push("x-aspnet-version is exposed");
  if (/\d/.test(headers.server ?? "")) disclosureConcerns.push("server appears to expose a version");
  if (headers["x-xss-protection"] && headers["x-xss-protection"] !== "0") disclosureConcerns.push("deprecated x-xss-protection is enabled");
  addCheck("response-disclosure", "Site avoids disclosing unnecessary server details", !securityResult ? "not-checked" : disclosureConcerns.length > 0 ? "warning" : "pass", "browser", { concerns: disclosureConcerns, headers: disclosureHeaders });

  const securityTxt = securityResult?.securityTxt ?? null;
  addCheck("security-txt", "Site publishes a valid security.txt file", !securityResult ? "not-checked" : securityTxt?.valid ? "pass" : securityTxt?.found ? "warning" : "informational", "http", securityTxt ?? { found: false });

  const browserErrorCount = summary.page.browserErrors.consoleErrorCount + summary.page.browserErrors.pageErrorCount;
  addCheck("browser-errors", "Site loads without browser console or page errors", browserErrorCount === 0 ? "pass" : "warning", "browser", { consoleErrorCount: summary.page.browserErrors.consoleErrorCount, detailsIncluded: summary.page.browserErrors.detailsFile !== null, pageErrorCount: summary.page.browserErrors.pageErrorCount }, summary.page.browserErrors.detailsFile ? ["summary.json", summary.page.browserErrors.detailsFile] : ["summary.json"]);

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["security-results.json", "Reduced public transport, header, cookie, and disclosure evidence"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = [];

  for (const [artifactPath, purpose] of artifactDefinitions) {
    if (await exists(path.join(outputDirectory, artifactPath))) artifacts.push({ path: artifactPath, purpose });
  }

  return {
    schemaVersion: "1.0.0",
    profile: { id: profileToUse.id, standard: profileToUse.standard, version: profileToUse.version },
    target: { finalUrl: summary.page.finalUrl, requestedUrl: summary.requestedUrl },
    run: { browser: summary.browser, completedAt: summary.completedAt, startedAt: summary.startedAt },
    checks,
    artifacts,
    limitations: [
      "This package covers one public URL and does not prove whole-site or whole-application security.",
      "No injection payloads, authentication attempts, endpoint enumeration, port scans, form submissions, or vulnerability exploitation were performed.",
      "The runner records the negotiated TLS protocol but does not prove that every deprecated protocol or cipher is disabled.",
      "Headers, cookies, and browser observations require application context and do not prove that source code, authorization, authenticated workflows, or operational controls are secure.",
      "The HTTP redirect and security.txt probes are limited to the authorized hostname or origin."
    ]
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
    optionsToReturn.outputDirectory = getDefaultEvidenceOutputDirectory(optionsToReturn.profile, new URL(optionsToReturn.url));
  }

  return optionsToReturn;
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
  console.log(`  --output <directory>                    Override the default ${DEFAULT_EVIDENCE_ROOT_DIRECTORY}/<profile>/<host>/<run-id> directory`);
  console.log("  --browser <auto|chrome|edge|chromium>  Browser selection; default: auto");
  console.log("  --allow-no-sandbox                       Allow an unsandboxed root run in an isolated environment");
  console.log("  --include-error-details                  Write truncated console/page error details");
  console.log("  --timeout-ms <milliseconds>             Navigation timeout; default: 45000");
}
