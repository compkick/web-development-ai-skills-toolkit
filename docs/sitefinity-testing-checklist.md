# Sitefinity testing checklist

## Purpose

Use this plan for a project milestone, release candidate, upgrade, or production smoke test. Select the sections affected by the change and record the environment, build, tester, date, and evidence.

> **Project-specific:** Define the supported browser and device matrix from audience data and contractual requirements. The examples below are a starting point, not a permanent list.

## Test preparation

- [ ] Confirm the build, CMS, renderer, database, settings, and license belong to the test environment.
- [ ] Prepare test users, content, files, form recipients, and integration accounts.
- [ ] Confirm the browsers, viewports, acceptance criteria, and changed areas.
- [ ] Confirm tests will not send real notifications or change production content.

## Browsers, viewports, and visual review

- [ ] Test the latest supported Chrome or Edge experience and the other browsers required by the project, such as Firefox and Safari.
- [ ] Test wide desktop, laptop, tablet, and phone layouts.
- [ ] Watch for visual, responsive, focus, validation, loading, and error-state problems throughout testing.

## Sitebuild and page foundation

- [ ] Test the sitebuild header, footer, homepage, inner pages, and special pages when a sitebuild exists.
- [ ] Test the Sitefinity layouts, templates, grids, content alignment, and responsive behavior.
- [ ] Confirm the style-guide and widget-guide pages accurately represent the released components.

## Pages, navigation, and content

- [ ] Load the homepage and representative page types without server, console, or rendering errors.
- [ ] Test Tier 1 and representative Tier 2 pages.
- [ ] Verify primary navigation, utility navigation, footer navigation, breadcrumbs, internal links, redirects, canonical URLs, and intentional 404 behavior.
- [ ] Create, preview, publish, and view a page through the normal editorial workflow.
- [ ] Test scheduled publishing, localization, multisite, and approval workflows when used.

## Widgets and structured content

- [ ] Add and configure each changed widget, then verify editing and frontend rendering.
- [ ] Test the default widgets used by the project.
- [ ] Test structured-content lists, details, filters, pagination, empty states, and links.
- [ ] Test widget defaults, validation, permissions, and output.

## Media, documents, forms, and search

- [ ] Upload and replace an image and document.
- [ ] Check media metadata, alternative text, and storage.
- [ ] Test each important form, including validation, notifications, consent, and spam controls.
- [ ] Rebuild the search indexes and test search results, filters, links, and no-result messages.

## Access, security, and operations

- [ ] Test administrator, editor, approver, service, and public-user permissions.
- [ ] Confirm `/Sitefinity` and non-production environments use the intended authentication and access restrictions, secure transport, and session behavior.
- [ ] Keep secrets, license files, stack traces, and sensitive data out of pages and deployment artifacts.
- [ ] Test scheduled tasks, SiteSync, email, identity, analytics, APIs, and other integrations.
- [ ] Review CMS, renderer, hosting, pipeline, browser-console, and application-monitoring output for repeated or release-blocking errors.

## Cross-discipline release checks

- [ ] Run accessibility checks on representative pages, forms, dialogs, and changed widgets.
- [ ] Run performance checks on important pages.
- [ ] Crawl the site for broken links, bad responses, incorrect canonicals, structural problems, duplicate metadata, and indexing mistakes.
- [ ] Run the applicable security review and automated dependency, secret, and vulnerability scans; triage findings before release.
- [ ] Complete the critical end-to-end smoke path, document defects and residual risk, and obtain the required QA or project-owner sign-off.

## References

- [Sitefinity development prerequisites](sitefinity-development-prerequisites.md)
- [Sitefinity documentation](https://www.progress.com/documentation/sitefinity-cms)

Last verified against official documentation: 2026-07-24.
