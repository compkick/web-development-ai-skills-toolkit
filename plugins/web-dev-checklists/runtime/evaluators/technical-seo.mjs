import { createEvidence, collectArtifacts } from "../evidence/package.mjs";
import { browserErrorsCheck } from "./browser.mjs";
import { lighthouseAuditStatus, summarizeLighthouseAudit } from "./lighthouse.mjs";

export async function buildTechnicalSeoEvidence(profileToUse, summary, lighthouseResult, seoResult, outputDirectory) {
  const checks = [];
  const audits = lighthouseResult?.audits ?? {};
  const lighthouseArtifacts = lighthouseResult ? ["lighthouse-report.json", "lighthouse-report.html"] : ["summary.json"];
  const seoArtifacts = seoResult ? ["seo-results.json"] : ["summary.json"];
  const addCheck = (id, title, status, method, evidenceToAdd, artifacts = seoArtifacts) => checks.push({ id, title, status, method, evidence: evidenceToAdd, artifacts });
  const httpStatus = summary.page.httpStatus;
  const finalUrl = new URL(summary.page.finalUrl);
  const documentSeo = seoResult?.document ?? null;

  addCheck("page-http-status", "Site returns an HTTP 200 response", typeof httpStatus !== "number" ? "not-checked" : httpStatus === 200 ? "pass" : "fail", "browser", { finalUrl: summary.page.finalUrl, httpStatus }, ["summary.json"]);
  addCheck("seo-collection", "Runner completes bounded technical SEO evidence collection", seoResult ? "pass" : "not-checked", "browser", seoResult ? { runtimeStatus: "completed" } : { error: summary.seo?.error ?? null, runtimeStatus: summary.seo?.status ?? "missing" }, ["summary.json"]);

  const seoScore = lighthouseResult?.categories?.seo?.score;
  addCheck("lighthouse-seo-run", "Lighthouse completes a desktop SEO review", lighthouseResult ? "pass" : "not-checked", "lighthouse", lighthouseResult ? { formFactor: summary.lighthouse.formFactor, lighthouseVersion: lighthouseResult.lighthouseVersion, requestedUrl: lighthouseResult.requestedUrl } : { error: summary.lighthouse.error ?? null, runtimeStatus: summary.lighthouse.status }, lighthouseArtifacts);
  addCheck("lighthouse-seo-score", "Lighthouse reports a desktop SEO score", typeof seoScore === "number" ? "informational" : "not-checked", "lighthouse", { score: typeof seoScore === "number" ? Math.round(seoScore * 100) : null }, lighthouseArtifacts);

  const crawlabilityAudit = audits["is-crawlable"];
  const robotDirectives = [seoResult?.responseHeaders?.["x-robots-tag"], ...(documentSeo?.metaRobots ?? []).map((directive) => directive.content)].filter(Boolean);
  const hasNoIndex = robotDirectives.some((directive) => /(?:^|[,\s])(noindex|none)(?:$|[,\s])/i.test(directive));
  const indexingStatus = typeof crawlabilityAudit?.score === "number" ? crawlabilityAudit.score === 1 ? "pass" : "fail" : hasNoIndex ? "fail" : "not-checked";
  addCheck("indexing-allowed", "Site allows the reviewed public page to be indexed", indexingStatus, "lighthouse", { audit: summarizeLighthouseAudit(crawlabilityAudit), directives: robotDirectives, noIndexObserved: hasNoIndex }, [...new Set([...lighthouseArtifacts, ...seoArtifacts])]);

  const titles = documentSeo?.titles ?? [];
  addCheck("document-title", "Site provides one non-empty document title", !documentSeo ? "not-checked" : titles.length === 1 && titles[0].length > 0 ? "pass" : "fail", "browser", { audit: summarizeLighthouseAudit(audits["document-title"]), titles }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const descriptions = documentSeo?.metaDescriptions ?? [];
  addCheck("meta-description", "Site provides one useful meta-description candidate", !documentSeo ? "not-checked" : descriptions.length === 1 && descriptions[0].length > 0 ? "pass" : "warning", "browser", { audit: summarizeLighthouseAudit(audits["meta-description"]), descriptions }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const headings = documentSeo?.headings ?? null;
  addCheck("main-heading", "Site exposes a main page heading", !headings ? "not-checked" : headings.h1Count > 0 ? "pass" : "warning", "browser", headings ?? {}, seoArtifacts);

  const renderedContent = documentSeo?.content ?? null;
  addCheck("rendered-content", "Site exposes rendered text content without user interaction", !renderedContent ? "not-checked" : renderedContent.bodyTextLength === 0 ? "fail" : renderedContent.mainTextLength === 0 ? "warning" : "pass", "browser", renderedContent ?? {}, ["seo-results.json", "page.png"]);

  const canonicals = [...(documentSeo?.canonicalElements ?? []), ...(seoResult?.httpCanonicalElements ?? [])];
  const canonicalAudit = audits.canonical;
  let canonicalStatus = "not-checked";
  if (documentSeo) {
    if (canonicals.length !== 1) canonicalStatus = "warning";
    else if (!canonicals[0].resolvedUrl || !canonicals[0].absolute || canonicals[0].hasFragment) canonicalStatus = "warning";
    else if (typeof canonicalAudit?.score === "number" && canonicalAudit.score < 1) canonicalStatus = "warning";
    else canonicalStatus = "pass";
  }
  addCheck("canonical-declaration", "Site declares one valid absolute canonical URL", canonicalStatus, "browser", { audit: summarizeLighthouseAudit(canonicalAudit), canonicals, finalUrl: summary.page.finalUrl, selfReferential: canonicals.length === 1 && stripFragment(canonicals[0].resolvedUrl) === stripFragment(summary.page.finalUrl) }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const linkAudits = [audits["crawlable-anchors"], audits["link-text"]];
  addCheck("crawlable-links", "Site uses crawlable links with descriptive text on the reviewed page", documentSeo ? lighthouseAuditStatus(linkAudits) : "not-checked", "lighthouse", { audits: linkAudits.filter(Boolean).map(summarizeLighthouseAudit), inventory: documentSeo?.linkInventory ?? null }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const robotsAudit = audits["robots-txt"];
  let robotsStatus = "not-checked";
  if (seoResult?.robotsTxt) {
    if (typeof robotsAudit?.score === "number" && robotsAudit.score < 1) robotsStatus = "warning";
    else robotsStatus = seoResult.robotsTxt.found ? "pass" : "informational";
  }
  addCheck("robots-txt", "Site provides valid robots.txt instructions when the file is present", robotsStatus, "lighthouse", { audit: summarizeLighthouseAudit(robotsAudit), observation: seoResult?.robotsTxt ?? null }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const sitemapResults = seoResult?.sitemaps ?? [];
  const accessibleSitemap = sitemapResults.find((sitemap) => sitemap.status === 200 && new Set(["urlset", "sitemapindex"]).has(sitemap.rootType) && !sitemap.contentType?.toLowerCase().includes("text/html"));
  addCheck("sitemap-discovery", "Site exposes an accessible XML sitemap", !seoResult ? "not-checked" : accessibleSitemap ? "pass" : "warning", "http", { declaredByRobotsTxt: seoResult?.robotsTxt?.sitemapUrls ?? [], results: sitemapResults }, seoArtifacts);

  const structuredData = documentSeo?.structuredData ?? null;
  let structuredDataStatus = "not-checked";
  if (structuredData) {
    if (structuredData.jsonLdParseErrorCount > 0) structuredDataStatus = "warning";
    else if (structuredData.jsonLdBlockCount > 0) structuredDataStatus = "pass";
    else structuredDataStatus = "informational";
  }
  addCheck("structured-data", "Site provides syntactically readable structured data when markup is present", structuredDataStatus, "browser", { audit: summarizeLighthouseAudit(audits["structured-data"]), observation: structuredData }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  const alternateLanguages = documentSeo?.alternateLanguages ?? [];
  const hreflangAudit = audits.hreflang;
  const hreflangStatus = !documentSeo ? "not-checked" : alternateLanguages.length === 0 ? "informational" : typeof hreflangAudit?.score === "number" && hreflangAudit.score < 1 ? "warning" : "pass";
  addCheck("language-alternates", "Site declares valid language alternates when localized versions are present", hreflangStatus, "lighthouse", { alternates: alternateLanguages, audit: summarizeLighthouseAudit(hreflangAudit), htmlLanguage: documentSeo?.htmlLanguage ?? null }, [...new Set([...seoArtifacts, ...lighthouseArtifacts])]);

  addCheck("https-url", "Site resolves the reviewed page to HTTPS", finalUrl.protocol === "https:" ? "pass" : "fail", "browser", { finalProtocol: finalUrl.protocol, finalUrl: finalUrl.href }, ["summary.json"]);

  const redirectChain = seoResult?.redirectChain ?? [];
  const redirectHops = Math.max(0, redirectChain.length - 1);
  addCheck("redirect-chain", "Site reaches the final page without a long redirect chain", !seoResult || redirectChain.length === 0 ? "not-checked" : redirectHops <= 1 ? "pass" : "warning", "browser", { hops: redirectHops, redirects: redirectChain }, seoArtifacts);

  checks.push(browserErrorsCheck(summary, "Site renders without browser console or page errors"));

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["seo-results.json", "Reduced rendered metadata, robots.txt, sitemap, link, and redirect observations"],
    ["lighthouse-report.json", "Machine-readable Lighthouse report"],
    ["lighthouse-report.html", "Detailed human-readable Lighthouse report"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = await collectArtifacts(outputDirectory, artifactDefinitions);

  const limitations = [
    "This package covers one public URL and does not prove whole-site crawlability, indexability, metadata quality, or search performance.",
    "The runner inventories links on the reviewed page but does not fetch every link or perform an unbounded site crawl.",
    "robots.txt and sitemap collection is bounded to the authorized origin, one robots.txt file, and up to three sitemap previews; large files can be truncated.",
    "Canonical targets, hreflang relationships, structured data meaning, visible-content accuracy, and migration mappings require representative page and source review.",
    "The runner does not access Search Console, analytics, server logs, index coverage, ranking data, or historical baselines."
  ];

  if (summary.seo?.status !== "completed") limitations.push(`Technical SEO collection was not completed: ${summary.seo?.error ?? summary.seo?.status ?? "missing"}`);
  if (summary.lighthouse.status !== "completed") limitations.push(`Lighthouse evidence was not completed: ${summary.lighthouse.error ?? summary.lighthouse.status}`);

  return createEvidence(profileToUse, summary, {
    checks,
    artifacts,
    limitations
  });
}

function stripFragment(value) {
  if (!value) return null;
  const url = new URL(value);
  url.hash = "";
  return url.href;
}
