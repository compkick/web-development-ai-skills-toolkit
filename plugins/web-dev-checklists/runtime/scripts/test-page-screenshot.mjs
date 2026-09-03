import assert from "node:assert/strict";
import { mkdtemp, rm, stat } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { AUDIT_VIEWPORT, getRuntimeLocation, SCREENSHOT_READINESS } from "../config/runtime-config.mjs";
import { preparePageForScreenshot } from "../reporting/page-screenshot.mjs";

const { runtimeDirectory, browserDirectory } = await getRuntimeLocation();
process.env.PLAYWRIGHT_BROWSERS_PATH = browserDirectory;
const { chromium } = createRequire(path.join(runtimeDirectory, "package.json"))("playwright");
const testDirectory = await mkdtemp(path.join(os.tmpdir(), "web-dev-checklists-screenshot-test-"));
const image = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80"><rect width="160" height="80" fill="#126c39"/></svg>';
const requests = new Set();
const timers = new Set();
const server = http.createServer((request, response) => {
  requests.add(request.url);
  if (["/slow.svg", "/lazy.svg"].includes(request.url)) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      response.writeHead(200, { "Content-Type": "image/svg+xml" });
      response.end(image);
    }, 1500);
    timers.add(timer);
    return;
  }
  if (request.url === "/never.svg") return;
  if (request.url === "/missing.svg") { response.writeHead(404); response.end(); return; }
  if (request.url === "/favicon.ico") { response.writeHead(204); response.end(); return; }

  const content = request.url === "/ready" ? `
    <h1>Delayed and lazy images</h1><img id="slow" src="/slow.svg" width="160" height="80" alt="Delayed green block">
    <div style="height:2800px"></div><img id="lazy" width="160" height="80" alt="Lazy green block">
    <script>
      const target = document.getElementById('lazy');
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { target.src = '/lazy.svg'; observer.disconnect(); }
      });
      observer.observe(target);
    </script>` : request.url === "/broken" ? `
    <img src="/missing.svg" width="160" height="80" alt="Broken image"><img width="160" height="80" alt="Unset image">
    <img style="display:none" loading="lazy" src="/never.svg" alt="Hidden image">` : request.url === "/timeout" ? `
    <img src="/never.svg" width="160" height="80" alt="Image that never finishes">` : `
    <div style="height:20000px">Endless content fixture</div>
    <script>addEventListener('scroll', () => { document.body.style.height = (document.documentElement.scrollHeight + 1000) + 'px'; });</script>`;
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Screenshot fixture</title></head><body>${content}</body></html>`);
});

let browser;
try {
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const launchErrors = [];
  for (const candidate of [{ executablePath: chromium.executablePath() }, { channel: "chrome" }, { channel: "msedge" }]) {
    try {
      browser = await chromium.launch({ ...candidate, chromiumSandbox: true, headless: true, timeout: 10000 });
      break;
    } catch (error) {
      launchErrors.push(error);
    }
  }
  if (!browser) throw new AggregateError(launchErrors, "No supported browser is available for screenshot testing.");
  const page = await browser.newPage({ viewport: AUDIT_VIEWPORT });
  await page.goto(`${baseUrl}/ready`, { waitUntil: "domcontentloaded" });
  const ready = await preparePageForScreenshot(page);
  assert.equal(ready.status, "ready");
  assert.deepEqual(ready.images, { total: 2, loaded: 2, pending: 0, failed: 0, missingSource: 0 });
  assert.equal(ready.fonts, "loaded");
  assert.ok(requests.has("/lazy.svg"), "Scrolling must trigger the lazy image request.");
  assert.ok(ready.elapsedMs >= 1500, "Do not capture before the delayed image has loaded.");
  assert.equal(await page.evaluate(() => window.scrollY), 0, "Restore the top before capture.");
  assert.deepEqual(await page.locator("img").evaluateAll(images => images.map(img => img.complete && img.naturalWidth > 0)), [true, true]);
  const screenshotPath = path.join(testDirectory, "page.png");
  await page.screenshot({ animations: "disabled", fullPage: true, path: screenshotPath });
  assert.ok((await stat(screenshotPath)).size > 0);

  await page.goto(`${baseUrl}/broken`, { waitUntil: "domcontentloaded" });
  const broken = await preparePageForScreenshot(page);
  assert.equal(broken.status, "incomplete");
  assert.equal(broken.images.failed, 1);
  assert.equal(broken.images.missingSource, 1);
  assert.equal(broken.images.total, 2, "Hidden images are excluded from the readiness count.");
  assert.equal(broken.timedOut, false, "Broken images should be recorded without waiting out the budget.");

  await page.goto(`${baseUrl}/timeout`, { waitUntil: "domcontentloaded" });
  const timedOut = await preparePageForScreenshot(page, { ...SCREENSHOT_READINESS, loadTimeoutMs: 200, timeoutMs: 1200 });
  assert.equal(timedOut.status, "incomplete");
  assert.equal(timedOut.loadState, "timed-out");
  assert.equal(timedOut.timedOut, true);
  assert.equal(timedOut.images.pending, 1);
  assert.ok(timedOut.elapsedMs < 4000, "A stuck image must not hang screenshot preparation.");

  await page.goto(`${baseUrl}/infinite`, { waitUntil: "domcontentloaded" });
  const limited = await preparePageForScreenshot(page, { ...SCREENSHOT_READINESS, maxScrollSteps: 2 });
  assert.equal(limited.status, "incomplete");
  assert.equal(limited.scroll.steps, 2);
  assert.equal(limited.scroll.limitReached, true);
  assert.equal(limited.timedOut, false);
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  console.log("Screenshot readiness tests passed: delayed images, scroll-triggered lazy images, missing/broken images, time budget, scroll cap, and return to top.");
} finally {
  await browser?.close();
  for (const timer of timers) clearTimeout(timer);
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await rm(testDirectory, { recursive: true, force: true });
}
