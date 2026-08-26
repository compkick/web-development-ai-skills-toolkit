---
name: review-technical-seo
description: Review public websites for technical SEO using crawl and indexing signals, rendered content, metadata, structured data, migration evidence, and authorized search data. Use for technical SEO audits, indexing investigations, migration checks, launch reviews, and retesting; do not use for content strategy, keyword research, backlink analysis, or general multidisciplinary audits.
---

# Review Technical SEO

Perform a bounded, evidence-based technical SEO review that distinguishes crawlability, indexability, search appearance, and observed search performance.

## Invocation boundaries

Use this skill when the requested outcome is a technical SEO audit, crawl or indexing review, metadata and canonical review, JavaScript SEO assessment, structured-data review, site-migration check, technical SEO launch check, or retest.

Do not invoke it for keyword research, editorial strategy, backlink or authority analysis, paid search, an accessibility-only or performance-only review, a general multidisciplinary project audit with no technical SEO focus, or implementation of one already-known fix. Do not promise indexing, rankings, traffic, or rich results.

## Read the references

Before planning the review, read:

- [Technical SEO review checklist](references/technical-seo-review-checklist.md) for the outcomes to assess.
- [Web review skill contract](references/web-review-contract.md) for safety, evidence, result, and reporting rules.
- [Web review findings reference](references/web-review-findings-reference.md) for scope records, statuses, severity, exceptions, and retesting.

Read [website audit runtime](references/website-audit-runtime.md) only when an authorized URL and automated browser evidence are relevant.

## Establish scope

Record the repository and/or authorized URLs, environment, release or commit, preferred public hosts, page types, locales, intended indexability, known duplicate URL patterns, and any URL or domain migration. Identify representative pages such as the home page, major templates, important landing pages, JavaScript-rendered pages, localized variants, and known problem URLs.

Record available Search Console, analytics, server-log, sitemap, crawl, and migration evidence. Choose a representative sample rather than implying that one URL covers the site. Ask only for missing information that would materially change the review.

## Choose evidence

Use the least intrusive combination that answers the request:

- Use the plugin-owned deterministic runner with the `review-technical-seo` profile for each authorized public URL selected for the sample. Resolve the plugin root from this skill directory; do not assume the target project's working directory contains the runtime.
- Before deciding that the plugin runtime is unavailable, run `node runtime/scripts/status.mjs --json` from the resolved plugin root. If it reports `ready: true`, run the profile directly; do not look for `node_modules` under the plugin or run bootstrap.
- Read `evidence.json` for stable normalized observations, `coverage.json` for the automation boundary, `technical-seo-report.html` for the concise evidence summary, `seo-results.json` for rendered metadata and bounded robots/sitemap observations, and the Lighthouse HTML report for detailed diagnostics.
- Treat each profile run as one rendered public page, not a whole-site crawl. The runner inventories links without fetching every destination and makes only bounded same-origin requests for `robots.txt` and up to three sitemap previews.
- Inspect source, rendering strategy, routes, metadata generation, redirect configuration, sitemap generation, robots controls, canonical logic, structured data, localization, error handling, and deployment configuration when repository access is available.
- Run an existing crawler, link checker, migration test, or project SEO test when it is configured, authorized, and safe. Do not install a crawler or other project dependency without approval, and keep the crawl within the recorded hosts, paths, rate, and page limit.
- Review authorized Search Console, analytics, server logs, CDN logs, and migration mappings when available. Keep crawler observations, search-engine reports, and business outcomes distinguishable.
- Use an available interactive browser or project-specific tests for JavaScript-rendered content, navigation, error states, locale switching, and cases the single-page runner cannot establish.

Put runtime artifacts in a task-specific temporary directory outside the target repository unless the user requests another location. When the user requests `.output` or another durable location, preserve the complete evidence package and report its exact path.

## Interpret the evidence

Separate these questions:

- **Crawlability:** can an authorized crawler retrieve and discover the URL?
- **Indexability:** do status codes, robots controls, and content allow the page to be considered for indexing?
- **Canonicalization:** do canonicals, redirects, internal links, and sitemaps consistently identify the preferred URL?
- **Search appearance:** are titles, visible content, language signals, and structured data accurate and useful?
- **Observed performance:** what do Search Console, analytics, logs, and historical baselines show?

An HTTP 200 response, crawlable page, valid canonical, or submitted sitemap makes a page eligible or clearer to process; none guarantees indexing or ranking. Treat sitemap submission and declared canonicals as signals that search engines evaluate, not commands.

Treat a parsed JSON-LD block as syntax evidence only. Validate applicable structured data against the search engine's current requirements and confirm that it describes visible page content. For localized sites, verify reciprocal `hreflang` relationships and compatible canonicals across representative variants.

For migrations, test the approved old-to-new URL map, direct permanent redirects, removed-page behavior, canonical and sitemap updates, internal links, and post-launch monitoring. Do not infer migration completeness from the redirect followed by one supplied URL.

## Run the review

Assess every applicable checklist outcome against recorded evidence. Use `Not checked` when evidence is unavailable and `Not applicable` only when the condition is genuinely outside scope. State whether each result came from automated browser evidence, a bounded crawl, source inspection, Search Console, analytics, logs, migration tests, or supplied evidence.

Prioritize blocked or unintentionally indexed pages, wrong status codes, broken discovery paths, conflicting canonical signals, redirect loops or chains, missing rendered content, invalid structured data, and migration regressions. Group repeated template-level symptoms into one finding with representative examples instead of creating one issue per URL.

## Report results

Return the readable report in the Codex response by default. Follow the shared report structure and include:

1. Overall assessment and the most important actions
2. Scope, environments, representative pages, tools, and evidence
3. Crawlability and indexability findings
4. URLs, canonicals, redirects, sitemaps, and migration findings
5. Rendered content, metadata, structured data, and localization findings
6. Search Console, analytics, logs, or baseline observations when available
7. Passed checks, items not checked, limitations, retest needs, and supporting artifact paths

For each material finding, include the result, priority, affected scope, evidence, likely search or user impact, and the smallest practical recommendation. Do not turn every Lighthouse suggestion, crawl difference, or absent optional enhancement into a finding.

Write a durable Markdown report only when the user asks. Use their requested location, or propose `reports/technical-seo-review-YYYY-MM-DD.md` and confirm before adding it to the target repository. Do not place raw audit artifacts in the repository without explicit permission.

## Safety and stopping conditions

Treat an explicit request to review a supplied URL as authorization for read-only navigation, normal Lighthouse reloads, and the profile's bounded same-origin `robots.txt` and sitemap requests. Otherwise confirm the target before loading it. If runtime status reports that the current runtime is not ready, obtain separate approval before bootstrapping it.

Also obtain approval before using credentials, accessing private search or analytics systems, installing tools, capturing detailed browser-error messages, or running a multi-page crawl. Define the crawl's authorized hosts, paths, rate, and page limit before starting it.

Do not submit forms, change search settings, submit or remove sitemaps, request indexing, modify robots controls, generate artificial search traffic, scrape search-result pages, or change code unless the user explicitly expands the task.

Stop when the representative scope has been assessed and every applicable checklist outcome has evidence or a documented gap. Do not turn the review into an unbounded crawl, ranking campaign, or speculative content audit.
