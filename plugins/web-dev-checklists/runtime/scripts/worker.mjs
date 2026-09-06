import { writeJson, prepareOutputDirectory } from "../evidence/package.mjs";
import { truncate } from "../evidence/text.mjs";
import { emptyRunSummary, recordRunFailure } from "../evidence/run-failure.mjs";
import { launchBrowser } from "../browser/session.mjs";
import { runLighthouse } from "../browser/lighthouse.mjs";
import { collectLaunchEvidence } from "../collectors/launch.mjs";
import { collectSecurityEvidence } from "../collectors/security.mjs";
import { collectSeoEvidence } from "../collectors/technical-seo.mjs";
import { summarizeAxe } from "../collectors/accessibility.mjs";
import { parseArguments } from "../config/audit-options.mjs";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
import process from "node:process";
import { probeHttpRedirect } from "../collectors/http-redirect.mjs";
import { AUDIT_FORM_FACTOR, AUDIT_VIEWPORT, DEFAULT_AXE_ELEMENT_SCREENSHOT_LIMIT } from "../config/runtime-config.mjs";
import { captureAxeElementScreenshots, writeAxeHtmlReport } from "../reporting/axe-report.mjs";
import { preparePageForScreenshot } from "../reporting/page-screenshot.mjs";

const options = parseArguments(process.argv.slice(2));
const startedAt = new Date().toISOString();

await prepareOutputDirectory(options.outputDirectory);

let browser;
let context;
let selectedBrowser;
let page;
let pageResult;
let axeSummary = { status: options.skipAccessibility ? "skipped" : "not-run" };
let lighthouseSummary = { status: options.skipLighthouse ? "skipped" : "not-run" };
let securitySummary = { status: options.collectSecurity ? "not-run" : "skipped" };
let seoSummary = { status: options.collectSeo ? "not-run" : "skipped" };
let launchSummary = { status: options.collectLaunch ? "not-run" : "skipped" };
let stage = "sandbox-policy";
let runFailure;

try {
  if (isRoot() && !options.allowNoSandbox) {
    throw new Error("Refusing to audit as root because Chromium sandboxing is unavailable. Run as a non-root user, or use --allow-no-sandbox only with explicit approval inside an isolated disposable environment.");
  }
  stage = "browser-start";
  ({ browser, context, page, selectedBrowser } = await launchBrowser(options.browser, options.allowNoSandbox));
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

  stage = "navigation";
  const response = await page.goto(options.url, { timeout: options.timeoutMs, waitUntil: "domcontentloaded" });
  stage = "screenshot";
  const screenshotReadiness = await preparePageForScreenshot(page);
  await page.screenshot({ animations: "disabled", fullPage: true, path: path.join(options.outputDirectory, "page.png"), timeout: 10000 });
  stage = "page-details";
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
    screenshotReadiness,
    structure: documentDetails.structure,
    title: await page.title()
  };

  if (options.includeErrorDetails) {
    await writeJson(path.join(options.outputDirectory, "browser-errors.json"), { consoleErrors, pageErrors });
  }

  // One promise per run: launch and security reuse the same authorized redirect probe.
  let redirectProbe;
  const sharedHttpRedirect = () => redirectProbe ??= page.evaluate(() => navigator.userAgent).then((userAgent) => probeHttpRedirect(options.url, options.timeoutMs, userAgent));

  if (options.collectLaunch) {
    try {
      const launchResult = await collectLaunchEvidence({ page, requestedUrl: options.url, response, timeoutMs: options.timeoutMs, sharedHttpRedirect });
      await writeJson(path.join(options.outputDirectory, "launch-results.json"), launchResult);
      launchSummary = { checkedLinks: launchResult.linkProbe.tested, status: "completed" };
    } catch (error) {
      launchSummary = { error: truncate(error.message, 500), status: "error" };
    }
  }

  if (options.collectSecurity) {
    try {
      const securityResult = await collectSecurityEvidence({ context, page, requestProtocolCounts, requestedUrl: options.url, response, timeoutMs: options.timeoutMs, sharedHttpRedirect });
      await writeJson(path.join(options.outputDirectory, "security-results.json"), securityResult);
      securitySummary = { status: "completed" };
    } catch (error) {
      securitySummary = { error: truncate(error.message, 500), status: "error" };
    }
  }

  if (options.collectSeo) {
    try {
      const seoResult = await collectSeoEvidence({ page, requestedUrl: options.url, response, timeoutMs: options.timeoutMs });
      await writeJson(path.join(options.outputDirectory, "seo-results.json"), seoResult);
      seoSummary = { sitemapCount: seoResult.sitemaps.length, status: "completed" };
    } catch (error) {
      seoSummary = { error: truncate(error.message, 500), status: "error" };
    }
  }

  if (!options.skipAccessibility) {
    try {
      const rawAxeResult = await new AxeBuilder({ page }).analyze();
      const axeResult = summarizeAxe(rawAxeResult);
      axeResult.auditEnvironment = { formFactor: AUDIT_FORM_FACTOR, viewport: { ...AUDIT_VIEWPORT } };
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
        await writeAxeHtmlReport(axeResult, path.join(options.outputDirectory, "accessibility-report.html"));
      } catch (error) {
        report = { error: truncate(error.message, 300), status: "error" };
      }

      axeSummary = { elementScreenshots, incomplete: axeResult.incomplete.length, passes: axeResult.passes, report, status: "completed", violations: axeResult.violations.length };
    } catch (error) {
      axeSummary = { error: truncate(error.message, 500), status: "error" };
    }
  }

  stage = "browser-close";
  await context.close();
} catch (error) {
  runFailure = { stage, error };
  console.error(`Audit stopped during ${stage}: ${error.message}`);
} finally {
  try { await browser?.close(); } catch (error) { runFailure ??= { stage: "browser-close", error }; }
}

if (!runFailure && !options.skipLighthouse) {
  try {
    const lighthouseResult = await runLighthouse(options.url, selectedBrowser.executablePath, options.outputDirectory, options.allowNoSandbox);
    lighthouseSummary = { finalUrl: lighthouseResult.finalUrl, formFactor: lighthouseResult.formFactor, scores: lighthouseResult.scores, status: "completed" };
  } catch (error) {
    lighthouseSummary = { error: truncate(error.message, 500), status: "error" };
  }
}

const summary = {
  axe: axeSummary,
  browser: selectedBrowser ? { formFactor: AUDIT_FORM_FACTOR, name: selectedBrowser.name, sandboxed: !options.allowNoSandbox, viewport: { ...AUDIT_VIEWPORT } } : emptyRunSummary(options).browser,
  completedAt: new Date().toISOString(),
  lighthouse: lighthouseSummary,
  launch: launchSummary,
  page: pageResult ?? emptyRunSummary(options).page,
  requestedUrl: options.url,
  security: securitySummary,
  seo: seoSummary,
  startedAt
};

if (runFailure) await recordRunFailure(options, summary, runFailure.stage, runFailure.error);
else await writeJson(path.join(options.outputDirectory, "summary.json"), summary);
console.log(JSON.stringify(summary, null, 2));
process.exitCode = runFailure ? 1 : 0;

function isRoot() {
  return typeof process.getuid === "function" && process.getuid() === 0;
}
