# WordPress launch checklist

## Purpose

Use this checklist to prepare, approve, and execute the production launch of a new or materially changed WordPress site. Use the separate migration checklist when moving an existing installation, host, domain, or URL structure. Mark non-applicable items explicitly.

A checked item means the outcome was verified with the production release candidate or production system, not merely configured earlier in the project.

## Launch scope and control

- [ ] Identify the exact code artifact or commit, WordPress and runtime versions, theme, plugins, configuration, database change, media set, and content snapshot proposed for production.
- [ ] Assign the launch lead, deployer, tester, content owner, infrastructure or DNS owner, incident contact, communication channel, decision authority, and rollback authority.
- [ ] Define the launch window, expected impact, checkpoints, go/no-go criteria, measurable rollback triggers, and final rollback decision time.
- [ ] Confirm required technical, content, accessibility, security, privacy, performance, SEO, and stakeholder approvals.
- [ ] Resolve release-blocking findings and record accepted exceptions with owners and target dates.
- [ ] Confirm vendor support and responsible team members are available for the launch risk and timing.

## Content, data, and release preparation

- [ ] Set and communicate the required code, configuration, database, media, and content freeze.
- [ ] Complete the final approved content synchronization and confirm its direction, scope, conflict handling, and audit record.
- [ ] Review the homepage, navigation, shared layout, forms, legal and privacy content, cornerstone content, contact details, media, downloads, and time-sensitive content.
- [ ] Remove placeholder, duplicate, expired, test, draft-only, unlicensed, and unintended environment-specific content.
- [ ] Create matching backups or snapshots of the production database, uploads, custom code, and required configuration and verify they can be accessed for rollback.
- [ ] Rehearse deployment, database or content migration, cache invalidation, search indexing, smoke tests, and rollback in a production-like environment.
- [ ] Confirm application and database versions remain compatible during rollout or document an atomic deployment and rollback sequence.
- [ ] Verify the approved artifact can be deployed without rebuilding different code.

## Production configuration and security

- [ ] Verify `WP_ENVIRONMENT_TYPE`, database connection, table prefix, WordPress URLs, canonical domain, paths, salts, secret sources, and environment-specific constants without exposing secret values.
- [ ] Disable visitor-facing debug output and verify production logging is access-controlled and excludes secrets and unnecessary personal data.
- [ ] Audit administrator, editor, service, integration, and former-contributor accounts and confirm least-privilege roles and working recovery addresses.
- [ ] Confirm the production policy for dashboard code editing, installation, updates, automatic updates, XML-RPC, application passwords, REST access, registration, and comments.
- [ ] Verify WordPress core, required themes, plugins, and runtime components are supported and free of unresolved release-blocking vulnerabilities.
- [ ] Verify file ownership and permissions and protect `wp-config.php`, backups, logs, source maps, storage, and administrative endpoints from unintended public access.
- [ ] Verify HTTPS, certificate chain and renewal, security headers, cookies, and canonical-host redirects from outside the internal network.
- [ ] Review Tools > Site Health and resolve or document material production issues.

## Search, email, integrations, and operations

- [ ] Verify the production permalink structure, redirect map, canonical URLs, XML sitemap, `robots.txt`, indexing directives, and structured data.
- [ ] Confirm non-production search protections will not be promoted and remove production `noindex` settings only when the site is ready for users and crawlers.
- [ ] Verify production email credentials, sender authentication, recipients, reply-to behavior, templates, failure monitoring, and suppression removal.
- [ ] Verify production analytics, tag management, consent, privacy controls, and critical business events without exposing unnecessary personal data.
- [ ] Verify production credentials, endpoints, scopes, signatures, webhooks, retries, rate limits, and failure monitoring for critical integrations.
- [ ] Verify WP-Cron or the replacement system scheduler runs required tasks and will not duplicate jobs on an old or staging environment.
- [ ] Configure page caching, CDN, persistent object caching, cache exclusions, invalidation, and optional cache warming for the production architecture.
- [ ] Verify uptime, application-error, certificate, domain, backup, security, email, scheduled-task, and critical-journey monitoring and test alert routing.

## Go/no-go gate

- [ ] Confirm CI and the required WordPress testing checklist pass against the release candidate.
- [ ] Confirm the production backup, deploy, test, communication, monitoring, and rollback procedures are open and accessible to the launch team.
- [ ] Confirm DNS changes, TTL planning, certificate coverage, redirect activation, and old-site handling when domains or hosting are changing.
- [ ] Confirm no unresolved issue meets a rollback trigger or violates an acceptance criterion.
- [ ] Record the go/no-go decision and the artifact, data, approvals, exceptions, and people covered by it.

## Launch execution

- [ ] Announce the start of the approved launch window and capture the operational baseline needed to identify regressions.
- [ ] Deploy the approved code, configuration, database changes, media, and content through the approved process and retain relevant logs.
- [ ] Apply planned DNS, routing, certificate, CDN, firewall, redirect, and hosting changes in the approved order.
- [ ] Remove temporary maintenance content and unintended production `noindex` settings only after the site is ready.
- [ ] Invalidate caches, warm critical public paths where justified, rebuild search indexes, and run due scheduled tasks as planned.
- [ ] Run production smoke tests for the homepage, navigation, representative templates, authentication, editor, forms, email, search, integrations, media, downloads, scheduled tasks, and error handling.
- [ ] Verify HTTPS, canonical host, redirects, sitemap, robots directives, canonicals, analytics, consent, and critical events from an external visitor context.
- [ ] Monitor errors, availability, latency, resource use, database health, cache behavior, cron, queues, email, search, integrations, conversions, and support reports.
- [ ] Record launch results, evidence, issues, decisions, and owners.

## Post-launch and rollback

- [ ] Repeat critical tests after DNS, caches, traffic, scheduled tasks, and search indexes stabilize.
- [ ] Review logs, monitoring, Site Health, forms, email, integrations, analytics, consent, backups, and scheduled tasks at risk-appropriate intervals.
- [ ] Crawl production, submit or refresh sitemaps through applicable webmaster tools, and verify redirects, canonicals, directives, metadata, broken links, and unexpected indexable URLs.
- [ ] Review production content and media and obtain field performance data when enough real-user traffic is available.
- [ ] Restore temporary DNS settings after rollback risk passes and close, prioritize, or schedule every launch finding.
- [ ] If a rollback trigger is met, preserve evidence and execute the approved code, configuration, database, media, DNS, redirect, cache, and search recovery steps under the named authority.
- [ ] After rollback, verify service health, reconcile content or data changed during the failed window, communicate status, and document corrective actions before another attempt.
- [ ] Hold a retrospective and update runbooks, tests, monitoring, and checklists with material lessons.

## References

- [WordPress requirements](https://wordpress.org/about/requirements/)
- [Hardening WordPress](https://developer.wordpress.org/advanced-administration/security/hardening/)
- [WordPress backups](https://developer.wordpress.org/advanced-administration/security/backup/)
- [WordPress Site Health](https://wordpress.org/documentation/site-health/)
- [WordPress Cron](https://developer.wordpress.org/plugins/cron/)
- [Updating WordPress](https://developer.wordpress.org/advanced-administration/upgrade/upgrading/)

Last verified against official documentation: 2026-07-24.
