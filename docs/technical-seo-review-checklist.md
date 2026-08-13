# Technical SEO review checklist

## Purpose

Use this checklist for public pages that should appear in search results. Adapt it to the site's platform, content, languages, and whether URLs or domains are changing.

Search engines decide what to crawl and index. This checklist confirms the site gives them clear, consistent signals.

## Prepare

- [ ] Identify the public hosts, environments, important page types, and URL changes in scope.
- [ ] Confirm which pages should and should not appear in search results.
- [ ] Record access to search and analytics tools and establish a baseline before major changes.

## Crawl and indexing

- [ ] Crawl representative public pages and review status codes, links, canonicals, and robots directives.
- [ ] Confirm important pages are linked, return the correct status, and contain useful content.
- [ ] Keep private, test, staging, search-result, and other unwanted pages out of the index.
- [ ] Use authentication or access controls for private environments, not `robots.txt` alone.
- [ ] Provide accurate XML sitemaps and remove broken links, redirect chains, and loops.

## URLs and canonicals

- [ ] Use one consistent HTTPS host and redirect other versions to it.
- [ ] Give indexable pages a correct canonical URL and keep site signals consistent.
- [ ] Control duplicate URLs created by filters, tracking parameters, print views, or alternate formats.
- [ ] Return real not-found responses and test old-to-new redirects when URLs change.

## Page content and metadata

- [ ] Give each important page a useful title and main heading.
- [ ] Confirm important content is present in rendered HTML and works without user interaction.
- [ ] Add valid structured data only when it matches visible page content.
- [ ] Check language and `hreflang` relationships for localized sites.

## Launch and monitoring

- [ ] Remove unintended `noindex` controls when the production site is ready.
- [ ] Confirm robots rules, sitemaps, canonicals, redirects, and structured data in production.
- [ ] Submit sitemaps and monitor indexing, crawl errors, traffic, and important landing pages.
- [ ] Keep redirect ownership and monitoring in place after a migration.

## References

- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [Google guidance for developers](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google robots meta tag guidance](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)

Last verified against official documentation: 2026-07-28.
