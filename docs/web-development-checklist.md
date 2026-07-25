# General website development, launch, and operations checklist

## Purpose

Use this checklist to plan and verify a new website, redesign, replatform, or major release. Adapt it to the project's risk, architecture, content, audience, and contractual requirements. Mark non-applicable items explicitly rather than silently skipping them.

Use it throughout delivery rather than as a single launch-day exercise: establish scope and owners early, gather readiness evidence during development, and rerun time-sensitive checks around launch.

This is a general release gate, not a substitute for a detailed accessibility, security, performance, SEO, privacy, CMS, or migration review when project risk requires one. For each material check, record the owner, result, evidence, exception, and follow-up work in the project's delivery system. A checked box means the outcome was verified, not merely discussed.

## Project definition and ownership

- [ ] Define the site's purpose, primary audiences, critical user journeys, success measures, and acceptance criteria.
- [ ] Document scope, dependencies, constraints, assumptions, and explicitly deferred work.
- [ ] Assign product, technical, content, launch, security, privacy, and incident ownership; one person may hold several roles on a small project.
- [ ] Identify applicable legal, regulatory, contractual, accessibility, privacy, retention, and records-management requirements with qualified stakeholders.
- [ ] Define the supported browsers, devices, assistive technologies, locales, and network conditions using user evidence where available.
- [ ] Record who can approve launch, the go/no-go criteria, and the conditions that require rollback.

## Architecture, environments, and delivery

- [ ] Document the application, CMS, hosting, data stores, identity, email, analytics, search, and material third-party dependencies.
- [ ] Establish the environments the project needs, document their differences, and prevent non-production systems from exposing production data or becoming publicly indexable.
- [ ] Keep configuration and secrets out of source control, build artifacts, logs, and browser-delivered code.
- [ ] Pin or lock dependencies where supported, define an update policy, and verify licenses and usage rights for code and assets.
- [ ] Configure CI to run the formatting, linting, type, test, build, security, and documentation checks that provide meaningful release confidence.
- [ ] Produce a traceable release artifact or commit identifier that can be promoted without rebuilding different code.
- [ ] Document deployment, database or content migration, cache invalidation, search indexing, and rollback procedures.
- [ ] Verify backups, access controls, retention, and restoration by completing a restore test appropriate to the project's risk.

## Content, user experience, and accessibility

- [ ] Review the sitemap, URL conventions, navigation, breadcrumbs, and internal linking against user needs.
- [ ] Review the homepage, shared header and footer, global navigation, representative pages, and critical workflows, including applicable loading, empty, validation, success, failure, permission, offline, 404, and server-error states.
- [ ] Remove placeholder, duplicate, expired, test, and unlicensed content; review plain language, headings, link text, calls to action, critical contact details, dates, and downloads.
- [ ] Define content ownership, publishing and approval workflow, review dates, archival, and deletion rules.
- [ ] Test responsive behavior across the support matrix, including long or unexpected content, localization, and user-generated content where applicable.
- [ ] Have representative users or stakeholders exercise materially changed critical journeys when usability risk justifies it.
- [ ] Confirm the required accessibility standard; use WCAG 2.2 Level AA as the general baseline when no stricter requirement applies.
- [ ] Run automated accessibility tests on representative pages and states, and manually review the results.
- [ ] Complete manual keyboard, focus, zoom, reflow, orientation, contrast, target-size, and reduced-motion checks.
- [ ] Verify semantic structure, page language, headings, landmarks, controls, labels, instructions, errors, status messages, and accessible names.
- [ ] Verify appropriate alternatives for meaningful images, icons, charts, audio, video, and documents.
- [ ] Test critical journeys with representative assistive technologies according to project risk and requirements.
- [ ] Verify that dialogs, overlays, cookie notices, sticky elements, and third-party widgets do not trap focus or obscure content and controls.
- [ ] Record unresolved accessibility barriers with severity, owner, remediation date, and any formally approved exception.

## Security, privacy, and software supply chain

- [ ] Complete a threat- and risk-appropriate security review using the OWASP Top 10 for awareness and an explicitly selected subset of OWASP ASVS when verifiable application-security requirements are needed.
- [ ] Verify authentication, authorization, session management, account recovery, administrative access, and least privilege where applicable.
- [ ] Verify server-side validation, contextual encoding, parameterized queries, CSRF protections, upload restrictions, and abuse controls where applicable.
- [ ] Scan supported application and infrastructure dependencies for known vulnerabilities and resolve or explicitly accept material findings.
- [ ] Remove unused accounts, services, plugins, packages, sample applications, debug tools, and default credentials.
- [ ] Confirm secrets are stored in approved systems and establish a response for accidental disclosure.
- [ ] Verify HTTPS, canonical-host redirects, appropriate security headers, a tested Content Security Policy, and cookie `Secure`, `HttpOnly`, `SameSite`, scope, and lifetime settings. Enable HSTS only after its scope and HTTPS behavior are verified.
- [ ] Protect administrative interfaces, logs, backups, storage, monitoring endpoints, and infrastructure management from unauthorized public access.
- [ ] Define vulnerability intake, triage, remediation, disclosure, and emergency patching responsibilities.
- [ ] Inventory personal and sensitive data, cookies, browser storage, form fields, logs, analytics, third parties, and transfers as applicable.
- [ ] Confirm an approved purpose for collected data and minimize collection, access, retention, logging, and disclosure.
- [ ] Verify required privacy notices, consent and preference controls, and data-subject workflows with qualified stakeholders.
- [ ] Ensure analytics and tag management follow approved consent rules and exclude secrets and unnecessary personal data.
- [ ] Document retention, deletion, export, backup, and privacy-incident procedures.

