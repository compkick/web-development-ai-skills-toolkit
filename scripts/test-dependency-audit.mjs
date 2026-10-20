import assert from "node:assert/strict";
import { assessAudit, globException } from "./check-dependency-audit.mjs";

const advisory = { url: globException.url, severity: "high" };
const report = { auditReportVersion: 2, vulnerabilities: {
  braces: { via: [advisory], nodes: ["node_modules/braces"] },
  micromatch: { via: ["braces"] },
  linter: { via: ["micromatch", "braces"] }
} };
const lock = { packages: { "node_modules/braces": { version: "3.0.3", dev: true } } };
const options = { allowDevelopmentException: true, now: Date.parse("2026-10-19T00:00:00Z") };
assert.equal(assessAudit(report, lock, options).accepted.length, 1, "Parent dependency chains must not duplicate an accepted advisory.");
assert.equal(assessAudit(report, lock, options).blocking.length, 0);
assert.equal(assessAudit(report, lock, { ...options, allowDevelopmentException: false }).blocking.length, 1, "Runtime findings never receive the development exception.");
assert.equal(assessAudit(report, lock, { ...options, now: Date.parse("2027-01-17T00:00:00Z") }).blocking.length, 1, "An expired exception must fail.");
for (const change of [
  (value) => { value.packages["node_modules/braces"].version = "3.0.4"; },
  (value) => { value.packages["node_modules/braces"].dev = false; },
  (value) => { delete value.packages["node_modules/braces"]; }
]) {
  const changed = structuredClone(lock);
  change(changed);
  assert.equal(assessAudit(report, changed, options).blocking.length, 1);
}
const anotherAdvisory = structuredClone(report);
anotherAdvisory.vulnerabilities.braces.via.push({ url: "https://example.invalid/new-advisory", severity: "critical" });
assert.equal(assessAudit(anotherAdvisory, lock, options).blocking.length, 1, "New advisories on the same package must not be ignored.");
const critical = structuredClone(report);
critical.vulnerabilities.braces.via[0].severity = "critical";
assert.equal(assessAudit(critical, lock, options).blocking.length, 1);
assert.throws(() => assessAudit({ error: {} }, lock), /Missing or unsupported/);
assert.throws(() => assessAudit({ ...report, vulnerabilities: { unknown: { via: ["missing"] } } }, lock), /Unresolved/);
assert.throws(() => assessAudit({ ...report, vulnerabilities: { cycle: { via: ["cycle"] } } }, lock), /Unresolved/);
assert.deepEqual(assessAudit({ auditReportVersion: 2, vulnerabilities: {} }, lock), { accepted: [], blocking: [], observations: [] });
console.log("Dependency audit policy tests passed: exact advisory/version/dev scope, runtime exclusion, expiry, new findings, and malformed reports.");
