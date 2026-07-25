# WordPress testing checklist

## Purpose

Use this checklist to plan and perform testing for a new WordPress build, material theme or plugin change, WordPress update, or release candidate. Select tests from actual site risk and functionality rather than testing every WordPress feature. Mark non-applicable items explicitly and record evidence for failures and release-blocking checks.

Run destructive tests only in an isolated environment with controlled data.

## Test scope and readiness

- [ ] Identify the release artifact or commit, WordPress and runtime versions, active theme, active plugins, environment, database snapshot, and test-data version.
- [ ] Map the site's critical frontend, editorial, administrative, integration, and scheduled workflows to test coverage.
- [ ] Define supported browsers, devices, assistive technologies, roles, locales, and network conditions.
- [ ] Confirm the test environment represents production closely enough for the risks being tested and cannot send unintended email, analytics, payments, webhooks, or indexing signals.
- [ ] Enable appropriate non-production debugging and logging and begin with no unexplained PHP errors, deprecated notices, JavaScript errors, or failed requests.
- [ ] Verify backups or snapshots exist before tests that change content, configuration, users, plugins, themes, or database state.

## Frontend, content, and navigation

- [ ] Test the homepage, header, footer, primary navigation, search, 404 page, and representative error or unavailable state.
- [ ] Test every material template, content type, archive, taxonomy, and search-result layout with representative content.
- [ ] Test long titles, long body content, empty fields, missing featured images, captions, galleries, tables, embeds, downloads, and other likely edge cases.
- [ ] Verify menus, breadcrumbs, pagination, internal links, previous/next navigation, filters, and sorting where applicable.
- [ ] Verify responsive behavior across the support matrix, including zoom, reflow, portrait and landscape orientation, touch, keyboard, and reduced motion.
- [ ] Verify media renders at appropriate dimensions and quality without broken URLs, mixed content, layout shifts, or inaccessible alternatives.
- [ ] Test localization, right-to-left layout, date and time display, and translated content when the site supports them.

## Forms, email, search, integrations, and scheduled tasks

- [ ] Test each critical form's successful submission, required fields, invalid input, duplicate submission, spam controls, failure state, and retained valid input.
- [ ] Verify form storage, notifications, recipient routing, reply-to behavior, sender authentication, links, attachments, and sensitive-data handling.
- [ ] Test uploads with allowed, disallowed, oversized, and potentially unsafe file types according to project policy.
- [ ] Verify site search indexing, permissions, high-value queries, filtering, empty results, special characters, and newly published or updated content.
- [ ] Test critical APIs, webhooks, identity, CRM, payment, maps, video, chat, and other integrations under meaningful success, failure, timeout, retry, and duplicate-delivery conditions.
- [ ] Verify scheduled posts and material WordPress or plugin cron events execute, fail visibly, and do not run more than intended.
- [ ] Confirm non-production safeguards prevent real customer messages, transactions, analytics pollution, and writes to production services.

## Administration and editing

- [ ] Test administrator and editor sign-in, sign-out, account recovery, session expiry, and multifactor authentication where applicable.
- [ ] Create or edit representative content using the block editor or approved editor, preview it, save a draft, schedule or publish it, revise it, and view the public result.
- [ ] Test reusable blocks or patterns, template parts, navigation editing, featured images, media replacement, revisions, autosave, and preview where used.
- [ ] Verify required custom fields, validation, conditional controls, editorial guidance, and relationships between content.
- [ ] Test bulk actions, imports, exports, comments, moderation, and user management only when the editorial workflow depends on them.
- [ ] Verify editor-facing labels, help text, ordering, defaults, and permissions make the intended workflow understandable.
- [ ] Confirm production administrators cannot edit or install code through the dashboard when deployment policy prohibits it.

## Roles, permissions, and security

- [ ] Test each material role with a representative account and verify the user can perform required work without receiving unnecessary capabilities.
- [ ] Verify unauthenticated and lower-privileged users cannot access protected content, administrative screens, files, REST endpoints, AJAX actions, or privileged operations.
- [ ] Verify custom theme and plugin operations validate capabilities and requests rather than relying only on hidden controls or nonces.
- [ ] Test account creation, password reset, email-change, and user-enumeration behavior according to project risk.
- [ ] Review public uploads, backups, logs, configuration files, directory listings, debug output, and administrative endpoints for unintended exposure.
- [ ] Run approved dependency, vulnerability, malware, and secret checks and review material findings.
- [ ] Review Tools > Site Health and investigate new critical or recommended issues relevant to the release.

## Accessibility, performance, SEO, and caching

- [ ] Run automated accessibility tests on representative templates and states, then complete manual keyboard, focus, zoom, reflow, contrast, motion, and assistive-technology checks for critical journeys.
- [ ] Test frontend and editor workflows with real content and confirm third-party widgets, cookie notices, dialogs, and overlays do not create accessibility barriers.
- [ ] Measure critical templates and journeys against project performance budgets on representative mobile hardware and constrained networks.
- [ ] Review page weight, requests, images, fonts, scripts, styles, database queries, object-cache behavior, and material third-party costs when budgets fail.
- [ ] Verify page titles, descriptions, headings, canonicals, robots directives, XML sitemaps, structured data, redirects, status codes, and indexable URL behavior.
- [ ] Crawl the site and investigate broken links, redirect chains, soft 404s, duplicate URLs, orphaned pages, and unexpected indexable content.
- [ ] Test page, browser, CDN, and persistent object caching while signed out and signed in as applicable.
- [ ] Verify cache exclusions for personalized, authenticated, cart, checkout, preview, form, and other dynamic responses.
- [ ] Confirm publishing, updating, deleting, scheduling, plugin updates, deployments, and content synchronization invalidate or refresh the correct caches and search indexes.

## Compatibility, recovery, and sign-off

- [ ] Test the approved theme and complete plugin set together; deactivate components selectively only when diagnosing a conflict.
- [ ] Test supported WordPress, PHP, and database updates in staging before production and review deprecated or compatibility warnings.
- [ ] Verify a representative database-and-files backup can be restored into an approved environment and produces a usable site.
- [ ] Rerun the site's critical regression suite after fixes, updates, cache changes, and configuration changes.
- [ ] Record the environment, build, data, browser, role, steps, expected result, actual result, and evidence for material failures.
- [ ] Resolve release blockers and document accepted exceptions with severity, owner, rationale, and target date.
- [ ] Obtain technical, content, accessibility, security, privacy, and product sign-off required by project risk.

## References

- [Testing WordPress themes](https://developer.wordpress.org/themes/advanced-topics/testing/)
- [WordPress security APIs](https://developer.wordpress.org/apis/security/)
- [WordPress roles and capabilities](https://developer.wordpress.org/apis/security/user-roles-and-capabilities/)
- [WordPress Site Health](https://wordpress.org/documentation/site-health/)
- [WordPress Cron](https://developer.wordpress.org/plugins/cron/)
- [`wp cron event run`](https://developer.wordpress.org/cli/commands/cron/event/run/)

Last verified against official documentation: 2026-07-24.
