import assert from "node:assert/strict";
import http from "node:http";
import { fetchBoundedText } from "../collectors/http-text.mjs";
import { AUDIT_USER_AGENT } from "../config/runtime-config.mjs";
import { createFixtureDirectory, closeFixture, listen } from "../testing/fixture-harness.mjs";

const directory = await createFixtureDirectory("toolkit-http-text-test-");
let outsideRequests = 0;
const outside = http.createServer((request, response) => { outsideRequests++; response.end("Unexpected request"); });
const outsideAddress = await listen(outside);
const server = http.createServer((request, response) => {
  assert.equal(request.headers["user-agent"], AUDIT_USER_AGENT);
  if (request.url === "/redirect") { response.writeHead(302, { Location: "/text" }); return response.end(); }
  if (request.url === "/loop") { response.writeHead(302, { Location: "/loop" }); return response.end(); }
  if (request.url === "/outside") { response.writeHead(302, { Location: `http://127.0.0.1:${outsideAddress.port}/` }); return response.end(); }
  if (request.url === "/timeout") return;
  if (request.url === "/declared") response.setHeader("Content-Length", "10");
  if (request.url === "/empty") { response.writeHead(204); return response.end(); }
  response.end("0123456789");
});
try {
  const address = await listen(server);
  const url = (route) => new URL(route, `http://127.0.0.1:${address.port}`);
  const options = { timeoutMs: 1000, maximumBytes: 5, resourceName: "fixture" };
  const preview = await fetchBoundedText(url("/redirect"), { ...options, overflow: "truncate" });
  assert.equal(preview.text, "01234");
  assert.equal(preview.truncated, true);
  assert.equal(preview.finalUrl.pathname, "/text");
  for (const route of ["/text", "/declared"]) await assert.rejects(fetchBoundedText(url(route), options), /exceeds 5 bytes/);
  const exact = await fetchBoundedText(url("/text"), { ...options, maximumBytes: 10 });
  assert.equal(exact.text, "0123456789");
  assert.equal(exact.truncated, false);
  assert.equal((await fetchBoundedText(url("/empty"), options)).text, "");
  await assert.rejects(fetchBoundedText(url("/loop"), options), /more than 5 redirects/);
  await assert.rejects(fetchBoundedText(url("/outside"), options), /outside the authorized origin/);
  assert.equal(outsideRequests, 0);
  await assert.rejects(fetchBoundedText(url("/timeout"), { ...options, timeoutMs: 100 }));
  console.log("Bounded HTTP text tests passed: redirects, origin boundary, byte limits, overflow policies, timeouts, and user agent.");
} finally {
  const closed = new Promise((resolve) => outside.close(resolve));
  outside.closeAllConnections();
  await closed;
  await closeFixture(server, directory);
}
