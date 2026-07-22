# General website development, launch, and operations checklist

## Purpose

Use this checklist for a new website, redesign, replatform, or major release. Adapt it to the project's risk, architecture, content, audience, and contractual requirements. Mark non-applicable items explicitly rather than silently skipping them.

For each material check, record the owner, result, evidence, exception, and follow-up work in the project's delivery system. A checked box should mean the item was verified, not merely discussed.

This checklist is a general release gate. Detailed accessibility, security, performance, SEO, privacy, CMS, and migration checklists may impose additional requirements.

## Project definition and ownership

- [ ] Define the site's purpose, primary audiences, success measures, and critical user journeys.
- [ ] Identify the product owner, technical owner, content owner, launch coordinator, security contact, privacy contact, and incident contact.
- [ ] Document scope, out-of-scope work, assumptions, dependencies, constraints, and acceptance criteria.
- [ ] Identify applicable legal, regulatory, contractual, accessibility, privacy, retention, and records-management requirements with qualified stakeholders.
- [ ] Define supported browsers, devices, assistive technologies, locales, and network conditions using user evidence where available.
- [ ] Define measurable accessibility, security, performance, SEO, reliability, recovery, and content-quality acceptance criteria.
- [ ] Record launch approval authority and go/no-go decision rules.

## Architecture, environments, and delivery

- [ ] Document application, CMS, hosting, network, storage, database, search, email, analytics, identity, and third-party dependencies.
- [ ] Establish local, development, test, staging, and production environments as needed, with documented differences.
- [ ] Prevent non-production environments from exposing sensitive production data or becoming publicly indexable.
- [ ] Manage configuration and secrets outside source control and client bundles.
- [ ] Pin or lock dependencies where supported and document the update policy.
- [ ] Configure CI to run the project's formatting, linting, type, test, build, security, and documentation checks.
- [ ] Produce a traceable, immutable release artifact or commit identifier.
- [ ] Define deployment, database-migration, cache-invalidation, search-indexing, rollback, and disaster-recovery procedures.
- [ ] Test backups by restoring them in an approved environment.
- [ ] Verify licenses and usage rights for code, plugins, fonts, images, video, data, and other assets.

## Information architecture, content, and user experience

- [ ] Review the sitemap, URL conventions, navigation, breadcrumbs, and internal linking against user needs.
- [ ] Build and review the homepage, representative landing pages, detail pages, search results, forms, and special templates.
- [ ] Configure useful 404, 410 when applicable, and 500/error experiences.
- [ ] Provide empty, loading, validation, success, failure, offline, and permission states for applicable workflows.
- [ ] Define content ownership, review dates, publishing workflow, archival, and deletion rules.
- [ ] Remove placeholder, duplicate, expired, test, and unlicensed content.
- [ ] Review plain language, headings, link text, calls to action, dates, contact information, and downloadable documents.
- [ ] Test long content, localization, user-generated content, and unexpected data where applicable.
- [ ] Add favicons, application icons, and sharing imagery required by the project.

## Accessibility

- [ ] Confirm the required accessibility standard; use WCAG 2.2 Level AA as the general baseline when no stricter requirement applies.
- [ ] Run automated accessibility tests on representative pages and states.
- [ ] Complete manual keyboard, focus-order, visible-focus, skip-link, zoom, reflow, orientation, contrast, target-size, and reduced-motion checks.
- [ ] Verify semantic structure, page language, headings, landmarks, links, buttons, labels, instructions, errors, status messages, and accessible names.
- [ ] Verify alternatives for meaningful images, icons, charts, audio, video, and documents.
- [ ] Test critical journeys with representative assistive technologies according to project risk and requirements.
- [ ] Confirm overlays, cookie notices, sticky elements, dialogs, and chat tools do not trap focus or obscure the focused control.
- [ ] Document unresolved barriers, severity, owner, remediation date, and any formally approved exception.

## Security and software supply chain

- [ ] Complete a threat- and risk-appropriate security review using the current OWASP Top 10 for awareness and a risk-appropriate, explicitly recorded version of OWASP ASVS for verifiable requirements.
- [ ] Verify authentication, authorization, session management, account recovery, administrative access, and least privilege where applicable.
- [ ] Verify server-side validation, contextual encoding, parameterized queries, CSRF protections, upload restrictions, and rate limits where applicable.
- [ ] Scan supported application and infrastructure dependencies for known vulnerabilities and review material findings.
- [ ] Remove unused accounts, services, plugins, packages, sample applications, debug tools, and default credentials.
- [ ] Confirm secrets are stored in approved systems and absent from repositories, artifacts, logs, backups, and browser-delivered code.
- [ ] Configure HTTPS and test HTTP-to-HTTPS and canonical-host redirects.
- [ ] Configure and verify applicable response headers, including a tested Content Security Policy. Enable HSTS only after its scope and HTTPS behavior are verified.
- [ ] Configure cookies with appropriate `Secure`, `HttpOnly`, `SameSite`, path, domain, and lifetime settings.
- [ ] Protect administrative interfaces, logs, backups, storage, and monitoring endpoints from public access.
- [ ] Define vulnerability intake, triage, remediation, disclosure, and emergency patching responsibilities.

