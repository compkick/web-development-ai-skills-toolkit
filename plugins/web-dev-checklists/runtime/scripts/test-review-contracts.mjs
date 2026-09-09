import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProfile } from "../config/review-profiles.mjs";
import { buildCoverage } from "../evidence/package.mjs";
import { emptyRunSummary, buildFailureEvidence, recordRunFailure } from "../evidence/run-failure.mjs";
import { buildAccessibilityEvidence } from "../evaluators/accessibility.mjs";
import { buildSecurityEvidence } from "../evaluators/security.mjs";
import { buildPerformanceEvidence } from "../evaluators/performance.mjs";
import { buildTechnicalSeoEvidence } from "../evaluators/technical-seo.mjs";
import { buildLaunchEvidence } from "../evaluators/launch.mjs";
import { buildWebProjectAuditEvidence } from "../evaluators/web-project-audit.mjs";
import { validateEvidence, validateCoverage } from "../testing/schema-validation.mjs";
import { createFixtureDirectory, closeFixture, readJson, runCommand } from "../testing/fixture-harness.mjs";

const directory = await createFixtureDirectory("toolkit-contract-test-");
const options = { url: "https://example.invalid/", outputDirectory: directory };
const summary = emptyRunSummary(options);
const profiles = await Promise.all(["review-web-accessibility", "review-web-security", "review-web-performance", "review-technical-seo", "review-website-launch", "audit-web-project"].map(loadProfile));

try {
  // Exercise every evaluator's incomplete-collector path, not just its happy path.
  const components = {
    accessibility: await buildAccessibilityEvidence(profiles[0], summary, null, directory),
    security: await buildSecurityEvidence(profiles[1], summary, null, directory),
    performance: await buildPerformanceEvidence(profiles[2], summary, null, directory),
    seo: await buildTechnicalSeoEvidence(profiles[3], summary, null, null, directory),
    launch: await buildLaunchEvidence(profiles[4], summary, null, directory)
  };
  const audit = await buildWebProjectAuditEvidence(profiles[5], summary, components, directory);
  const outputs = [...Object.values(components), audit];
  for (let index = 0; index < outputs.length; index++) {
    const evidence = outputs[index];
    const profile = profiles[index];
    validateEvidence(evidence, profile.id);
    validateCoverage(buildCoverage(profile), profile.id);
    const ids = new Set(evidence.checks.map((check) => check.id));
    assert.equal(ids.size, evidence.checks.length, `${profile.id} emitted duplicate check IDs.`);
    for (const id of profile.coverage.flatMap((item) => item.evidenceCheckIds)) {
      assert.ok(ids.has(id), `${profile.id} maps ${id}, but its evaluator does not emit it.`);
    }
  }

  for (const change of [
    (value) => { value.run.browser.unexpected = true; },
    (value) => { value.run.browser.viewport.width = 0; },
    (value) => { value.run.startedAt = "not-a-date"; },
    (value) => { delete value.profile.id; },
    (value) => { value.checks[0].status = "partial"; },
    (value) => { value.checks[0].evidence = null; }
  ]) {
    const invalid = structuredClone(outputs[0]);
    change(invalid);
    assert.throws(() => validateEvidence(invalid), /violates its JSON schema/);
  }
  const invalidCoverage = buildCoverage(profiles[0]);
  invalidCoverage.items = structuredClone(invalidCoverage.items);
  invalidCoverage.items[0].automation = "automatic";
  assert.throws(() => validateCoverage(invalidCoverage), /violates its JSON schema/);

  await recordRunFailure(options, summary, "browser-start", new Error("PRIVATE_ERROR_TEXT"));
  assert.ok(!JSON.stringify(await readJson(path.join(directory, "run-failure.json"))).includes("PRIVATE_ERROR_TEXT"));
  for (const profile of profiles) validateEvidence(await buildFailureEvidence(profile, summary, directory), profile.id);
  await recordRunFailure({ ...options, includeErrorDetails: true }, summary, "navigation", new Error("OPT_IN_ERROR_TEXT"));
  assert.ok((await readJson(path.join(directory, "run-failure.json"))).details.includes("OPT_IN_ERROR_TEXT"));

  // No browser or network is used: the deliberately empty cache fails before startup.
  const reviewScript = fileURLToPath(new URL("./review.mjs", import.meta.url));
  for (const profile of profiles) {
    const output = path.join(directory, profile.id);
    await runCommand(process.execPath, [reviewScript, "--profile", profile.id, "--url", options.url, "--output", output], directory, {
      expectedExitCode: 1, env: { ...process.env, WEB_DEV_CHECKLISTS_CACHE: path.join(directory, "empty-cache") }
    });
    const failure = await readJson(path.join(output, "evidence.json"));
    assert.ok(failure.checks.every((check) => check.status === "not-checked"));
    assert.equal(failure.checks[0].evidence.stage, "runtime-readiness");
    await readJson(path.join(output, "coverage.json"));
    const before = JSON.stringify(failure);
    await runCommand(process.execPath, [reviewScript, "--profile", profile.id, "--url", options.url, "--output", output], directory, { expectedExitCode: 1 });
    assert.equal(JSON.stringify(await readJson(path.join(output, "evidence.json"))), before, "A retry must not overwrite earlier evidence.");
  }
  console.log("Review contract tests passed: all six schemas, coverage IDs, invalid data, incomplete collectors, failed CLI runs, privacy, and overwrite protection.");
} finally {
  await closeFixture(null, directory);
}
