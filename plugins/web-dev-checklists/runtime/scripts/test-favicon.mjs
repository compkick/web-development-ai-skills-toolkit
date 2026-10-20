import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { getRuntimeLocation, FAVICON_REVIEW } from "../config/runtime-config.mjs";
import { collectFaviconEvidence } from "../collectors/favicon.mjs";
import { faviconChecks } from "../evaluators/favicon.mjs";
import { createFixtureDirectory, listen, closeFixture } from "../testing/fixture-harness.mjs";

const { runtimeDirectory, browserDirectory } = await getRuntimeLocation();
process.env.PLAYWRIGHT_BROWSERS_PATH = browserDirectory;
const { chromium } = createRequire(path.join(runtimeDirectory, "package.json"))("playwright");
const directory = await createFixtureDirectory("toolkit-favicon-test-");
const png = Buffer.from(await readFile(new URL("../fixtures/favicon-png.base64", import.meta.url), "utf8"), "base64");
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader[6] = icoHeader[7] = 96;
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(png.length, 14);
icoHeader.writeUInt32LE(22, 18);
const ico = Buffer.concat([icoHeader, png]);
const requests = new Set();
const svg = (width, height = width, extra = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#f97316"/>${extra}</svg>`;
const server = http.createServer((request, response) => {
  requests.add(request.url);
  const send = (status, type, body) => { response.writeHead(status, { "Content-Type": type }); response.end(body); };
  if (request.url === "/favicon.ico" || request.url.startsWith("/icon.png")) return send(200, "image/png", png);
  if (request.url === "/icon.ico") return send(200, "image/vnd.microsoft.icon", ico);
  if (request.url === "/missing.png") return send(404, "text/plain", "Missing");
  if (request.url === "/fake.png") return send(200, "image/png", "<!doctype html><h1>Not an image</h1>");
  if (request.url === "/corrupt.png") return send(200, "image/png", png.subarray(0, 20));
  if (request.url === "/rectangle.svg") return send(200, "image/svg+xml", svg(64, 32));
  if (request.url === "/small.svg") return send(200, "image/svg+xml", svg(4));
  if (request.url === "/active.svg") return send(200, "image/svg+xml", svg(96, 96, '<script>fetch("/script-ran")</script><image href="/external-image.png" width="10" height="10"/>'));
  if (request.url === "/huge.png") { response.writeHead(200, { "Content-Length": FAVICON_REVIEW.maximumBytes + 1 }); return response.end(); }
  if (request.url === "/streamed.png") { response.writeHead(200, { "Content-Type": "image/png" }); response.write(png); return response.end(Buffer.alloc(FAVICON_REVIEW.maximumBytes)); }
  if (request.url === "/loop.png") { response.writeHead(302, { Location: "/loop.png" }); return response.end(); }
  if (request.url === "/slow.png") return;
  if (request.url === "/redirect.png") { response.writeHead(302, { Location: "/icon.png" }); return response.end(); }
  if (request.url === "/outside.png") { response.writeHead(302, { Location: `http://localhost:${server.address().port}/forbidden.png` }); return response.end(); }
  if (request.url === "/manifest.json") return send(200, "application/manifest+json", JSON.stringify({ icons: [{ src: "icon.png", sizes: "96x96" }] }));
  if (request.url === "/bad-manifest.json") return send(200, "application/json", '{"PRIVATE_MANIFEST_CONTENT"');
  return send(404, "text/plain", "Not found");
});
let browser;
try {
  await listen(server);
  browser = await chromium.launch({ headless: true, chromiumSandbox: true });
  const page = await browser.newPage();
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.goto(`${base}/page`);
  const run = async (head, timeoutMs = 8000) => {
    await page.setContent(`<!doctype html><html><head>${head}</head><body>Icon fixture</body></html>`);
    const result = await collectFaviconEvidence({ page, outputDirectory: directory, timeoutMs });
    const checks = faviconChecks(result);
    assert.ok(checks.every((check) => check.status !== "fail"), "No icon issue should become an automatic launch blocker.");
    return { result, status: (id) => checks.find((check) => check.id === id)?.status };
  };
  const tag = (href, extra = "") => `<link rel="icon" href="${href}" ${extra}>`;
  const valid = await run(tag("/icon.png", 'type="image/png" sizes="96x96"'));
  assert.equal(valid.status("favicon-load"), "pass");
  assert.equal(valid.status("favicon-dimensions"), "pass");
  const preview = await readFile(path.join(directory, valid.result.icons[0].preview));
  assert.deepEqual([...preview.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(!requests.has("/favicon.ico"), "A declared icon must not require the root fallback.");

  for (const url of ["/missing.png", "/fake.png", "/corrupt.png", "/huge.png", "/streamed.png", "/loop.png", "/outside.png", "data:image/png;base64,AA==", ""]) {
    const test = await run(tag(url));
    assert.equal(test.status("favicon-load"), "warning", url);
    assert.ok(!test.result.icons[0].preview, `${url} must not produce a misleading preview.`);
  }
  assert.ok(!requests.has("/forbidden.png"), "Redirects outside the authorized origin must not be followed.");
  const fallback = await run("");
  assert.equal(fallback.status("favicon-load"), "pass");
  assert.equal(fallback.status("favicon-declaration"), "warning");
  assert.equal((await run(tag(""))).status("favicon-declaration"), "warning", "An empty href is not a usable head declaration.");
  for (const [href, extra] of [["/rectangle.svg", ""], ["/small.svg", ""], ["/icon.png", 'sizes="32x32"'], ["/icon.png", 'type="image/jpeg"']]) {
    assert.equal((await run(tag(href, extra))).status("favicon-dimensions"), "warning");
  }
  const redirected = await run(tag("/redirect.png"));
  assert.equal(redirected.status("favicon-load"), "pass");
  const icoResult = await run(tag("/icon.ico", 'sizes="96x96" type="image/vnd.microsoft.icon"'));
  assert.equal(icoResult.status("favicon-dimensions"), "pass");
  assert.deepEqual(icoResult.result.icons[0].availableSizes, [{ width: 96, height: 96 }]);
  const optional = await run(`${tag("/icon.png")}<link rel="apple-touch-icon" href="/icon.png"><link rel="manifest" href="/manifest.json">`);
  assert.equal(optional.status("favicon-app-icons"), "pass");
  assert.equal(optional.result.icons.filter((icon) => icon.kind === "app").length, 1);
  assert.equal((await run(`${tag("/icon.png")}<link rel="apple-touch-icon" href="/missing.png">`)).status("favicon-app-icons"), "warning");
  const invalidManifest = await run(`${tag("/icon.png")}<link rel="manifest" href="/bad-manifest.json">`);
  assert.equal(invalidManifest.status("favicon-app-icons"), "warning");
  assert.ok(!JSON.stringify(invalidManifest.result).includes("PRIVATE_MANIFEST_CONTENT"));
  const redacted = await run(tag("/icon.png?token=PRIVATE_TOKEN"));
  assert.ok(!JSON.stringify(redacted.result).includes("PRIVATE_TOKEN"));
  const limited = await run(Array.from({ length: 10 }, (_, index) => tag(`/icon.png?v=${index}`)).join(""));
  assert.equal(limited.result.icons.length, FAVICON_REVIEW.maximumIcons);
  assert.equal(limited.result.skippedByLimit, 4);
  assert.equal(limited.status("favicon-load"), "warning");
  const active = await run(tag("/active.svg"));
  assert.ok(active.result.icons[0].preview);
  assert.ok(!requests.has("/script-ran") && !requests.has("/external-image.png"), "Image decoding must not execute SVG scripts or load nested resources.");
  const started = Date.now();
  assert.equal((await run(tag("/slow.png"), 250)).status("favicon-load"), "warning");
  assert.ok(Date.now() - started < 3000, "Slow assets must respect the shared time budget.");
  const external = await run(tag(`http://localhost:${server.address().port}/forbidden.png`));
  assert.equal(external.status("favicon-load"), "warning");
  assert.ok(!requests.has("/forbidden.png"));
  const insecure = structuredClone(valid.result);
  insecure.pageUrl = "https://example.invalid/";
  assert.equal(faviconChecks(insecure).find((check) => check.id === "favicon-urls").status, "warning");
  insecure.icons[0].url = "https://example.invalid/icon.png";
  insecure.icons[0].finalUrl = "http://example.invalid/icon.png";
  assert.equal(faviconChecks(insecure).find((check) => check.id === "favicon-urls").status, "warning");
  console.log("Favicon tests passed: images/previews, fallback, HTML/corrupt/missing responses, dimensions, metadata, optional icons, redirects, privacy, SVG isolation, and byte/time/count limits.");
} finally {
  await browser?.close();
  await closeFixture(server, directory);
}
