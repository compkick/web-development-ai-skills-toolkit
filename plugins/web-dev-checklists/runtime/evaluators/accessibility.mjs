import { createEvidence, collectArtifacts, exists } from "../evidence/package.mjs";
import path from "node:path";
import { browserErrorsCheck } from "./browser.mjs";
import { buildAxeReviewChecks } from "../reporting/review-observations.mjs";

export async function buildAccessibilityEvidence(profileToUse, summary, axeResult, outputDirectory) {
  const checks = [];
  const axeArtifacts = ["axe-results.json"];

  if (await exists(path.join(outputDirectory, "accessibility-report.html"))) axeArtifacts.push("accessibility-report.html");

  const httpStatus = summary.page.httpStatus;
  const normalizedTitle = summary.page.title?.trim() ?? "";
  const normalizedLanguage = summary.page.language?.trim() ?? "";

  checks.push({
    id: "page-http-status",
    title: "The target returned a successful HTTP response",
    status: typeof httpStatus !== "number" ? "warning" : httpStatus >= 200 && httpStatus < 400 ? "pass" : "fail",
    method: "browser",
    evidence: { finalUrl: summary.page.finalUrl, httpStatus },
    artifacts: ["summary.json"]
  });
  checks.push({
    id: "document-title",
    title: "The rendered document has a title",
    status: normalizedTitle.length > 0 ? "pass" : "fail",
    method: "browser",
    evidence: { title: normalizedTitle || null },
    artifacts: ["summary.json"]
  });
  checks.push({
    id: "document-language",
    title: "The rendered document declares a language",
    status: normalizedLanguage.length > 0 ? "pass" : "fail",
    method: "browser",
    evidence: { language: normalizedLanguage || null },
    artifacts: ["summary.json"]
  });
  checks.push({
    id: "document-structure",
    title: "Rendered heading and landmark inventory",
    status: "informational",
    method: "browser",
    evidence: summary.page.structure,
    artifacts: ["summary.json", "page.png"]
  });

  checks.push(...buildAxeReviewChecks(summary.axe, axeResult, axeArtifacts));

  checks.push({
    id: "lighthouse-accessibility",
    title: "Lighthouse accessibility evidence",
    status: summary.lighthouse.status === "completed" ? "informational" : "not-checked",
    method: "lighthouse",
    evidence: summary.lighthouse.status === "completed" ? { score: summary.lighthouse.scores.accessibility } : { error: summary.lighthouse.error ?? null, runtimeStatus: summary.lighthouse.status },
    artifacts: summary.lighthouse.status === "completed" ? ["lighthouse-report.json", "lighthouse-report.html"] : ["summary.json"]
  });

  checks.push(browserErrorsCheck(summary, "Browser console and page error counts"));

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["axe-results.json", "Reduced axe rule evidence"],
    ["accessibility-report.html", "Human-readable axe report with bounded element screenshots"],
    ["lighthouse-report.json", "Machine-readable Lighthouse report"],
    ["lighthouse-report.html", "Human-readable Lighthouse report"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = await collectArtifacts(outputDirectory, artifactDefinitions);

  const limitations = [
    "This package covers one URL and does not prove whole-site or whole-application accessibility.",
    "Automated results do not replace keyboard, zoom, reflow, content-quality, workflow, or assistive-technology review.",
    "Lighthouse and axe overlap; their results must not be counted as independent proof of conformance.",
    "No screen reader was used by this deterministic runner."
  ];

  if (summary.axe.status !== "completed") limitations.push(`axe evidence was not completed: ${summary.axe.error ?? summary.axe.status}`);
  if (summary.lighthouse.status !== "completed") limitations.push(`Lighthouse evidence was not completed: ${summary.lighthouse.error ?? summary.lighthouse.status}`);

  return createEvidence(profileToUse, summary, {
    checks,
    artifacts,
    limitations
  });
}
