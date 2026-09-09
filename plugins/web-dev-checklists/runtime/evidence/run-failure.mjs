import path from "node:path";
import { AUDIT_FORM_FACTOR, AUDIT_VIEWPORT } from "../config/runtime-config.mjs";
import { collectArtifacts, createEvidence, writeJson } from "./package.mjs";
import { truncate } from "./text.mjs";

export function emptyRunSummary(options, startedAt = new Date().toISOString()) {
  return {
    startedAt, completedAt: new Date().toISOString(), requestedUrl: options.url,
    browser: { name: "Not started", sandboxed: false, formFactor: AUDIT_FORM_FACTOR, viewport: { ...AUDIT_VIEWPORT } },
    page: { finalUrl: options.url, httpStatus: null, title: null, language: null, structure: {}, browserErrors: { consoleErrorCount: 0, pageErrorCount: 0, detailsFile: null } },
    axe: { status: "not-run" }, lighthouse: { status: "not-run" },
    launch: { status: "not-run" }, security: { status: "not-run" }, seo: { status: "not-run" }
  };
}

export async function recordRunFailure(options, summary, stage, error) {
  const failure = {
    stage,
    errorName: error?.name ?? "Error",
    code: error?.code ?? null,
    message: `The runner could not complete the ${stage} stage. This is incomplete evidence, not a confirmed website defect.`
  };
  if (options.includeErrorDetails) failure.details = truncate(String(error?.message ?? error), 1000);
  summary.runFailure = failure;
  summary.completedAt = new Date().toISOString();
  await writeJson(path.join(options.outputDirectory, "run-failure.json"), failure);
  await writeJson(path.join(options.outputDirectory, "summary.json"), summary);
  return summary;
}

export async function buildFailureEvidence(profile, summary, outputDirectory) {
  const artifacts = await collectArtifacts(outputDirectory, [
    ["summary.json", "Run summary, including the failed stage"],
    ["run-failure.json", "Runner failure; detailed error text is opt-in"],
    ["page.png", "Screenshot captured before the run stopped"],
    ["axe-results.json", "Partial run: collected axe evidence"],
    ["accessibility-report.html", "Partial run: collected axe report"],
    ["security-results.json", "Partial run: collected security observations"],
    ["seo-results.json", "Partial run: collected SEO observations"],
    ["launch-results.json", "Partial run: collected launch observations"],
    ["lighthouse-report.json", "Partial run: collected Lighthouse evidence"],
    ["lighthouse-report.html", "Partial run: collected Lighthouse report"],
    ["browser-errors.json", "Opt-in browser error details"]
  ]);
  return createEvidence(profile, summary, {
    checks: [{ id: "runner-completion", title: "Runner completes the requested review", status: "not-checked", method: "combined", evidence: summary.runFailure, artifacts: ["run-failure.json", "summary.json"] }],
    artifacts,
    limitations: ["The run stopped before a complete review could be produced. No whole-site pass/fail or launch approval is established.", "The target URL is the requested URL unless navigation completed. Any partial artifacts must be reviewed in that context."]
  });
}
