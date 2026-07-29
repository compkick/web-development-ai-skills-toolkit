# Technical SEO review checklist

## Purpose

Use this checklist to review whether intended public content can be crawled, rendered, indexed, consolidated, understood, and monitored by applicable search engines. It covers technical discovery and presentation, not ranking guarantees or manipulative optimization.

Search-provider behavior changes over time and indexing is never guaranteed. Treat Google-specific features as vendor guidance, verify other search providers required by the project, and prioritize useful, accessible, people-first content.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Scope and baseline

- [ ] **Baseline requirement:** Record the production property, host and protocol variants, subdomains, locales, content types, rendering architecture, release, migrations, target search providers, and accountable owner.
- [ ] **Baseline requirement:** Identify which content should and should not be publicly discoverable and indexable, including PDFs, media, search results, filters, parameters, staging systems, and private areas.
- [ ] **Baseline requirement:** Collect available crawl data, search-provider reports, server logs, analytics, backlink or traffic context, and known indexing issues before drawing conclusions.
- [ ] **Conditional requirement:** Preserve pre-change URL, traffic, query, indexation, backlink, sitemap, and redirect evidence when a redesign, domain change, protocol change, or migration is in scope.

## Crawl and index controls

- [ ] **Baseline requirement:** Crawl representative and high-value URLs as an anonymous user and review response codes, redirect behavior, rendered content, internal links, canonicals, robots directives, and discoverability.
- [ ] **Baseline requirement:** Verify intended pages and required rendering resources are accessible to supported crawlers without login, blocked resources, redirect loops, soft 404s, or persistent server errors.
- [ ] **Baseline requirement:** Verify private or restricted content uses access control; do not rely on `robots.txt` to prevent access or indexing.
- [ ] **Baseline requirement:** Verify `robots.txt` is reachable, syntactically intentional, does not block required content or resources, and references applicable sitemap locations.
- [ ] **Baseline requirement:** Verify `noindex`, `nofollow`, `X-Robots-Tag`, snippet, cache, and media directives match the approved indexing policy and are not hidden behind a crawl block that prevents discovery.
- [ ] **Baseline requirement:** Verify important pages are reachable through crawlable HTML links and investigate orphaned pages, dead ends, broken internal links, and navigation generated only through unsupported interactions.

## URLs, status codes, and canonicalization

- [ ] **Baseline requirement:** Verify one canonical HTTPS host and consistent URL conventions for case, trailing slashes, parameters, default documents, and duplicate routes.
- [ ] **Baseline requirement:** Verify each indexable page emits an appropriate self-referential or consolidating canonical and that canonicals agree with redirects, internal links, sitemaps, locale annotations, and rendered content.
- [ ] **Baseline requirement:** Verify permanent moves use direct relevant redirects without chains, loops, blanket homepage redirects, or loss of query/path data that must be preserved.
- [ ] **Baseline requirement:** Verify removed content returns an intentional redirect, `404`, or `410` based on replacement and retention needs and does not produce a soft 404.
- [ ] **Conditional requirement:** Verify pagination, faceted navigation, internal search, tracking parameters, session identifiers, print views, alternate formats, and duplicate product or listing routes have a deliberate crawl and canonical strategy.

## Sitemaps and search-provider tools

- [ ] **Baseline requirement:** Verify XML sitemaps are valid, current, fetchable, limited to preferred canonical indexable URLs, and split by type or size when that improves diagnosis.
- [ ] **Baseline requirement:** Verify sitemap URLs return successful final responses and exclude redirects, errors, `noindex` pages, private content, and noncanonical duplicates.
- [ ] **Baseline requirement:** Verify ownership and access for applicable search-provider tools, submit or reference sitemaps as appropriate, and review crawl, indexing, security, manual-action, and enhancement reports.
- [ ] **Recommended:** Segment sitemaps and reports so teams can detect which content type, locale, or section has an indexing problem.

## Page signals and rendered content

- [ ] **Baseline requirement:** Verify indexable pages have unique, descriptive titles; one clear primary heading; useful visible content; and internal link text that describes destinations.
- [ ] **Recommended:** Provide useful unique meta descriptions for important pages while recognizing that search providers may generate different snippets.
- [ ] **Recommended:** Verify favicons, application icons, and sharing metadata produce accurate, approved previews on the platforms the project supports.
- [ ] **Baseline requirement:** Verify the server-rendered and crawler-rendered page exposes the same essential content, links, titles, canonicals, robots directives, and structured data intended for users.
- [ ] **Conditional requirement:** Verify JavaScript routing produces stable URLs, meaningful HTTP responses, crawlable links, useful initial content, and no indexing dependency on user gestures or unsupported browser state.
- [ ] **Baseline requirement:** Verify mobile and responsive presentations contain equivalent primary content, metadata, structured data, and controls required for discovery.
- [ ] **Conditional requirement:** Verify images, video, news, products, events, or other specialized content follow the applicable provider requirements and are accessible in the formats being submitted.

## Structured data and internationalization

- [ ] **Conditional requirement:** Validate structured data against the applicable vocabulary and search feature requirements and verify it accurately represents visible, current page content.
- [ ] **Conditional requirement:** Verify required structured-data properties, identifiers, URLs, dates, availability, prices, organization details, and relationships remain correct across templates and states.
- [ ] **Conditional requirement:** Verify each localized page declares the correct language, uses stable locale-specific URLs, and has reciprocal valid `hreflang` annotations including an appropriate fallback when used.
- [ ] **Conditional requirement:** Verify locale or geolocation redirects do not prevent users or crawlers from reaching alternate versions.

## Migration and ongoing monitoring

- [ ] **Conditional requirement:** Validate the old-to-new redirect map against an authoritative URL inventory and preserve intent, high-value backlinks, canonical signals, and content rather than redirecting unmatched URLs indiscriminately.
- [ ] **Conditional requirement:** Keep redirects, old domain ownership, certificates, and monitoring active long enough for users, links, and crawlers to transition safely.
- [ ] **Baseline requirement:** After release, crawl production and monitor index coverage, sitemap processing, crawl errors, canonical selection, traffic, important queries, structured-data reports, and server errors for unexpected change.
- [ ] **Baseline requirement:** Record limitations, provider-specific observations, unresolved conflicts, and owners without treating tool scores, crawlability, or checklist completion as a ranking guarantee.

## References

- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [Google Search developer guide](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Google canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google robots meta tag specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)

Last verified against official documentation: 2026-07-25.
