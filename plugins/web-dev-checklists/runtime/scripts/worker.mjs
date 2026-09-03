import AxeBuilder from "@axe-core/playwright";
import { launch as launchChrome } from "chrome-launcher";
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import lighthouse, { desktopConfig } from "lighthouse";
import { chromium } from "playwright";
import { probeHomepageLinks } from "../collectors/homepage-links.mjs";
import { probeHttpRedirect } from "../collectors/http-redirect.mjs";
import { collectTlsBaseline } from "../collectors/tls-baseline.mjs";
import { AUDIT_FORM_FACTOR, AUDIT_USER_AGENT, AUDIT_VIEWPORT, DEFAULT_AXE_ELEMENT_SCREENSHOT_LIMIT } from "../config/runtime-config.mjs";
import { captureAxeElementScreenshots, writeAxeHtmlReport } from "../reporting/axe-report.mjs";

const options = parseArguments(process.argv.slice(2));
const startedAt = new Date().toISOString();

if (isRoot() && !options.allowNoSandbox) {
  throw new Error("Refusing to audit as root because Chromium sandboxing is unavailable. Run as a non-root user, or use --allow-no-sandbox only with explicit approval inside an isolated disposable environment.");
}

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

try {
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

  if (options.collectLaunch) {
    try {
      const launchResult = await collectLaunchEvidence({ page, requestedUrl: options.url, response, timeoutMs: options.timeoutMs });
      await writeJson(path.join(options.outputDirectory, "launch-results.json"), launchResult);
      launchSummary = { checkedLinks: launchResult.linkProbe.tested, status: "completed" };
    } catch (error) {
      launchSummary = { error: truncate(error.message, 500), status: "error" };
    }
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
    lighthouseSummary = { finalUrl: lighthouseResult.finalUrl, formFactor: lighthouseResult.formFactor, scores: lighthouseResult.scores, status: "completed" };
  } catch (error) {
    lighthouseSummary = { error: truncate(error.message, 500), status: "error" };
  }
}

const summary = {
  axe: axeSummary,
  browser: { formFactor: AUDIT_FORM_FACTOR, name: selectedBrowser.name, sandboxed: !options.allowNoSandbox, viewport: { ...AUDIT_VIEWPORT } },
  completedAt: new Date().toISOString(),
  lighthouse: lighthouseSummary,
  launch: launchSummary,
  page: pageResult,
  requestedUrl: options.url,
  security: securitySummary,
  seo: seoSummary,
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

    let candidateBrowser;
    let candidateContext;

    try {
      candidateBrowser = await chromium.launch({ chromiumSandbox: !allowNoSandbox, executablePath: candidate.executablePath, headless: true });
      candidateContext = await candidateBrowser.newContext({
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        screen: { ...AUDIT_VIEWPORT },
        viewport: { ...AUDIT_VIEWPORT }
      });
      const launchedPage = await createFirstPage(candidateBrowser, candidateContext, candidate.name);
      return { browser: candidateBrowser, context: candidateContext, page: launchedPage, selectedBrowser: candidate };
    } catch (error) {
      failures.push(`${candidate.name}: ${truncate(error.message, 240)}`);
      await candidateContext?.close().catch(() => {});
      await candidateBrowser?.close().catch(() => {});
    }
  }

  const failureDetail = failures.length > 0 ? ` Launch failures: ${failures.join(" | ")}` : "";
  throw new Error(`No supported browser could be launched. Bootstrap Playwright Chromium or install Chrome or Edge.${failureDetail}`);
}

