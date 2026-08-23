import AxeBuilder from "@axe-core/playwright";
import { launch as launchChrome } from "chrome-launcher";
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import lighthouse from "lighthouse";
import { chromium } from "playwright";
import { DEFAULT_AXE_ELEMENT_SCREENSHOT_LIMIT } from "../config/runtime-config.mjs";
import { captureAxeElementScreenshots, writeAxeHtmlReport } from "../reporting/axe-report.mjs";

const options = parseArguments(process.argv.slice(2));
const startedAt = new Date().toISOString();

if (isRoot() && !options.allowNoSandbox) {
  throw new Error("Refusing to audit as root because Chromium sandboxing is unavailable. Run as a non-root user, or use --allow-no-sandbox only with explicit approval inside an isolated disposable environment.");
}

await prepareOutputDirectory(options.outputDirectory);

let browser;
let selectedBrowser;
let pageResult;
let axeSummary = { status: options.skipAccessibility ? "skipped" : "not-run" };
let lighthouseSummary = { status: options.skipLighthouse ? "skipped" : "not-run" };
let securitySummary = { status: options.collectSecurity ? "not-run" : "skipped" };

try {
  ({ browser, selectedBrowser } = await launchBrowser(options.browser, options.allowNoSandbox));
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requestProtocolCounts = { http: 0, https: 0, other: 0 };
  let consoleErrorCount = 0;
  let pageErrorCount = 0;

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrorCount += 1;

      if (options.includeErrorDetails && consoleErrors.length < 20) {
        consoleErrors.push(truncate(message.text(), 500));
      }
    }
  });
  page.on("pageerror", (error) => {
    pageErrorCount += 1;

    if (options.includeErrorDetails && pageErrors.length < 20) {
      pageErrors.push(truncate(error.message, 500));
    }
  });
  page.on("request", (request) => {
    const protocol = new URL(request.url()).protocol;

    if (protocol === "http:") requestProtocolCounts.http += 1;
    else if (protocol === "https:") requestProtocolCounts.https += 1;
    else requestProtocolCounts.other += 1;
  });

  const response = await page.goto(options.url, { timeout: options.timeoutMs, waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ fullPage: true, path: path.join(options.outputDirectory, "page.png") });
  const documentDetails = await page.evaluate(() => ({
    language: document.documentElement.lang.trim() || null,
    structure: {
      h1Count: document.querySelectorAll("h1").length,
      headingCount: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
      landmarkCount: document.querySelectorAll("header, nav, main, aside, footer, [role='banner'], [role='navigation'], [role='main'], [role='complementary'], [role='contentinfo'], [role='search'], [role='region'], [role='form']").length,
      mainCount: document.querySelectorAll("main, [role='main']").length
    }
  }));

  pageResult = {
    browserErrors: {
      consoleErrorCount,
      detailsFile: options.includeErrorDetails ? "browser-errors.json" : null,
      pageErrorCount
    },
    finalUrl: page.url(),
    httpStatus: response?.status() ?? null,
    language: documentDetails.language,
    structure: documentDetails.structure,
    title: await page.title()
  };

  if (options.includeErrorDetails) {
    await writeJson(path.join(options.outputDirectory, "browser-errors.json"), { consoleErrors, pageErrors });
  }

  if (options.collectSecurity) {
    try {
      const securityResult = await collectSecurityEvidence({ context, page, requestProtocolCounts, requestedUrl: options.url, response, timeoutMs: options.timeoutMs });
      await writeJson(path.join(options.outputDirectory, "security-results.json"), securityResult);
      securitySummary = { status: "completed" };
    } catch (error) {
      securitySummary = { error: truncate(error.message, 500), status: "error" };
    }
  }

  if (!options.skipAccessibility) {
    try {
      const rawAxeResult = await new AxeBuilder({ page }).analyze();
      const axeResult = summarizeAxe(rawAxeResult);
      let elementScreenshots;

      try {
        elementScreenshots = await captureAxeElementScreenshots(page, axeResult, options.outputDirectory, DEFAULT_AXE_ELEMENT_SCREENSHOT_LIMIT);
      } catch (error) {
        elementScreenshots = { captured: 0, error: truncate(error.message, 300), failed: 0, limit: DEFAULT_AXE_ELEMENT_SCREENSHOT_LIMIT, skippedByLimit: 0, totalCandidates: 0, unsupported: 0 };
      }

      axeResult.elementScreenshots = elementScreenshots;
      await writeJson(path.join(options.outputDirectory, "axe-results.json"), axeResult);
      let report = { status: "completed" };

      try {
        await writeAxeHtmlReport(axeResult, path.join(options.outputDirectory, "axe-report.html"));
      } catch (error) {
        report = { error: truncate(error.message, 300), status: "error" };
      }

      axeSummary = { elementScreenshots, incomplete: axeResult.incomplete.length, passes: axeResult.passes, report, status: "completed", violations: axeResult.violations.length };
    } catch (error) {
      axeSummary = { error: truncate(error.message, 500), status: "error" };
    }
  }

  await context.close();
} finally {
  await browser?.close();
}

