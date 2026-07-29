# Website release and launch checklist

## Purpose

Use this checklist to prepare, approve, execute, validate, and, if necessary, roll back a website or web-application release. It applies to new sites, redesigns, replatforms, migrations, and major releases; adapt the depth to the change and its risk.

This is the general launch gate. Complete detailed reviews early enough to remediate findings, then bring their results into the launch decision. Do not rerun every specialist checklist during the cutover unless the release changed its evidence.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Launch record and decision criteria

- [ ] **Baseline requirement:** Record the launch purpose, approved scope, exact source revision and artifact, production target, configuration, content or data snapshot, migrations, feature flags, window, and accountable launch owner.
- [ ] **Baseline requirement:** Identify critical user journeys, success measures, supported users and environments, expected traffic, material dependencies, and the production baseline used to detect regression.
- [ ] **Baseline requirement:** Assign deployment, content, domain, infrastructure, quality, product, security, privacy, accessibility, communications, support, incident, and rollback responsibilities appropriate to the release.
- [ ] **Baseline requirement:** Define measurable go/no-go criteria, blocking finding severities, accepted-exception authority, launch checkpoints, rollback triggers, and the person authorized to decide.
- [ ] **Baseline requirement:** Record known issues, deferred work, accepted exceptions, compensating controls, owners, target dates, and limitations communicated to decision makers.

## Review and release readiness

- [ ] **Baseline requirement:** Complete required peer review, CI, QA, content, stakeholder, and contractual approvals against the exact release; investigate skipped, flaky, overridden, or stale evidence.
- [ ] **Baseline requirement:** Complete the [CI/CD and release readiness checklist](ci-cd-release-readiness-checklist.md) for the delivery path and close or accept material findings.
- [ ] **Baseline requirement:** Complete the [web accessibility review checklist](web-accessibility-review-checklist.md) at the scope and depth required by the project.
- [ ] **Baseline requirement:** Complete the [web application security review checklist](web-security-review-checklist.md) and any separately required penetration test, threat review, or vulnerability gate.
- [ ] **Baseline requirement:** Complete the [web performance review checklist](web-performance-review-checklist.md) and verify the release meets approved budgets or exceptions.
- [ ] **Baseline requirement:** Complete the [technical SEO review checklist](technical-seo-review-checklist.md) for public discoverable content and any URL or platform migration.
- [ ] **Conditional requirement:** Complete the [privacy and data-handling review checklist](web-privacy-data-handling-review-checklist.md) when the release collects, changes, shares, or retains personal or sensitive data.
- [ ] **Conditional requirement:** Complete the [dependency and software supply chain review checklist](software-supply-chain-review-checklist.md) when dependency, build, artifact, plugin, theme, or distribution changes create material risk.
- [ ] **Baseline requirement:** Verify the [production observability and operations checklist](production-observability-operations-checklist.md) has been completed to the depth needed to support and recover this release.

## Content and user readiness

- [ ] **Baseline requirement:** Confirm production content is complete, approved, accurate, owned, accessible, licensed, and free of placeholders, test records, unintended duplication, expired details, and environment-specific values.
- [ ] **Baseline requirement:** Review the homepage, header, footer, navigation, high-value pages, calls to action, contact details, dates, downloads, legal or policy content, and representative localized content.
- [ ] **Baseline requirement:** Exercise critical journeys and representative loading, empty, validation, success, failure, permission, offline, `404`, and server-error states across the support matrix.
- [ ] **Baseline requirement:** Verify forms, search, authentication, email, downloads, analytics, consent, and critical integrations using production-safe data and destinations.
- [ ] **Conditional requirement:** Verify transactional email recipient routing, sender-domain authentication, reply-to behavior, templates, links, attachments, retries, failure visibility, and non-production safeguards when email is part of a critical journey.
- [ ] **Conditional requirement:** Complete the [CMS content governance checklist](cms-content-governance-checklist.md) when editorial ownership, publishing workflow, review dates, archival, or retention materially affects launch readiness.
- [ ] **Conditional requirement:** Have representative users or stakeholders exercise materially changed critical journeys when usability, audience, or service risk justifies it.
- [ ] **Baseline requirement:** Prepare user, stakeholder, support, editor, administrator, and status communications required before, during, and after launch.

## Cutover and recovery preparation

- [ ] **Baseline requirement:** Create and verify rollback points for application, configuration, infrastructure, database, content, media, routing, cache, and search state and record what cannot be reversed.
- [ ] **Baseline requirement:** Rehearse deployment, migration, content synchronization, cache invalidation, search indexing, smoke testing, and rollback in a production-like environment to the depth justified by risk.
- [ ] **Baseline requirement:** Confirm application, schema, configuration, jobs, integrations, and clients remain compatible during partial rollout, or define a controlled atomic deployment and recovery strategy.
- [ ] **Baseline requirement:** Coordinate the code, configuration, schema, domain, and content freezes needed for the launch window and define how urgent changes will be approved and reconciled.
- [ ] **Conditional requirement:** Validate the old-to-new URL and redirect map against an authoritative inventory when domains, platforms, paths, or information architecture change.
- [ ] **Conditional requirement:** Prepare DNS records, TTL changes, certificates, canonical-host redirects, email authentication, verification records, and ownership access before the cutover.
- [ ] **Conditional requirement:** Verify database, file, content, or media transfers use approved secure methods and preserve permissions, relationships, serialized data, timestamps, and integrity as applicable.
- [ ] **Baseline requirement:** Confirm production credentials, access, vendor support, monitoring, dashboards, alert routes, incident channels, staffing, and after-hours escalation are available for the window.