## Privacy, analytics, and data handling

- [ ] Inventory personal data, sensitive data, cookies, browser storage, tracking, form fields, logs, third parties, and cross-border transfers as applicable.
- [ ] Confirm a documented purpose and approved handling basis for collected data.
- [ ] Minimize collection, access, retention, logging, and third-party disclosure.
- [ ] Verify privacy notices, consent experiences, preference controls, and data subject workflows with qualified stakeholders where required.
- [ ] Ensure non-essential tracking follows the project's approved consent rules.
- [ ] Configure analytics and tag management to exclude secrets and unnecessary personal data.
- [ ] Test analytics, consent, withdrawal, and preference persistence without bypassing browser privacy controls.
- [ ] Document data retention, deletion, export, backup, and incident-handling procedures.

## Performance and resilience

- [ ] Define performance budgets for critical templates and user journeys.
- [ ] Measure lab performance on representative mobile hardware and constrained networks.
- [ ] Review real-user field data when a comparable production site or preview is available.
- [ ] Use the current Core Web Vitals good thresholds as a general baseline unless stricter project budgets apply: LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1 at the 75th percentile.
- [ ] Optimize image dimensions, formats, responsive sources, fonts, scripts, styles, and third-party resources.
- [ ] Confirm the LCP resource is discoverable and is not lazy-loaded.
- [ ] Verify compression, bundling, cache headers, cache busting, CDN behavior, and cache invalidation.
- [ ] Load test or capacity test critical services when traffic or contractual risk justifies it.
- [ ] Test graceful failure, timeout, retry, maintenance, and dependency-outage behavior where applicable.

## Search, metadata, and discovery

- [ ] Add unique, descriptive page titles and appropriate meta descriptions.
- [ ] Provide a clear primary heading and logical heading hierarchy.
- [ ] Verify canonical URLs, canonical-host redirects, URL casing, trailing-slash policy, and duplicate URL handling.
- [ ] Generate an XML sitemap containing indexable canonical URLs and validate it.
- [ ] Configure `robots.txt` for crawl management. Do not use it as access control, an indexing guarantee, or a canonicalization mechanism.
- [ ] Use authentication or network controls for private environments; use `noindex` where a publicly reachable page must not be indexed.
- [ ] Add and validate structured data only where it accurately represents visible content.
- [ ] Add Open Graph and other required sharing metadata.
- [ ] Verify redirects preserve intent and avoid chains, loops, soft 404s, and irrelevant bulk redirection.
- [ ] Test hreflang and locale-specific URLs when the site is multilingual or multi-regional.
- [ ] Crawl the site and review broken links, status codes, titles, headings, canonicals, directives, orphaned pages, and unexpected indexable URLs.

## Forms, email, search, and integrations

- [ ] Test successful, invalid, duplicate, interrupted, and abusive form submissions as applicable.
- [ ] Verify accessible labels, instructions, errors, status messages, autofill, keyboard operation, and retained valid input.
- [ ] Confirm recipient routing, sender authentication, reply-to behavior, templates, links, attachments, retries, and non-production safeguards for email.
- [ ] Test site search indexing, permissions, filtering, empty results, special characters, and high-value queries.
- [ ] Test identity, payment, CRM, maps, video, chat, social, APIs, webhooks, and other third-party integrations under success and failure conditions.
- [ ] Verify integration credentials, scopes, rotation, rate limits, timeouts, retries, signatures, idempotency, and logging where applicable.

## Operations, monitoring, and recovery

- [ ] Define service-level objectives or operational expectations appropriate to the site.
- [ ] Configure uptime and synthetic monitoring for critical public journeys.
- [ ] Configure application, infrastructure, database, search, queue, email, certificate, domain, and backup monitoring as applicable.
- [ ] Route actionable alerts to an owned channel and test the escalation path.
- [ ] Confirm logs and metrics are available, access-controlled, time-synchronized, retained appropriately, and free of unnecessary sensitive data.
- [ ] Document incident response, status communication, vendor escalation, and after-hours ownership.
- [ ] Define recovery time and recovery point objectives where required.
- [ ] Verify backup schedules, retention, encryption, access, and restoration.
- [ ] Document certificate, domain, subscription, license, and account renewal ownership.

## Pre-launch gate

