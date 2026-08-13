# Sitefinity testing checklist

## Purpose

Use this plan for a project milestone, release candidate, upgrade, or production smoke test. Select the sections affected by the change and record the environment, build, tester, date, and evidence.

> **Project-specific:** Define the supported browser and device matrix from audience data and contractual requirements. The examples below are a starting point, not a permanent list.

## Test preparation

- [ ] Confirm the deployed build, CMS version, renderer version, database, configuration, license, and external-service endpoints belong to the intended environment.
- [ ] Prepare representative editor roles, test content, form recipients, files, and integration test accounts without using unapproved production data.
- [ ] Check the browser matrix, viewport coverage, acceptance criteria, known issues, and areas changed by this release.
- [ ] Verify monitoring and logs are available and that tests will not send real customer notifications or alter live content unexpectedly.

## Browsers, viewports, and visual review

- [ ] Test the latest supported Chrome or Edge experience and the other browsers required by the project, such as Firefox and Safari.
- [ ] Test representative wide desktop, laptop, tablet, and mobile viewports; include real iPhone or iPad behavior when those devices are in scope.
- [ ] At every applicable step, review layout, content, interaction, focus, responsive behavior, loading states, validation, and error states for visual or usability defects.

## Sitebuild and page foundation

- [ ] Verify the standalone sitebuild, if used, including the header, footer, home page, representative inner pages, and special page types.
- [ ] Verify the Sitefinity base template or renderer layout, header, footer, additional templates, grid/container system, content alignment, and responsive behavior.
- [ ] Confirm the style-guide and widget-guide pages accurately represent the released components.

## Pages, navigation, and content

- [ ] Load the homepage and representative page types without server, console, or rendering errors.
- [ ] Verify primary navigation, utility navigation, footer navigation, breadcrumbs, internal links, redirects, canonical URLs, and intentional 404 behavior.
- [ ] Create, preview, publish, and view a page through the normal editorial workflow.
- [ ] Verify scheduled publishing or unpublishing, localization, multisite behavior, and approval workflows when the project uses them.

## Widgets and structured content

- [ ] Add and configure each changed widget, then verify editing and frontend rendering.
- [ ] Test the Sitefinity default widgets used by the project, such as content blocks, navigation, lists, cards, events, blogs, news, forms, and search.
- [ ] Verify representative structured-content detail and list views, filters, pagination, empty states, and links.
- [ ] Confirm widget designers and properties enforce expected defaults, validation, permissions, and safe output handling.

## Media, documents, forms, and search

- [ ] Upload and replace an image and document, confirm metadata and alternative text behavior, and verify delivery from the expected storage provider.
- [ ] Submit each critical form through its happy path and important validation/error path; verify storage, notifications, consent handling, spam controls, and sensitive-data access.
- [ ] Rebuild the required frontend search indexes, then verify global search, expected results, no-result behavior, filters, and result links.

## Access, security, and operations

- [ ] Verify administrator, editor, approver, service, and public users can perform only the actions their roles require.
- [ ] Confirm `/Sitefinity` and non-production environments use the intended authentication and access restrictions, secure transport, and session behavior.
- [ ] Keep secrets, license files, stack traces, and sensitive data out of pages and deployment artifacts.
- [ ] Verify scheduled tasks, background jobs, SiteSync, email, identity, analytics, APIs, and other integrations used by the site.
- [ ] Review CMS, renderer, hosting, pipeline, browser-console, and application-monitoring output for repeated or release-blocking errors.

## Cross-discipline release checks

- [ ] Run the project's accessibility checks on representative templates, navigation, forms, dialogs, and changed widgets, including keyboard and screen-reader spot checks.
- [ ] Run performance checks on representative high-value pages and investigate material regressions in rendering, assets, caching, or backend response time.
- [ ] Crawl the site for broken links, bad responses, incorrect canonicals, structural problems, duplicate metadata, and indexing mistakes.
- [ ] Run the applicable security review and automated dependency, secret, and vulnerability scans; triage findings before release.
- [ ] Complete the critical end-to-end smoke path, document defects and residual risk, and obtain the required QA or project-owner sign-off.

## References

- [Sitefinity development prerequisites](sitefinity-development-prerequisites.md)
- [Sitefinity documentation](https://www.progress.com/documentation/sitefinity-cms)

Last verified against official documentation: 2026-07-24.
