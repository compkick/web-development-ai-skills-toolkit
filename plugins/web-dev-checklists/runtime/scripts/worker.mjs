import AxeBuilder from "@axe-core/playwright";
import { launch as launchChrome } from "chrome-launcher";
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import lighthouse from "lighthouse";
import { chromium } from "playwright";

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

try {
  ({ browser, selectedBrowser } = await launchBrowser(options.browser, options.allowNoSandbox));
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
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

  const response = await page.goto(options.url, { timeout: options.timeoutMs, waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ fullPage: true, path: path.join(options.outputDirectory, "page.png") });

  pageResult = {
    browserErrors: {
      consoleErrorCount,
      detailsFile: options.includeErrorDetails ? "browser-errors.json" : null,
      pageErrorCount
    },
    finalUrl: page.url(),
    httpStatus: response?.status() ?? null,
    title: await page.title()
  };

  if (options.includeErrorDetails) {
    await writeJson(path.join(options.outputDirectory, "browser-errors.json"), { consoleErrors, pageErrors });
  }

  if (!options.skipAccessibility) {
    try {
      const rawAxeResult = await new AxeBuilder({ page }).analyze();
      const axeResult = summarizeAxe(rawAxeResult);
      await writeJson(path.join(options.outputDirectory, "axe-results.json"), axeResult);
      axeSummary = { incomplete: axeResult.incomplete.length, passes: axeResult.passes, status: "completed", violations: axeResult.violations.length };
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