function createFirstPage(browser, context, browserName) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(reject, new Error(`${browserName} did not create a page within 10 seconds.`)), 10000);
    const onDisconnected = () => finish(reject, new Error(`${browserName} exited before its first page was ready.`));
    browser.once("disconnected", onDisconnected);
    context.newPage().then((createdPage) => finish(resolve, createdPage), (error) => finish(reject, error));

    function finish(callback, value) {
      clearTimeout(timeout);
      browser.off("disconnected", onDisconnected);
      callback(value);
    }
  });
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
    }, desktopConfig);
    const [jsonReport, htmlReport] = Array.isArray(result.report) ? result.report : [result.report];

    if (jsonReport) {
      await writeFile(path.join(outputDirectory, "lighthouse-report.json"), jsonReport, "utf8");
    }

    if (htmlReport) {
      await writeFile(path.join(outputDirectory, "lighthouse-report.html"), htmlReport, "utf8");
    }

    return {
      finalUrl: result.lhr.finalDisplayedUrl,
      formFactor: result.lhr.configSettings.formFactor,
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

async function collectLaunchEvidence({ page, requestedUrl, response, timeoutMs }) {
  const finalUrl = new URL(page.url());
  const browserUserAgent = await page.evaluate(() => navigator.userAgent);
  const responseHeaders = response ? await response.allHeaders() : {};
  const documentLaunch = await page.evaluate(() => {
    const cleanText = (value, maximumLength = 160) => {
      const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
      return normalized.length <= maximumLength ? normalized : `${normalized.slice(0, maximumLength - 1)}…`;
    };
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    };
    const getRegion = (anchor) => {
      if (anchor.closest("footer, [role='contentinfo']")) return "footer";
      if (anchor.closest("nav, [role='navigation']")) return "navigation";
      if (anchor.closest("header, [role='banner']")) return "header";
      if (anchor.closest("main, [role='main']")) return "main";
      return "other";
    };
    const sanitizeForEvidence = (value) => {
      try {
        const url = new URL(value, document.baseURI);
        url.username = "";
        url.password = "";
        for (const [name] of url.searchParams) {
          if (/(?:access|auth|code|credential|key|password|secret|session|signature|token)/i.test(name)) url.searchParams.set(name, "[redacted]");
        }
        return cleanText(url.href, 300);
      } catch {
        return cleanText(value, 300);
      }
    };
    const regions = {
      footerCount: document.querySelectorAll("footer, [role='contentinfo']").length,
      headerCount: document.querySelectorAll("header, [role='banner']").length,
      mainCount: document.querySelectorAll("main, [role='main']").length,
      navigationCount: document.querySelectorAll("nav, [role='navigation']").length,
      visibleLinkCounts: { footer: 0, header: 0, main: 0, navigation: 0, other: 0 }
    };
    const inventory = { externalHttp: 0, internalHttp: 0, issueCount: 0, nonHttp: 0, probeEligible: 0, totalAnchors: document.querySelectorAll("a").length, visibleAnchors: 0 };
    const issues = [];
    const testCandidates = [];
    const issueCountsByRegion = Object.fromEntries(Object.keys(regions.visibleLinkCounts).map((region) => [region, 0]));
    const testCandidatesTruncatedByRegion = { ...issueCountsByRegion };

    for (const anchor of document.querySelectorAll("a")) {
      if (!isVisible(anchor)) continue;
      inventory.visibleAnchors += 1;
      const region = getRegion(anchor);
      regions.visibleLinkCounts[region] += 1;
      const text = cleanText(anchor.textContent || anchor.getAttribute("aria-label") || anchor.querySelector("img")?.getAttribute("alt")) || "(no link text)";
      const rawHref = anchor.getAttribute("href");
      const href = rawHref?.trim() ?? "";
      let issue = null;

      if (rawHref === null || href === "") issue = "The link does not have a destination.";
      else if (href === "#") issue = "The link uses an unset # destination.";
      else if (/^javascript:/i.test(href)) issue = "The link uses a JavaScript URL and needs review as a navigation control.";
      else if (href.startsWith("#")) {
        let fragmentId = "";
        try { fragmentId = decodeURIComponent(href.slice(1)); } catch { fragmentId = href.slice(1); }
        if (!fragmentId || !document.getElementById(fragmentId) && document.getElementsByName(fragmentId).length === 0) issue = "The same-page link does not match an element id or named anchor.";
      } else if (/^mailto:/i.test(href) && !href.slice(7).split("?")[0].trim()) issue = "The email link does not contain an address.";
      else if (/^tel:/i.test(href) && !href.slice(4).replace(/[^0-9+]/g, "")) issue = "The telephone link does not contain a number.";

      let resolvedUrl = null;
      try { resolvedUrl = new URL(href, document.baseURI); } catch { if (!issue) issue = "The link destination is not a valid URL."; }

      if (issue) {
        inventory.issueCount += 1;
        issueCountsByRegion[region] += 1;
        if (issues.length < 100) issues.push({ href: href ? sanitizeForEvidence(href) : "(empty)", issue, region, text });
      }

      if (!resolvedUrl || !new Set(["http:", "https:"]).has(resolvedUrl.protocol)) {
        if (href && !href.startsWith("#")) inventory.nonHttp += 1;
        continue;
      }

      if (resolvedUrl.hostname !== location.hostname) {
        inventory.externalHttp += 1;
        continue;
      }
      inventory.internalHttp += 1;

      if (!issue && !href.startsWith("#")) {
        inventory.probeEligible += 1;
        if (testCandidates.length < 500) testCandidates.push({ region, text, url: resolvedUrl.href });
        else testCandidatesTruncatedByRegion[region] += 1;
      }
    }

    const metaRobots = [...document.querySelectorAll("meta[name='robots' i], meta[name='googlebot' i]")].map((element) => cleanText(element.getAttribute("content"), 300));

    return {
      content: {
        h1Text: [...document.querySelectorAll("h1")].filter(isVisible).slice(0, 5).map((heading) => cleanText(heading.textContent)),
        title: cleanText(document.title, 300)
      },
      inventory,
      issues,
      issueCountsByRegion,
      metaRobots,
      regions,
      testCandidateCount: testCandidates.length,
      testCandidates,
      testCandidatesTruncatedByRegion,
      testCandidatesTruncated: Math.max(0, inventory.probeEligible - testCandidates.length)
    };
  });
  const { testCandidates, ...documentEvidence } = documentLaunch;
  const xRobotsTag = responseHeaders["x-robots-tag"] ?? null;
  const robotsValues = [...documentLaunch.metaRobots, xRobotsTag].filter(Boolean).join(",").toLowerCase().split(/[\s,]+/).filter(Boolean);
  const [httpRedirect, linkProbe] = await Promise.all([
    probeHttpRedirect(requestedUrl, timeoutMs, browserUserAgent),
    probeHomepageLinks(testCandidates, finalUrl, timeoutMs, browserUserAgent)
  ]);

  return {
    document: documentEvidence,
    finalUrl: finalUrl.href,
    httpRedirect,
    indexing: { noindex: robotsValues.includes("noindex") || robotsValues.includes("none"), xRobotsTag },
    linkProbe,
    requestedUrl
  };
}