if (!options.skipLighthouse) {
  try {
    const lighthouseResult = await runLighthouse(options.url, selectedBrowser.executablePath, options.outputDirectory, options.allowNoSandbox);
    lighthouseSummary = { finalUrl: lighthouseResult.finalUrl, scores: lighthouseResult.scores, status: "completed" };
  } catch (error) {
    lighthouseSummary = { error: truncate(error.message, 500), status: "error" };
  }
}

const summary = {
  axe: axeSummary,
  browser: { name: selectedBrowser.name, sandboxed: !options.allowNoSandbox },
  completedAt: new Date().toISOString(),
  lighthouse: lighthouseSummary,
  page: pageResult,
  requestedUrl: options.url,
  security: securitySummary,
  startedAt
};

await writeJson(path.join(options.outputDirectory, "summary.json"), summary);
console.log(JSON.stringify(summary, null, 2));

async function launchBrowser(requestedBrowser, allowNoSandbox) {
  const candidates = getBrowserCandidates().filter((candidate) => requestedBrowser === "auto" || candidate.kind === requestedBrowser);
  const failures = [];

  for (const candidate of candidates) {
    if (!existsSync(candidate.executablePath)) {
      continue;
    }

    try {
      const launchedBrowser = await chromium.launch({ chromiumSandbox: !allowNoSandbox, executablePath: candidate.executablePath, headless: true });
      return { browser: launchedBrowser, selectedBrowser: candidate };
    } catch (error) {
      failures.push(`${candidate.name}: ${truncate(error.message, 240)}`);
    }
  }

  const failureDetail = failures.length > 0 ? ` Launch failures: ${failures.join(" | ")}` : "";
  throw new Error(`No supported browser could be launched. Bootstrap Playwright Chromium or install Chrome or Edge.${failureDetail}`);
}

function getBrowserCandidates() {
  const candidates = [{ executablePath: chromium.executablePath(), kind: "chromium", name: "Playwright Chromium" }];

  if (process.env.CHROME_PATH) {
    candidates.push({ executablePath: process.env.CHROME_PATH, kind: "chrome", name: "Chrome from CHROME_PATH" });
  }

  if (process.platform === "win32") {
    const programFiles = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(Boolean);

    for (const basePath of programFiles) {
      candidates.push({ executablePath: path.join(basePath, "Google", "Chrome", "Application", "chrome.exe"), kind: "chrome", name: "Google Chrome" });
      candidates.push({ executablePath: path.join(basePath, "Microsoft", "Edge", "Application", "msedge.exe"), kind: "edge", name: "Microsoft Edge" });
    }
  } else if (process.platform === "darwin") {
    candidates.push({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", kind: "chrome", name: "Google Chrome" });
    candidates.push({ executablePath: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", kind: "edge", name: "Microsoft Edge" });
  } else {
    for (const executablePath of ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"]) {
      candidates.push({ executablePath, kind: executablePath.includes("google-chrome") ? "chrome" : "chromium", name: path.basename(executablePath) });
    }

    candidates.push({ executablePath: "/usr/bin/microsoft-edge", kind: "edge", name: "Microsoft Edge" });
  }

  return candidates.filter((candidate, index) => candidates.findIndex((other) => other.executablePath === candidate.executablePath) === index);
}

async function runLighthouse(url, chromePath, outputDirectory, allowNoSandbox) {
  const chromeFlags = ["--headless=new", "--disable-dev-shm-usage", "--no-first-run"];

  if (allowNoSandbox) {
    chromeFlags.push("--no-sandbox");
  }

  const chrome = await launchChrome({ chromeFlags, chromePath });

  try {
    const result = await lighthouse(url, {
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      output: ["json", "html"],
      port: chrome.port
    });
    const [jsonReport, htmlReport] = Array.isArray(result.report) ? result.report : [result.report];

    if (jsonReport) {
      await writeFile(path.join(outputDirectory, "lighthouse-report.json"), jsonReport, "utf8");
    }

    if (htmlReport) {
      await writeFile(path.join(outputDirectory, "lighthouse-report.html"), htmlReport, "utf8");
    }

    return {
      finalUrl: result.lhr.finalDisplayedUrl,
      scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([key, category]) => [key, Math.round((category.score ?? 0) * 100)]))
    };
  } finally {
    await stopChrome(chrome);
  }
}

async function stopChrome(chrome) {
  try {
    await chrome.kill();
  } catch (error) {
    if (process.platform !== "win32" || error?.code !== "EPERM" || !error?.path) {
      throw error;
    }

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 200));

      try {
        await rm(error.path, { force: true, maxRetries: 3, recursive: true, retryDelay: 100 });
        return;
      } catch (cleanupError) {
        if (attempt === 5) {
          console.warn(`Chrome exited, but its temporary Lighthouse profile could not be removed: ${cleanupError.message}`);
        }
      }
    }
  }
}

