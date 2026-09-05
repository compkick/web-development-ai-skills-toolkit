import assert from "node:assert/strict";
import { assessContentSecurityPolicy, assessPublicCookies, buildAxeReviewChecks } from "../reporting/review-observations.mjs";

const artifacts = ["axe-results.json", "axe-report.html"];
const rule = (id, count) => ({ id, help: id, description: id, helpUrl: "https://example.invalid/rule", impact: "serious", tags: [], nodes: Array.from({ length: count }, () => ({})) });
const axeResult = {
  passes: 49,
  violations: [rule("color-contrast", 5), rule("nested-interactive", 1), rule("region", 2)],
  incomplete: [rule("color-contrast", 42), rule("video-caption", 3)]
};
const checks = buildAxeReviewChecks({ status: "completed" }, axeResult, artifacts);
assert.equal(checks.find((check) => check.id === "automated-axe-scan").status, "pass");
assert.equal(checks.filter((check) => check.status === "fail").length, 3, "Scan completion must not double-count violations.");
const manual = checks.find((check) => check.id === "axe-manual-review");
assert.equal(manual.status, "warning");
assert.equal(manual.evidence.ruleCount, 2);
assert.equal(manual.evidence.affectedNodes, 45);
assert.deepEqual(manual.evidence.rules.map((entry) => entry.ruleId), ["color-contrast", "video-caption"]);
assert.deepEqual(manual.artifacts, artifacts);
assert.equal(new Set(checks.map((check) => check.id)).size, checks.length, "A rule can both fail and need manual review without duplicate check IDs.");
const incompleteOnly = buildAxeReviewChecks({ status: "completed" }, { ...axeResult, violations: [] }, artifacts);
assert.equal(incompleteOnly.filter((check) => check.status === "fail").length, 0);
assert.equal(incompleteOnly.find((check) => check.id === "axe-manual-review").status, "warning");
assert.ok(buildAxeReviewChecks({ status: "completed" }, { passes: 2, violations: [], incomplete: [] }, artifacts).every((check) => check.status === "pass"));
for (const runtimeStatus of [{ status: "failed", error: "Fixture failure" }, { status: "skipped" }, { status: "completed" }]) {
  assert.ok(buildAxeReviewChecks(runtimeStatus, null, artifacts).every((check) => check.status === "not-checked"), "Unavailable axe results cannot pass.");
}

const framingOnly = assessContentSecurityPolicy("frame-ancestors https://app.storyblok.com");
assert.equal(framingOnly.status, "warning");
assert.equal(framingOnly.scriptElementPolicyPresent, false);
assert.equal(framingOnly.scriptAttributePolicyPresent, false);
for (const policy of ["default-src 'self'; frame-ancestors 'none'", "script-src 'self'", "script-src-elem 'self'; script-src-attr 'none'", "SCRIPT-SRC 'self'", "default-src 'none', frame-ancestors https://app.storyblok.com"]) {
  assert.equal(assessContentSecurityPolicy(policy).status, "pass", `Expected a script restriction or fallback in ${policy}.`);
}
for (const policy of [null, "", "script-src-elem 'self'", "script-src-attr 'none'", "default-src 'self'; script-src 'unsafe-eval'", "script-src 'self' 'unsafe-inline'"]) {
  assert.equal(assessContentSecurityPolicy(policy).status, "warning");
}

const analyticsCookie = { name: "_ga_fixture", secure: false, httpOnly: false, sameSite: "Lax" };
const browserCookies = { issued: [], accepted: [analyticsCookie] };
assert.equal(assessPublicCookies(browserCookies, "https:").status, "warning", "Browser-observed cookies must be assessed even with no Set-Cookie response.");
assert.deepEqual(assessPublicCookies(browserCookies, "https:").concerns, ["_ga_fixture: missing Secure"]);
assert.equal(assessPublicCookies({ issued: [analyticsCookie], accepted: [analyticsCookie] }, "https:").concerns.length, 1, "The same issue in both observations must appear once.");
assert.equal(assessPublicCookies({ issued: [], accepted: [{ ...analyticsCookie, secure: true }] }, "https:").status, "pass", "JavaScript-readable cookies must not automatically fail HttpOnly.");
assert.equal(assessPublicCookies({ issued: [analyticsCookie], accepted: [] }, "https:").status, "warning", "Response cookies still need review when not accepted by the browser.");
assert.equal(assessPublicCookies({ issued: [], accepted: [{ ...analyticsCookie, sameSite: "None" }] }, "http:").status, "warning");
assert.equal(assessPublicCookies(browserCookies, "http:").status, "pass");
assert.equal(assessPublicCookies({ issued: [], accepted: [] }, "https:").status, "informational");
assert.equal(assessPublicCookies(undefined, "https:").status, "informational");

console.log("Review observation tests passed: axe completion, violation counts, manual review, CSP script fallbacks, and response/browser cookie flags.");
