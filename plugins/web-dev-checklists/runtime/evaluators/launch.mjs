import { createEvidence, collectArtifacts } from "../evidence/package.mjs";
import { browserErrorsCheck } from "./browser.mjs";
import { assessHttpRedirect } from "../collectors/http-redirect.mjs";

export async function buildLaunchEvidence(profileToUse, summary, launchResult, outputDirectory) {
  const checks = [];
  const launchArtifacts = ["launch-results.json"];
  const addCheck = (id, title, status, method, evidenceToAdd, artifacts = launchArtifacts) => checks.push({ id, title, status, method, evidence: evidenceToAdd, artifacts });
  const finalUrl = new URL(summary.page.finalUrl);
  const httpStatus = summary.page.httpStatus;

  addCheck("launch-collection", "Runner completes the bounded homepage launch preflight", launchResult ? "pass" : "not-checked", "browser", { checkedLinks: launchResult?.linkProbe?.tested ?? 0, error: summary.launch?.error ?? null, runtimeStatus: summary.launch?.status ?? "missing" }, launchResult ? launchArtifacts : ["summary.json"]);
  addCheck("page-http-status", "Homepage returns a successful HTTP response", typeof httpStatus !== "number" ? "warning" : httpStatus >= 200 && httpStatus < 300 ? "pass" : "fail", "browser", { finalUrl: summary.page.finalUrl, httpStatus }, ["summary.json"]);
  addCheck("https-url", "Homepage uses HTTPS", finalUrl.protocol === "https:" ? "pass" : "fail", "browser", { finalProtocol: finalUrl.protocol, finalUrl: finalUrl.href }, ["summary.json"]);

  const redirectAssessment = assessHttpRedirect(launchResult?.httpRedirect);
  addCheck("http-to-https-redirect", "Site redirects plain HTTP to HTTPS", redirectAssessment.status, "http", { ...(launchResult?.httpRedirect ?? { attempted: false }), assessment: redirectAssessment.reason });

  const regions = launchResult?.document?.regions;
  const missingRegions = !regions ? [] : [
    regions.headerCount === 0 ? "header" : null,
    regions.navigationCount === 0 ? "navigation" : null,
    regions.mainCount === 0 ? "main" : null,
    regions.footerCount === 0 ? "footer" : null
  ].filter(Boolean);
  addCheck("homepage-structure", "Homepage renders its header, navigation, main content, and footer", !regions ? "not-checked" : missingRegions.length === 0 ? "pass" : "warning", "browser", { missingRegions, regions: regions ?? null });

  addCheck("homepage-content-summary", "Homepage content is available for a high-level visual review", launchResult ? "informational" : "not-checked", "browser", { h1Text: launchResult?.document?.content?.h1Text ?? [], title: launchResult?.document?.content?.title ?? summary.page.title ?? "" }, ["summary.json", "page.png"]);

  const issues = launchResult?.document?.issues ?? [];
  const probeResults = launchResult?.linkProbe?.results ?? [];
  const visibleCounts = regions?.visibleLinkCounts ?? {};
  const addRegionCheck = (id, title, regionNames, visibleLinkCount, emptyStatus) => {
    const regionIssues = issues.filter((issue) => regionNames.includes(issue.region));
    const regionResults = probeResults.filter((result) => (result.regions ?? [result.region]).some((region) => regionNames.includes(region)));
    const confirmedBroken = regionResults.filter((result) => result.outcome === "fail");
    const inconclusive = regionResults.filter((result) => result.outcome === "warning");
    const unsetOrInvalid = launchResult?.document?.issueCountsByRegion
      ? regionNames.reduce((total, region) => total + (launchResult.document.issueCountsByRegion[region] ?? 0), 0)
      : regionIssues.length;
    const skippedByLimit = regionNames.reduce((total, region) => total + (launchResult?.linkProbe?.byRegion?.[region]?.skippedByLimit ?? 0), 0);
    const skippedByCollectorLimit = regionNames.reduce((total, region) => total + (launchResult?.document?.testCandidatesTruncatedByRegion?.[region] ?? 0), 0);
    let status = "pass";

    if (!launchResult) status = "not-checked";
    else if (visibleLinkCount === 0) status = emptyStatus;
    else if (confirmedBroken.length > 0) status = "fail";
    else if (unsetOrInvalid > 0 || inconclusive.length > 0) status = "warning";
    else if (skippedByLimit > 0 || skippedByCollectorLimit > 0) status = "not-checked";
    else if (regionResults.length === 0) status = "informational";

    addCheck(id, title, status, "http", {
      confirmedBroken: confirmedBroken.length,
      inconclusive: inconclusive.length,
      issues: regionIssues,
      linkResultsRequiringAttention: [...confirmedBroken, ...inconclusive],
      scope: "HTTP results cover sampled same-host destinations only; external destinations are not requested.",
      skippedByCollectorLimit,
      skippedByLimit,
      testedDestinations: regionResults.length,
      unsetOrInvalid,
      visibleLinks: visibleLinkCount
    });
  };

  addRegionCheck("homepage-navigation-links", "Homepage navigation links have usable destinations", ["navigation", "header"], (visibleCounts.navigation ?? 0) + (visibleCounts.header ?? 0), "fail");
  addRegionCheck("homepage-footer-links", "Homepage footer links have usable destinations", ["footer"], visibleCounts.footer ?? 0, "warning");
  addRegionCheck("homepage-content-links", "Homepage content links have usable destinations", ["main", "other"], (visibleCounts.main ?? 0) + (visibleCounts.other ?? 0), "informational");

  const linkProbe = launchResult?.linkProbe;
  const inventory = launchResult?.document?.inventory;
  const truncatedCandidates = launchResult?.document?.testCandidatesTruncated ?? 0;
  addCheck("homepage-link-check-coverage", "Runner checks a bounded same-host sample of homepage links", !linkProbe ? "not-checked" : linkProbe.skippedByLimit > 0 || truncatedCandidates > 0 ? "informational" : "pass", "http", {
    candidateCount: linkProbe?.candidateCount ?? 0,
    confirmedBrokenDestinations: linkProbe?.failed ?? 0,
    externalLinksNotRequested: inventory?.externalHttp ?? 0,
    limit: linkProbe?.limit ?? null,
    skippedByCollectorLimit: truncatedCandidates,
    skippedByProbeLimit: linkProbe?.skippedByLimit ?? 0,
    tested: linkProbe?.tested ?? 0
  });

  addCheck("indexing-allowed", "Homepage does not declare a noindex directive", !launchResult ? "not-checked" : launchResult.indexing.noindex ? "fail" : "pass", "browser", { metaRobots: launchResult?.document?.metaRobots ?? [], noindex: launchResult?.indexing?.noindex ?? null, xRobotsTag: launchResult?.indexing?.xRobotsTag ?? null });

  checks.push(browserErrorsCheck(summary, "Homepage renders without browser console or page errors"));

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered homepage screenshot"],
    ["launch-results.json", "Homepage structure, link, indexing, and redirect observations"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = await collectArtifacts(outputDirectory, artifactDefinitions);

  const limitations = [
    "This is a high-level pre-launch review of one supplied homepage, not a whole-site audit or replacement for specialist accessibility, security, performance, SEO, privacy, or application testing.",
    "The runner checks at most 50 unique same-host HTTP(S) links found on the rendered homepage, prioritizing navigation, header, footer, and then content links; it does not request external destinations.",
    "Unset or JavaScript link destinations can represent intentional controls and require human review before being treated as broken.",
    "The runner does not submit forms, send email, authenticate, change content, deploy releases, inspect backups, access monitoring, or perform DNS, cache, search-index, analytics, consent, or rollback operations.",
    "The final go/no-go recommendation requires the exact release scope, current specialist-review status, known issues, owners, rollback readiness, and applicable human confirmations."
  ];

  if (summary.launch?.status !== "completed") limitations.push(`Launch collection was not completed: ${summary.launch?.error ?? summary.launch?.status ?? "missing"}`);

  return createEvidence(profileToUse, summary, {
    checks,
    artifacts,
    limitations
  });
}