- [ ] Identify the exact release artifact, commit, configuration, database change, and content snapshot proposed for production.
- [ ] Freeze or coordinate code, configuration, schema, and content changes for the launch window.
- [ ] Complete required peer review, CI checks, QA, security, accessibility, privacy, performance, SEO, content, and stakeholder approvals.
- [ ] Resolve all release-blocking findings and record accepted exceptions.
- [ ] Verify production configuration without exposing secret values.
- [ ] Create and verify code, configuration, database, media, and content rollback points appropriate to the architecture.
- [ ] Rehearse deployment, migration, cache, indexing, smoke-test, and rollback steps in a production-like environment.
- [ ] Confirm old and new application versions are compatible with the database during rollout, or define an atomic deployment and rollback plan.
- [ ] Prepare a DNS change plan when applicable. Lower TTL far enough in advance based on the DNS provider, existing TTL, migration design, and rollback needs; do not assume a universal 30-second value.
- [ ] Export and verify the redirect map for migrations or URL changes.
- [ ] Confirm maintenance-window, stakeholder, support, vendor, and user communications.
- [ ] Assign launch-day roles, decision authority, communication channel, timeline, checkpoints, and rollback triggers.
- [ ] Hold and record the go/no-go decision.

## Launch execution

- [ ] Announce the start of the approved launch window.
- [ ] Capture current monitoring, traffic, queue, error, database, and dependency baselines.
- [ ] Deploy the approved artifact and configuration through the approved process.
- [ ] Run approved database or content migrations and retain their logs.
- [ ] Apply DNS, routing, certificate, CDN, firewall, or hosting changes as planned.
- [ ] Enable and verify migration redirects at the correct layer.
- [ ] Remove temporary maintenance content and unintended `noindex` directives only after the production site is ready to receive users and crawlers.
- [ ] Purge or invalidate caches, warm critical paths where justified, and rebuild search indexes.
- [ ] Run smoke tests for the homepage, navigation, representative pages, search, authentication, forms, email, integrations, downloads, and error pages.
- [ ] Verify the canonical host, HTTPS, certificates, security headers, cookies, robots directives, sitemap, canonical URLs, and redirects from outside the internal network.
- [ ] Verify analytics, consent, tag management, and critical business events.
- [ ] Monitor errors, latency, availability, resource use, queues, email, search, conversions, and support reports throughout the launch window.
- [ ] Record launch results, evidence, issues, decisions, and follow-up owners.

## Post-launch verification

- [ ] Repeat critical smoke tests after caches, DNS, scheduled jobs, and traffic have stabilized.
- [ ] Review monitoring and logs after approximately one hour, 24 hours, 72 hours, and one week, adjusted for project risk.
- [ ] Crawl the production site and compare status codes, redirects, canonicals, directives, sitemap URLs, metadata, and broken links against expectations.
- [ ] Review field performance and Core Web Vitals when sufficient data becomes available.
- [ ] Verify search-engine ownership and submit or refresh sitemaps through the applicable webmaster tools.
- [ ] Confirm forms, email delivery, integrations, search indexing, analytics, consent, backups, scheduled jobs, and alerts remain healthy.
- [ ] Restore DNS TTL to the approved operating value after rollback risk has passed.
- [ ] Close, prioritize, or schedule every launch finding.
- [ ] Hold a launch retrospective and update runbooks, tests, and checklists.

## Rollback and remediation

Define architecture-specific steps before launch. A typical rollback decision should consider visitor experience, security exposure, data integrity, error rate, availability, performance, and the estimated time to repair forward.

- [ ] Name the person authorized to order rollback.
- [ ] Define measurable rollback triggers and the final decision deadline.
- [ ] Preserve logs, evidence, timestamps, and a record of changes before rollback.
- [ ] Stop or drain traffic and background processing safely when required.
- [ ] Redeploy or switch to the last known good application artifact.
- [ ] Roll back configuration and infrastructure changes.
- [ ] Restore, reverse, or switch databases only with a verified data-consistency plan. Keep compatible code and database versions together.
- [ ] Reverse DNS, routing, CDN, or redirect changes when they are part of the approved rollback design.
- [ ] Purge caches and rebuild search indexes as required by the restored version.
- [ ] Run rollback smoke tests and monitor for stabilization.
- [ ] Communicate status to stakeholders and users through the approved channels.
- [ ] Reconcile data created or changed during the failed release window.
- [ ] Document root cause and corrective actions before attempting the launch again.

Do not rely on `robots.txt` to hide a broken or rolled-back site from search engines. Use access controls, an appropriate HTTP status, or a deliberately designed temporary response based on the incident.

## References

Security references last verified 2026-07-21 against OWASP Top 10:2025 and OWASP ASVS 5.0.0.

- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [Web Platform Baseline](https://web.dev/baseline/)
- [Web Vitals](https://web.dev/articles/vitals)
- [Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp)
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [Google Search technical SEO guidance](https://developers.google.com/search/docs/fundamentals/get-started)
- [Google canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