## Performance, discovery, and integrations

- [ ] Define performance budgets for critical templates and journeys, then measure them on representative mobile hardware and constrained networks.
- [ ] Review comparable real-user data when available and use the current Core Web Vitals good thresholds as a general baseline unless stricter budgets apply.
- [ ] Optimize images, fonts, scripts, styles, and third-party resources; ensure the LCP resource is discoverable and not lazy-loaded.
- [ ] Verify compression, cache headers, cache busting, CDN behavior, cache invalidation, and graceful failure of important dependencies.
- [ ] Complete capacity or load testing when expected traffic, architecture, or contractual risk justifies it.
- [ ] Verify unique titles, useful descriptions, a clear primary heading, logical heading structure, canonical URLs, and duplicate-URL handling.
- [ ] Validate the XML sitemap, `robots.txt`, indexing directives, and structured data; never use `robots.txt` as access control.
- [ ] Verify redirects preserve intent and avoid chains, loops, soft 404s, and irrelevant bulk redirection.
- [ ] Crawl the site and review broken links, status codes, titles, headings, canonicals, directives, orphaned pages, and unexpected indexable URLs.
- [ ] Test forms and site search under meaningful success, validation, empty-result, failure, and abuse conditions.
- [ ] Verify email recipient routing, sender authentication, reply-to behavior, templates, links, attachments, retries, and non-production safeguards.
- [ ] Test critical integrations under success, failure, and timeout conditions; verify credentials, scopes, signatures, rate limits, retries, idempotency, and logging where applicable.
- [ ] Verify favicons, application icons, sharing metadata, hreflang, and locale-specific URLs when the site's publishing and audience model requires them.

## Operations and recovery

- [ ] Define operational expectations for availability, performance, recovery time, and acceptable data loss based on project risk.
- [ ] Monitor critical public journeys and applicable application, infrastructure, database, search, queue, email, domain, certificate, and backup health.
- [ ] Route actionable alerts to an owned channel and test the notification and escalation path.
- [ ] Confirm logs and metrics are available, access-controlled, time-synchronized, retained appropriately, and free of unnecessary sensitive data.
- [ ] Document incident response, status communication, vendor escalation, and after-hours ownership.
- [ ] Assign ownership for domain, certificate, hosting, subscription, license, integration, and account renewals.

## Pre-launch gate

- [ ] Identify the exact artifact or commit, configuration, database change, and content snapshot proposed for production.
- [ ] Complete required peer review, CI, QA, accessibility, security, privacy, performance, SEO, content, and stakeholder approvals; resolve blockers and record accepted exceptions.
- [ ] Verify production configuration without exposing secret values, and coordinate the code, configuration, schema, and content freeze required for the launch window.
- [ ] Review cornerstone and other high-value content for accuracy, completeness, ownership, and launch readiness.
- [ ] Create verified rollback points and rehearse deployment, migration, environment or content synchronization, smoke-test, and rollback steps in a production-like environment as applicable.
- [ ] Confirm application and database compatibility during rollout, or define an atomic deployment and recovery plan.
- [ ] Prepare and validate DNS changes and redirect maps when domains, hosting, or URLs are changing.
- [ ] Assign launch roles, communication channels, checkpoints, rollback triggers, and stakeholder or user communications.
- [ ] Hold and record the go/no-go decision.

## Launch execution

- [ ] Confirm the approved launch window and capture the operational baseline needed to detect regressions.
- [ ] Deploy the approved artifact, configuration, migrations, and infrastructure changes through the approved process, retaining relevant logs.
- [ ] Run and verify approved environment or content synchronization when applicable, confirming the source, destination, and scope before execution.
- [ ] Remove temporary maintenance content and unintended `noindex` directives only when the site is ready for users and crawlers.
- [ ] Apply redirects, invalidate caches, warm critical paths where justified, and rebuild search indexes as planned.
- [ ] Run smoke tests for critical navigation, content, authentication, forms, email, search, integrations, downloads, and error handling.
- [ ] Verify externally visible HTTPS, certificates, canonical host, security headers, cookies, robots directives, sitemap, canonicals, redirects, analytics, consent, and critical business events.
- [ ] Monitor availability, errors, latency, resources, queues, email, search, conversions, integrations, and support reports throughout the launch window.
- [ ] Record launch evidence, issues, decisions, and follow-up owners.

## Post-launch and rollback

- [ ] Repeat critical smoke tests after DNS, caches, scheduled jobs, search indexes, and traffic have stabilized.
- [ ] Review monitoring and logs at risk-appropriate intervals, and verify forms, email, integrations, analytics, consent, backups, jobs, and alerts remain healthy.
- [ ] Review critical production content for completeness, accuracy, expected media and downloads, and unintended environment-specific values.
- [ ] Crawl the production site, verify search-engine ownership, submit or refresh sitemaps through applicable webmaster tools, and review field performance when enough data is available.
- [ ] Restore temporary DNS settings after rollback risk has passed, and close, prioritize, or schedule every launch finding.
- [ ] If rollback criteria are met, preserve evidence and execute the approved application, configuration, data, routing, cache, and search recovery steps under the named decision owner.
- [ ] After rollback, verify service health, reconcile data changed during the failed release, communicate status, and document corrective actions before another attempt.
- [ ] Hold a launch retrospective and update runbooks, tests, and checklists with material lessons.

Do not rely on `robots.txt` to hide a broken, private, or rolled-back site. Use access controls, an appropriate HTTP status, or a deliberately designed temporary response based on the situation.

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

Last verified against official documentation: 2026-07-24.
