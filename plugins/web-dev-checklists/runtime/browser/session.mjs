import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDIT_VIEWPORT } from "../config/runtime-config.mjs";
import { truncate } from "../evidence/text.mjs";

export async function launchBrowser(requestedBrowser, allowNoSandbox) {
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