## Go/no-go

- [ ] **Baseline requirement:** Confirm the approved artifact, configuration, migrations, content, evidence, rollback points, owners, communications, and production target have not changed since final review.
- [ ] **Baseline requirement:** Review open critical and high findings, warnings, accepted exceptions, unavailable evidence, current incidents, vendor status, and external dependencies against the decision criteria.
- [ ] **Baseline requirement:** Hold and record the go, conditional-go, delay, or no-go decision, decision owner, conditions, time, evidence, and required communications.

## Launch execution

- [ ] **Baseline requirement:** Confirm the launch window, operational baseline, active roles, communication channel, change freeze, and first checkpoint before making production changes.
- [ ] **Baseline requirement:** Deploy the approved artifact, configuration, infrastructure, schema, and content changes through the approved process and retain relevant logs and timestamps.
- [ ] **Conditional requirement:** Run approved environment, database, file, media, or content synchronization after confirming source, destination, scope, direction, backup, and exclusion rules.
- [ ] **Conditional requirement:** Apply prepared DNS, certificate, routing, canonical-host, email, verification, and redirect changes and monitor propagation where applicable.
- [ ] **Baseline requirement:** Remove maintenance responses and unintended `noindex` controls only after the production site is ready for users and crawlers; use access control rather than `robots.txt` for private systems.
- [ ] **Baseline requirement:** Invalidate affected caches, warm only justified critical paths, rebuild required search or derived indexes, and verify personalized or dynamic responses are not cached incorrectly.
- [ ] **Baseline requirement:** Run smoke tests for critical navigation, content, authentication, forms, email, search, downloads, transactions, integrations, scheduled work, and error handling.
- [ ] **Baseline requirement:** Verify externally visible HTTPS, certificate chain, canonical host, headers, cookies, redirects, robots directives, sitemaps, canonicals, analytics, consent, and critical business events.
- [ ] **Baseline requirement:** Monitor user journeys, availability, errors, latency, resources, queues, database, email, search, integrations, conversions, security events, and support reports through the launch window.
- [ ] **Baseline requirement:** Record each checkpoint, result, issue, decision, remediation, owner, communication, and change from the approved runbook.

## Post-launch validation

- [ ] **Baseline requirement:** Repeat critical smoke tests after DNS, caches, traffic, asynchronous processing, scheduled jobs, search indexes, and dependent systems have stabilized.
- [ ] **Baseline requirement:** Review production monitoring and logs at risk-appropriate intervals and verify backups, alerts, forms, email, integrations, analytics, consent, jobs, and business events remain healthy.
- [ ] **Baseline requirement:** Review critical production content, media, downloads, URLs, permissions, and localized variants for completeness and unintended environment-specific data.
- [ ] **Baseline requirement:** Crawl production and review broken links, responses, redirects, canonicals, directives, sitemap contents, structured data, and unexpected indexable or unavailable URLs.
- [ ] **Conditional requirement:** Verify applicable search-provider ownership, submit or refresh sitemaps, and monitor crawl, indexing, canonical, enhancement, traffic, and field-performance reports as data becomes available.
- [ ] **Baseline requirement:** Remove temporary elevated access, debug settings, freezes, launch flags, test content, monitoring overrides, and shortened DNS settings when their approved need ends.
- [ ] **Baseline requirement:** Close, prioritize, or schedule every launch finding and communicate the final status, known issues, support path, and ownership to stakeholders.
- [ ] **Recommended:** Hold a proportionate retrospective and update tests, automation, runbooks, architecture records, and checklists with material lessons.

## Rollback or recovery

- [ ] **Baseline requirement:** When a rollback trigger is met, preserve evidence, notify the decision owner, stop unsafe progression, and execute the approved application, configuration, infrastructure, data, routing, cache, and search recovery steps.
- [ ] **Baseline requirement:** Verify recovered service health and critical journeys, then reconcile transactions, content, queued work, messages, and data created or changed during the failed release.
- [ ] **Baseline requirement:** Communicate current service state, user impact, data implications, workaround, support path, and next decision point to the required audiences.
- [ ] **Baseline requirement:** Keep the failed release closed until root causes, recovery gaps, and required corrective actions are understood, owned, and validated for another attempt.

## References

- [Web review findings reference](web-review-findings-reference.md)
- [Google site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [NIST contingency-planning resources](https://csrc.nist.gov/topics/security-and-privacy/security-programs-and-operations/contingency-planning)

Last verified against official documentation: 2026-07-25.
