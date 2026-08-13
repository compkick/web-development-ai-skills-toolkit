# WordPress testing checklist

## Purpose

Use this checklist for a new WordPress site, theme or plugin change, WordPress update, or release candidate. Select the tests that match the site's features and risk.

Run destructive tests only in an isolated environment with controlled data.

## Prepare for testing

- [ ] Record the release, WordPress version, PHP version, theme, plugins, environment, and test data.
- [ ] List the site's most important visitor, editor, administrator, and integration workflows.
- [ ] Define the browsers, devices, roles, and languages that must be tested.
- [ ] Confirm the test site cannot send real email, payments, webhooks, analytics, or indexing signals.
- [ ] Enable appropriate debugging and logging outside production.
- [ ] Review PHP, JavaScript, and failed-request errors before testing.
- [ ] Create a backup before tests that change the database or configuration.

## Test the frontend

- [ ] Test the homepage, header, footer, navigation, search, and `404` page.
- [ ] Test each important template, content type, archive, and taxonomy page.
- [ ] Test long content, empty fields, missing images, tables, embeds, and downloads.
- [ ] Test menus, breadcrumbs, pagination, filters, and internal links.
- [ ] Test desktop, tablet, phone, zoom, keyboard, and touch behavior.
- [ ] Check images, captions, galleries, downloads, and other media.
- [ ] Test translated and right-to-left content when supported.

## Test forms, email, search, and integrations

- [ ] Submit each important form successfully.
- [ ] Test required fields, invalid input, spam controls, and failure messages.
- [ ] Confirm form entries are stored and sent to the correct people.
- [ ] Test allowed, blocked, and oversized file uploads when uploads are enabled.
- [ ] Test common searches, filters, no-result messages, and newly published content.
- [ ] Test important APIs, webhooks, identity, CRM, payment, maps, video, and chat integrations.
- [ ] Test scheduled posts and important WordPress or plugin cron events.
- [ ] Confirm failed integrations and scheduled tasks are visible in logs or monitoring.

## Test editing and administration

- [ ] Test administrator and editor login, logout, account recovery, and multifactor authentication when used.
- [ ] Create, preview, publish, revise, and view representative content.
- [ ] Test reusable blocks, patterns, template parts, featured images, revisions, autosave, and preview when used.
- [ ] Test required fields and custom-field validation.
- [ ] Test imports, exports, comments, moderation, and bulk actions when used.
- [ ] Confirm editor labels, instructions, defaults, and permissions are understandable.
- [ ] Confirm dashboard code editing and installation follow the production policy.

## Test roles and security

- [ ] Test each important role with a representative account.
- [ ] Confirm visitors and lower-privileged users cannot access protected content or actions.
- [ ] Confirm custom theme and plugin actions check permissions on the server.
- [ ] Test account creation and password reset when enabled.
- [ ] Check that uploads, backups, logs, configuration files, and admin tools are not publicly exposed.
- [ ] Run the project's vulnerability, dependency, malware, and secret checks.
- [ ] Review Site Health. Note and address any new issues.

## Test accessibility, performance, SEO, and caching

- [ ] Run automated and manual accessibility checks on representative pages and important workflows.
- [ ] Test third-party widgets, cookie notices, dialogs, and overlays for accessibility problems.
- [ ] Test important pages against the project's performance goals.
- [ ] Investigate images, fonts, scripts, styles, database queries, and third-party code when performance is poor.
- [ ] Check titles, descriptions, headings, canonicals, robots directives, sitemaps, redirects, and status codes.
- [ ] Crawl the site for broken links, redirect chains, duplicate URLs, and missing pages.
- [ ] Test caching while signed out and signed in.
- [ ] Confirm private, personalized, cart, checkout, preview, and form pages are not cached incorrectly.
- [ ] Confirm publishing and deployments clear the correct caches and search indexes.

## Finish testing

- [ ] Test the approved theme and complete plugin set together.
- [ ] Test WordPress, PHP, database, theme, and plugin updates in staging before production.
- [ ] Restore a representative backup and confirm the site works.
- [ ] Rerun important tests after fixes and configuration changes.
- [ ] Record failures with steps, expected results, actual results, and evidence.
- [ ] Resolve release blockers and assign owners to accepted issues.

## References

- [Testing WordPress themes](https://developer.wordpress.org/themes/advanced-topics/testing/)
- [WordPress security APIs](https://developer.wordpress.org/apis/security/)
- [WordPress roles and capabilities](https://developer.wordpress.org/apis/security/user-roles-and-capabilities/)
- [WordPress Site Health](https://wordpress.org/documentation/site-health/)
- [WordPress Cron](https://developer.wordpress.org/plugins/cron/)
- [`wp cron event run`](https://developer.wordpress.org/cli/commands/cron/event/run/)

Last verified against official documentation: 2026-07-24.