async function collectSecurityEvidence({ context, page, requestProtocolCounts, requestedUrl, response, timeoutMs }) {
  const finalUrl = new URL(page.url());
  const responseHeaders = response ? await response.allHeaders() : {};
  const responseHeaderEntries = response ? await response.headersArray() : [];
  const securityDetails = response ? await response.securityDetails() : null;
  const navigationProtocol = await page.evaluate(() => performance.getEntriesByType("navigation")[0]?.nextHopProtocol || null);
  const documentSecurity = await page.evaluate(() => {
    const insecureResourceCounts = {};
    const resourceSelectors = [
      ["audio", "src"],
      ["embed", "src"],
      ["iframe", "src"],
      ["img", "src"],
      ["link[rel~='stylesheet']", "href"],
      ["link[rel~='preload']", "href"],
      ["link[rel~='modulepreload']", "href"],
      ["link[rel~='icon']", "href"],
      ["object", "data"],
      ["script", "src"],
      ["source", "src"],
      ["video", "src"]
    ];

    for (const [selector, attribute] of resourceSelectors) {
      for (const element of document.querySelectorAll(`${selector}[${attribute}]`)) {
        try {
          if (new URL(element.getAttribute(attribute), document.baseURI).protocol === "http:") insecureResourceCounts[selector] = (insecureResourceCounts[selector] ?? 0) + 1;
        } catch {
          // Invalid URLs are outside this transport-only observation.
        }
      }
    }

    let insecureFormActionCount = 0;

    for (const form of document.forms) {
      try {
        if (new URL(form.getAttribute("action") || document.URL, document.baseURI).protocol === "http:") insecureFormActionCount += 1;
      } catch {
        // Invalid form actions are outside this transport-only observation.
      }
    }

    return {
      formCount: document.forms.length,
      insecureFormActionCount,
      insecureResourceCounts,
      passwordFieldCount: document.querySelectorAll("input[type='password']").length
    };
  });
  const contextCookies = (await context.cookies(page.url())).map((cookie) => ({
    domain: cookie.domain,
    expires: cookie.expires,
    httpOnly: cookie.httpOnly,
    name: cookie.name,
    path: cookie.path,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    session: cookie.expires === -1
  }));

  return {
    certificate: securityDetails ? {
      issuer: securityDetails.issuer ?? null,
      protocol: securityDetails.protocol ?? null,
      subjectName: securityDetails.subjectName ?? null,
      validFrom: toIsoDate(securityDetails.validFrom),
      validTo: toIsoDate(securityDetails.validTo)
    } : null,
    cookies: {
      accepted: contextCookies,
      issued: responseHeaderEntries.filter((header) => header.name.toLowerCase() === "set-cookie").map((header) => summarizeSetCookie(header.value))
    },
    cors: pickHeaders(responseHeaders, ["access-control-allow-credentials", "access-control-allow-headers", "access-control-allow-methods", "access-control-allow-origin"]),
    document: documentSecurity,
    finalUrl: finalUrl.href,
    headers: pickHeaders(responseHeaders, ["cache-control", "content-security-policy", "content-security-policy-report-only", "content-type", "permissions-policy", "referrer-policy", "server", "strict-transport-security", "x-aspnet-version", "x-content-type-options", "x-frame-options", "x-powered-by", "x-xss-protection"]),
    httpRedirect: await probeHttpRedirect(requestedUrl, timeoutMs),
    navigationProtocol,
    requestProtocolCounts,
    securityTxt: await probeSecurityTxt(finalUrl, timeoutMs)
  };
}

