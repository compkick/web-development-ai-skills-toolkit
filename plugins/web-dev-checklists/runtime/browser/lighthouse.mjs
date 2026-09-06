import { launch as launchChrome } from "chrome-launcher";
import lighthouse, { desktopConfig } from "lighthouse";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";

export async function runLighthouse(url, chromePath, outputDirectory, allowNoSandbox) {
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
