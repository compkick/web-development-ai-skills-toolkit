import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { escapeHtml, safeRelativePath, safeExternalUrl } from "../reporting/html-common.mjs";
import { writeAxeHtmlReport } from "../reporting/axe-report.mjs";
import { writeSecurityHtmlReport } from "../reporting/security-report.mjs";
import { writePerformanceHtmlReport } from "../reporting/performance-report.mjs";
import { writeTechnicalSeoHtmlReport } from "../reporting/technical-seo-report.mjs";
import { writeLaunchHtmlReport } from "../reporting/launch-report.mjs";
import { writeWebProjectAuditHtmlReport } from "../reporting/web-project-audit-report.mjs";
import { createFixtureDirectory, closeFixture } from "../testing/fixture-harness.mjs";

const directory = await createFixtureDirectory("toolkit-html-test-");
const unsafe = '<script>alert("unsafe")</script>';
const evidence = {
  profile: { id: "fixture", version: "1.0.0", standard: unsafe },
  target: { finalUrl: "javascript:alert(1)" },
  run: { completedAt: "2026-09-05T00:00:00Z", browser: { name: "Fixture", sandboxed: true } },
  checks: [{ id: "fixture-check", title: unsafe, status: "warning", method: "browser", evidence: { nested: [null, {}, unsafe] }, artifacts: ["../outside.json", "data:text/html,unsafe"] }],
  artifacts: [{ path: "page.png", purpose: "Screenshot" }, { path: "../outside.json", purpose: unsafe }],
  limitations: [unsafe]
};
const coverage = { items: [{ section: unsafe, checklistItem: unsafe, note: unsafe, automation: "partial" }] };
try {
  assert.equal(safeRelativePath("../secret"), null);
  assert.equal(safeRelativePath("C:\\secret"), null);
  assert.equal(safeRelativePath("//example.invalid/secret"), null);
  assert.equal(safeRelativePath("axe-elements/image 1.png"), "axe-elements/image%201.png");
  assert.equal(safeExternalUrl("javascript:alert(1)"), "#");
  assert.ok(!escapeHtml(unsafe).includes("<script>"));

  const writers = [writeSecurityHtmlReport, writePerformanceHtmlReport, writeTechnicalSeoHtmlReport, writeLaunchHtmlReport, writeWebProjectAuditHtmlReport];
  for (const [index, write] of writers.entries()) {
    const file = path.join(directory, `${index}.html`);
    await write(evidence, coverage, file);
    const html = await readFile(file, "utf8");
    assert.ok(html.includes("Partially automated"));
    assert.ok(html.includes('class="reviewed-page"'));
    assert.ok(html.includes('default-src \'none\''));
    assert.ok(!html.includes(unsafe) && !/<script(?:\s|>)/i.test(html));
    assert.ok(!html.includes('href="../') && !html.includes('href="javascript:'));
    if (write === writeLaunchHtmlReport) assert.ok(html.includes("Automated preflight: Incomplete"));
    if (write === writeWebProjectAuditHtmlReport) assert.ok(html.includes("Public evidence: Incomplete evidence"));
  }
  const axePath = path.join(directory, "axe.html");
  await writeAxeHtmlReport({ url: "javascript:alert(1)", timestamp: "2026-09-05T00:00:00Z", violations: [{ id: "fixture", help: unsafe, description: unsafe, impact: "serious", helpUrl: "javascript:alert(1)", nodes: [{ target: [unsafe], failureSummary: unsafe }] }], incomplete: [], passes: 0 }, axePath);
  const axe = await readFile(axePath, "utf8");
  assert.ok(axe.includes("Confirmed violations") && axe.includes("Needs manual review"));
  assert.ok(!axe.includes(unsafe) && !axe.includes('href="javascript:'));
  console.log("Report layout tests passed: all six renderers, escaping, safe links, coverage, screenshots, and incomplete verdicts.");
} finally {
  await closeFixture(null, directory);
}