async function collectSecurityEvidence({ context, page, requestProtocolCounts, requestedUrl, response, timeoutMs }) {
  const finalUrl = new URL(page.url());
  const browserUserAgent = await page.evaluate(() => navigator.userAgent);
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
  const [httpRedirect, securityTxt, tlsBaseline] = await Promise.all([
    probeHttpRedirect(requestedUrl, timeoutMs, browserUserAgent),
    probeSecurityTxt(finalUrl, timeoutMs),
    collectTlsBaseline(finalUrl, timeoutMs)
  ]);

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
    httpRedirect,
    navigationProtocol,
    requestProtocolCounts,
    securityTxt,
    tlsBaseline
  };
}

async function collectSeoEvidence({ page, requestedUrl, response, timeoutMs }) {
  const finalUrl = new URL(page.url());
  const responseHeaders = response ? await response.allHeaders() : {};
  const redirectChain = await summarizeNavigationChain(response);
  const documentSeo = await page.evaluate(() => {
    const cleanText = (value, maximumLength = 300) => {
      const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
      return normalized.length <= maximumLength ? normalized : `${normalized.slice(0, maximumLength - 1)}…`;
    };
    const resolveUrl = (value) => {
      try {
        return new URL(value, document.baseURI).href;
      } catch {
        return null;
      }
    };
    const canonicalElements = [...document.querySelectorAll("link[rel~='canonical']")].map((element) => {
      const href = element.getAttribute("href")?.trim() ?? "";
      const resolvedUrl = resolveUrl(href);
      return { absolute: /^https?:\/\//i.test(href), hasFragment: resolvedUrl ? new URL(resolvedUrl).hash.length > 0 : null, href: cleanText(href), resolvedUrl };
    });
    const alternateLanguages = [...document.querySelectorAll("link[rel~='alternate'][hreflang]")].slice(0, 50).map((element) => ({
      href: cleanText(element.getAttribute("href")),
      hreflang: cleanText(element.getAttribute("hreflang"), 80),
      resolvedUrl: resolveUrl(element.getAttribute("href"))
    }));
    const jsonLd = [...document.querySelectorAll("script[type='application/ld+json']")].map((element, index) => {
      try {
        const parsed = JSON.parse(element.textContent ?? "");
        const types = new Set();
        const visit = (value) => {
          if (Array.isArray(value)) return value.forEach(visit);
          if (!value || typeof value !== "object") return;
          const declaredTypes = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
          declaredTypes.filter((type) => typeof type === "string").forEach((type) => types.add(type));
          Object.values(value).forEach(visit);
        };
        visit(parsed);
        return { index, parsed: true, types: [...types].slice(0, 30) };
      } catch (error) {
        return { error: cleanText(error.message, 200), index, parsed: false, types: [] };
      }
    });
    const linkInventory = { crawlableHttp: 0, emptyHref: 0, internalHttp: 0, missingText: 0, nonHttp: 0, total: 0 };

    for (const anchor of document.querySelectorAll("a")) {
      linkInventory.total += 1;
      const href = anchor.getAttribute("href")?.trim() ?? "";
      const accessibleText = cleanText(anchor.textContent || anchor.getAttribute("aria-label") || anchor.querySelector("img")?.getAttribute("alt"));
      if (!accessibleText) linkInventory.missingText += 1;
      if (!href) {
        linkInventory.emptyHref += 1;
        continue;
      }
      const resolvedUrl = resolveUrl(href);
      if (!resolvedUrl || !new Set(["http:", "https:"]).has(new URL(resolvedUrl).protocol)) {
        linkInventory.nonHttp += 1;
        continue;
      }
      linkInventory.crawlableHttp += 1;
      if (new URL(resolvedUrl).origin === location.origin) linkInventory.internalHttp += 1;
    }

    const descriptions = [...document.querySelectorAll("meta[name='description' i]")].map((element) => cleanText(element.getAttribute("content"), 500));
    const robotsDirectives = [...document.querySelectorAll("meta[name='robots' i], meta[name='googlebot' i]")].map((element) => ({
      content: cleanText(element.getAttribute("content"), 300),
      name: cleanText(element.getAttribute("name"), 80).toLowerCase()
    }));
    const bodyText = cleanText(document.body?.innerText, 1000000);
    const mainText = cleanText(document.querySelector("main, [role='main']")?.innerText, 1000000);

    return {
      alternateLanguages,
      canonicalElements,
      content: { bodyTextLength: bodyText.length, mainTextLength: mainText.length },
      headings: { h1Count: document.querySelectorAll("h1").length, h1Text: [...document.querySelectorAll("h1")].slice(0, 5).map((heading) => cleanText(heading.textContent)) },
      htmlLanguage: cleanText(document.documentElement.lang, 80) || null,
      linkInventory,
      metaDescriptions: descriptions,
      metaRobots: robotsDirectives,
      structuredData: {
        jsonLd,
        jsonLdBlockCount: jsonLd.length,
        jsonLdParseErrorCount: jsonLd.filter((block) => !block.parsed).length,
        microdataItemCount: document.querySelectorAll("[itemscope]").length,
        rdfaTypeCount: document.querySelectorAll("[typeof]").length
      },
      titles: [...document.querySelectorAll("title")].map((element) => cleanText(element.textContent, 500))
    };
  });
  const robotsTxt = await probeRobotsTxt(finalUrl, timeoutMs);
  const sitemaps = await probeSitemaps(finalUrl, robotsTxt.sitemapUrls ?? [], timeoutMs);
  const httpCanonicalElements = parseHttpCanonicalLinks(responseHeaders.link, finalUrl);

  return {
    contentType: responseHeaders["content-type"] ?? null,
    document: documentSeo,
    finalUrl: finalUrl.href,
    httpCanonicalElements,
    requestedUrl,
    responseHeaders: pickHeaders(responseHeaders, ["link", "x-robots-tag"]),
    redirectChain,
    robotsTxt,
    sitemaps
  };
}

function parseHttpCanonicalLinks(linkHeader, baseUrl) {
  if (!linkHeader) return [];
  const canonicals = [];

  for (const match of linkHeader.matchAll(/<([^>]+)>\s*([^,]*)/g)) {
    if (!/(?:^|;)\s*rel\s*=\s*(?:"[^"]*\bcanonical\b[^"]*"|'[^']*\bcanonical\b[^']*'|canonical)(?:\s*;|\s*$)/i.test(match[2])) continue;
    const href = match[1].trim();
    let resolvedUrl = null;

    try {
      resolvedUrl = new URL(href, baseUrl).href;
    } catch {
      // Invalid canonical URLs are retained as null evidence.
    }

    canonicals.push({ absolute: /^https?:\/\//i.test(href), hasFragment: resolvedUrl ? new URL(resolvedUrl).hash.length > 0 : null, href: truncate(href, 300), resolvedUrl });
  }

  return canonicals;
}

async function summarizeNavigationChain(response) {
  const reversed = [];
  let request = response?.request() ?? null;

  while (request) {
    const requestResponse = await request.response();
    reversed.push({ status: requestResponse?.status() ?? null, url: request.url() });
    request = request.redirectedFrom();
  }

  return reversed.reverse();
}

async function probeRobotsTxt(finalUrl, timeoutMs) {
  const robotsUrl = new URL("/robots.txt", finalUrl.origin);

  try {
    const result = await fetchTextPreview(robotsUrl, timeoutMs, 512000, "robots.txt", "text/plain,*/*;q=0.8");
    const sitemapUrls = result.status === 200 ? [...result.text.matchAll(/^\s*sitemap\s*:\s*(\S+)\s*$/gim)].map((match) => match[1]).slice(0, 20) : [];
    return {
      allowDirectiveCount: result.status === 200 ? (result.text.match(/^\s*allow\s*:/gim) ?? []).length : 0,
      contentType: result.contentType,
      disallowDirectiveCount: result.status === 200 ? (result.text.match(/^\s*disallow\s*:/gim) ?? []).length : 0,
      finalUrl: result.finalUrl.href,
      found: result.status === 200,
      sitemapUrls,
      status: result.status,
      truncated: result.truncated,
      userAgentDirectiveCount: result.status === 200 ? (result.text.match(/^\s*user-agent\s*:/gim) ?? []).length : 0
    };
  } catch (error) {
    return { error: truncate(error.message, 300), found: false, sitemapUrls: [] };
  }
}

async function probeSitemaps(finalUrl, declaredSitemaps, timeoutMs) {
  const candidates = declaredSitemaps.length > 0 ? declaredSitemaps : [new URL("/sitemap.xml", finalUrl.origin).href];
  const results = [];

  for (const candidate of [...new Set(candidates)].slice(0, 3)) {
    let sitemapUrl;

    try {
      sitemapUrl = new URL(candidate, finalUrl.origin);
    } catch {
      results.push({ error: "The sitemap directive is not a valid URL.", url: truncate(candidate, 300) });
      continue;
    }

    if (sitemapUrl.origin !== finalUrl.origin) {
      results.push({ reason: "The sitemap is outside the authorized origin and was not requested.", status: "not-checked", url: sitemapUrl.href });
      continue;
    }

    try {
      const result = await fetchTextPreview(sitemapUrl, timeoutMs, 262144, "sitemap", "application/xml,text/xml,text/plain,*/*;q=0.5");
      const rootMatch = result.text.match(/<(urlset|sitemapindex)(?:\s|>)/i);
      const rootType = rootMatch?.[1]?.toLowerCase() ?? null;
      const locations = [...result.text.matchAll(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXmlText(match[1].trim())).slice(0, 5000);
      results.push({
        contentType: result.contentType,
        finalUrl: result.finalUrl.href,
        locationCountInPreview: locations.length,
        rootType,
        status: result.status,
        targetIncludedInPreview: rootType === "urlset" ? locations.includes(finalUrl.href) : null,
        truncated: result.truncated,
        url: sitemapUrl.href
      });
    } catch (error) {
      results.push({ error: truncate(error.message, 300), url: sitemapUrl.href });
    }
  }

  return results;
}

async function fetchTextPreview(initialUrl, timeoutMs, maximumBytes, resourceName, accept) {
  let currentUrl = new URL(initialUrl);

  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    const response = await fetch(currentUrl, { headers: { accept, "user-agent": AUDIT_USER_AGENT }, redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
    const location = response.headers.get("location");

    if (location && response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      const nextUrl = new URL(location, currentUrl);
      if (nextUrl.origin !== initialUrl.origin) throw new Error(`${resourceName} redirected outside the authorized origin.`);
      currentUrl = nextUrl;
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.body) return { contentType, finalUrl: currentUrl, status: response.status, text: "", truncated: false };
    const reader = response.body.getReader();
    const chunks = [];
    let totalBytes = 0;
    let truncatedResult = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const remainingBytes = maximumBytes - totalBytes;
      if (remainingBytes <= 0) {
        truncatedResult = true;
        await reader.cancel();
        break;
      }
      chunks.push(value.byteLength <= remainingBytes ? value : value.slice(0, remainingBytes));
      totalBytes += Math.min(value.byteLength, remainingBytes);
      if (value.byteLength > remainingBytes || totalBytes === maximumBytes) {
        truncatedResult = true;
        await reader.cancel();
        break;
      }
    }

    return { contentType, finalUrl: currentUrl, status: response.status, text: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8"), truncated: truncatedResult };
  }

  throw new Error(`${resourceName} returned more than 5 redirects.`);
}

function decodeXmlText(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&apos;", "'");
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
    const response = await fetch(currentUrl, { headers: { accept: "text/plain", "user-agent": AUDIT_USER_AGENT }, redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
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
    collectLaunch: false,
    collectSecurity: false,
    collectSeo: false,
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

    if (argument === "--collect-launch") {
      optionsToReturn.collectLaunch = true;
      continue;
    }

    if (argument === "--collect-seo") {
      optionsToReturn.collectSeo = true;
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