async function probeHttpRedirect(requestedUrl, timeoutMs) {
  const targetUrl = new URL(requestedUrl);

  if (targetUrl.protocol !== "https:") return { attempted: false, reason: "The supplied URL is not HTTPS." };

  const initialHttpUrl = new URL(targetUrl);
  initialHttpUrl.protocol = "http:";
  const seen = new Set();
  const chain = [];
  let currentUrl = initialHttpUrl;

  try {
    for (let redirectCount = 0; redirectCount <= 10; redirectCount += 1) {
      const currentKey = currentUrl.href;

      if (seen.has(currentKey)) return { attempted: true, chain, error: "Redirect loop detected." };
      seen.add(currentKey);

      const response = await fetch(currentUrl, { headers: { "user-agent": "Website-Readiness-Toolkit/0.1" }, redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
      await response.body?.cancel();
      const location = response.headers.get("location");
      const entry = { host: currentUrl.host, protocol: currentUrl.protocol, status: response.status };

      if (location) {
        const nextUrl = new URL(location, currentUrl);
        entry.locationHost = nextUrl.host;
        entry.locationProtocol = nextUrl.protocol;
        chain.push(entry);

        if (nextUrl.hostname !== targetUrl.hostname) return { attempted: true, chain, error: "Redirect left the authorized hostname." };
        currentUrl = nextUrl;
        continue;
      }

      chain.push(entry);
      return { attempted: true, chain, finalHost: currentUrl.host, finalProtocol: currentUrl.protocol, finalStatus: response.status };
    }

    return { attempted: true, chain, error: "More than 10 redirects were returned." };
  } catch (error) {
    return { attempted: true, chain, error: truncate(error.message, 300) };
  }
}

async function probeSecurityTxt(finalUrl, timeoutMs) {
  if (finalUrl.protocol !== "https:") {
    return { found: false, reason: "security.txt is defined for an HTTPS origin.", transportSecure: false };
  }

  const securityTxtUrl = new URL("/.well-known/security.txt", finalUrl.origin);

  try {
    const result = await fetchLimitedText(securityTxtUrl, timeoutMs, 131072);

    if (result.status !== 200) return { contentType: result.contentType, finalHost: result.finalUrl.host, finalStatus: result.status, found: false, transportSecure: true };

    const fields = result.text.split(/\r?\n/).map((line) => line.match(/^([A-Za-z][A-Za-z0-9-]*):\s*(.+)$/)).filter(Boolean).map((match) => ({ name: match[1].toLowerCase(), value: match[2].trim() }));
    const contactCount = fields.filter((field) => field.name === "contact").length;
    const expiresField = fields.find((field) => field.name === "expires")?.value ?? null;
    const expiresAt = expiresField && !Number.isNaN(Date.parse(expiresField)) ? new Date(expiresField).toISOString() : null;
    const contentTypeValid = result.contentType.toLowerCase().startsWith("text/plain");
    const current = expiresAt !== null && new Date(expiresAt).getTime() > Date.now();

    return { contactCount, contentType: result.contentType, contentTypeValid, current, expiresAt, finalHost: result.finalUrl.host, finalStatus: result.status, found: true, transportSecure: true, valid: contactCount > 0 && contentTypeValid && current };
  } catch (error) {
    return { error: truncate(error.message, 300), found: false, transportSecure: true };
  }
}

async function fetchLimitedText(initialUrl, timeoutMs, maximumBytes) {
  let currentUrl = new URL(initialUrl);

  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    const response = await fetch(currentUrl, { headers: { accept: "text/plain", "user-agent": "Website-Readiness-Toolkit/0.1" }, redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
    const location = response.headers.get("location");

    if (location && response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      const nextUrl = new URL(location, currentUrl);

      if (nextUrl.origin !== initialUrl.origin) throw new Error("security.txt redirected outside the authorized origin.");
      currentUrl = nextUrl;
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const contentLength = Number.parseInt(response.headers.get("content-length") ?? "0", 10);

    if (contentLength > maximumBytes) {
      await response.body?.cancel();
      throw new Error(`security.txt exceeds ${maximumBytes} bytes.`);
    }

    if (!response.body) return { contentType, finalUrl: currentUrl, status: response.status, text: "" };

    const reader = response.body.getReader();
    const chunks = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;
      totalBytes += value.byteLength;

      if (totalBytes > maximumBytes) {
        await reader.cancel();
        throw new Error(`security.txt exceeds ${maximumBytes} bytes.`);
      }

      chunks.push(value);
    }

    return { contentType, finalUrl: currentUrl, status: response.status, text: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8") };
  }

  throw new Error("security.txt returned more than 5 redirects.");
}

function pickHeaders(headers, names) {
  return Object.fromEntries(names.filter((name) => headers[name] !== undefined).map((name) => [name, headers[name]]));
}

function summarizeSetCookie(value) {
  const segments = value.split(";").map((segment) => segment.trim());
  const name = segments.shift()?.split("=", 1)[0] || "unnamed";
  const attributeNames = segments.map((segment) => segment.split("=", 1)[0].toLowerCase());
  const sameSiteSegment = segments.find((segment) => segment.toLowerCase().startsWith("samesite="));

  return {
    httpOnly: attributeNames.includes("httponly"),
    name,
    sameSite: sameSiteSegment ? sameSiteSegment.slice(sameSiteSegment.indexOf("=") + 1) : null,
    secure: attributeNames.includes("secure")
  };
}

function toIsoDate(unixSeconds) {
  return typeof unixSeconds === "number" && unixSeconds > 0 ? new Date(unixSeconds * 1000).toISOString() : null;
}

function summarizeAxe(result) {
  return {
    incomplete: result.incomplete.map(summarizeAxeRule),
    passes: result.passes.length,
    testEngine: result.testEngine,
    testEnvironment: result.testEnvironment,
    testRunner: result.testRunner,
    timestamp: result.timestamp,
    url: result.url,
    violations: result.violations.map(summarizeAxeRule)
  };
}

function summarizeAxeRule(rule) {
  return {
    description: rule.description,
    help: rule.help,
    helpUrl: rule.helpUrl,
    id: rule.id,
    impact: rule.impact,
    nodes: rule.nodes.map((node) => ({ failureSummary: node.failureSummary, impact: node.impact, target: node.target })),
    tags: rule.tags
  };
}

function parseArguments(argumentsToParse) {
  const optionsToReturn = {
    allowNoSandbox: false,
    browser: "auto",
    collectSecurity: false,
    includeErrorDetails: false,
    outputDirectory: null,
    skipAccessibility: false,
    skipLighthouse: false,
    timeoutMs: 45000,
    url: null
  };

  for (let index = 0; index < argumentsToParse.length; index += 1) {
    const argument = argumentsToParse[index];

    if (argument === "--url" || argument === "--output" || argument === "--browser" || argument === "--timeout-ms") {
      const value = argumentsToParse[index + 1];

      if (!value) {
        throw new Error(`Missing value for ${argument}.`);
      }

      index += 1;

      if (argument === "--url") optionsToReturn.url = value;
      if (argument === "--output") optionsToReturn.outputDirectory = path.resolve(value);
      if (argument === "--browser") optionsToReturn.browser = value;
      if (argument === "--timeout-ms") optionsToReturn.timeoutMs = Number.parseInt(value, 10);
      continue;
    }

    if (argument === "--skip-accessibility") {
      optionsToReturn.skipAccessibility = true;
      continue;
    }

    if (argument === "--collect-security") {
      optionsToReturn.collectSecurity = true;
      continue;
    }

    if (argument === "--skip-lighthouse") {
      optionsToReturn.skipLighthouse = true;
      continue;
    }

    if (argument === "--allow-no-sandbox") {
      optionsToReturn.allowNoSandbox = true;
      continue;
    }

    if (argument === "--include-error-details") {
      optionsToReturn.includeErrorDetails = true;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!optionsToReturn.url || !optionsToReturn.outputDirectory) {
    throw new Error("Both --url and --output are required.");
  }

  const parsedUrl = new URL(optionsToReturn.url);

  if (!new Set(["http:", "https:"]).has(parsedUrl.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  optionsToReturn.url = parsedUrl.href;

  if (!new Set(["auto", "chrome", "edge", "chromium"]).has(optionsToReturn.browser)) {
    throw new Error("--browser must be auto, chrome, edge, or chromium.");
  }

  if (!Number.isInteger(optionsToReturn.timeoutMs) || optionsToReturn.timeoutMs < 1000 || optionsToReturn.timeoutMs > 120000) {
    throw new Error("--timeout-ms must be an integer from 1000 through 120000.");
  }

  return optionsToReturn;
}

async function prepareOutputDirectory(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const existingEntries = await readdir(outputDirectory);

  if (existingEntries.length > 0) {
    throw new Error(`Output directory must be empty: ${outputDirectory}`);
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function truncate(value, maximumLength) {
  return value.length <= maximumLength ? value : `${value.slice(0, maximumLength - 1)}…`;
}

function isRoot() {
  return typeof process.getuid === "function" && process.getuid() === 0;
}
