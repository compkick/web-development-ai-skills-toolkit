# WordPress launch checklist

## Purpose

Use this checklist when launching a new or materially changed WordPress site. Use the [WordPress migration checklist](wordpress-migration-checklist.md) when moving an existing site, host, domain, or URL structure.

## Plan the launch

- [ ] Identify the exact code, database changes, media, and content going to production.
- [ ] Record the WordPress, PHP, theme, and plugin versions.
- [ ] Choose the launch window and assign the launch, deployment, testing, content, DNS, and rollback owners.
- [ ] Define the go/no-go and rollback conditions.
- [ ] Resolve release blockers and record accepted issues.
- [ ] Confirm the people and vendor support needed for launch will be available.

## Prepare content and backups

- [ ] Set the required code, database, media, and content freeze.
- [ ] Complete the final approved content synchronization.
- [ ] Review the homepage, navigation, shared layout, forms, legal content, contact details, media, and downloads.
- [ ] Remove placeholder, expired, test, duplicate, and draft-only content.
- [ ] Back up the production database, uploads, custom code, and configuration.
- [ ] Confirm the backup is available for rollback.
- [ ] Rehearse high-risk deployment and rollback steps.

## Review production settings

- [ ] Confirm `WP_ENVIRONMENT_TYPE`, database settings, URLs, paths, and environment-specific configuration.
- [ ] Confirm secrets and salts come from the approved source.
- [ ] Disable visitor-facing debug output.
- [ ] Confirm production logs do not contain secrets or unnecessary personal data.
- [ ] Review administrator, editor, service, and former-contributor accounts.
- [ ] Confirm dashboard editing, updates, APIs, registration, and comments follow the production policy.
- [ ] Confirm WordPress, PHP, themes, and plugins are supported and have no release-blocking vulnerabilities.
- [ ] Check file ownership and permissions.
- [ ] Confirm `wp-config.php`, backups, logs, and administration tools are not publicly exposed.
- [ ] Test HTTPS, certificates, security headers, cookies, and preferred-domain redirects.
- [ ] Review Site Health. Note and address any production issues.

## Review services

- [ ] Check permalinks, redirects, canonicals, XML sitemaps, `robots.txt`, and indexing settings.
- [ ] Remove production `noindex` settings only when the site is ready.
- [ ] Test production email delivery, recipients, sender authentication, and failure reporting.
- [ ] Test analytics, tag management, consent, and important business events.
- [ ] Test important integrations with production credentials and endpoints.
- [ ] Confirm WP-Cron or the replacement scheduler runs the required tasks.
- [ ] Confirm the old or staging site cannot duplicate scheduled tasks or integrations.
- [ ] Configure page, CDN, browser, and object caching.
- [ ] Test cache exclusions and invalidation.
- [ ] Test uptime, error, certificate, domain, backup, email, and scheduled-task alerts.

## Complete final reviews

- [ ] Review representative pages and important workflows with the [web accessibility review checklist](web-accessibility-review-checklist.md).
- [ ] Review important pages with the [web performance review checklist](web-performance-review-checklist.md).
- [ ] Review public pages with the [technical SEO review checklist](technical-seo-review-checklist.md).
- [ ] Review the production site and configuration with the [web security review checklist](web-security-review-checklist.md).

## Go or no-go

- [ ] Confirm CI and the required WordPress tests pass.
- [ ] Confirm the deployment, test, monitoring, communication, and rollback instructions are ready.
- [ ] Confirm any DNS, certificate, redirect, and old-site changes are ready.
- [ ] Confirm no unresolved issue meets a no-go or rollback condition.
- [ ] Record the final launch decision.

## Launch

- [ ] Announce the start of the launch.
- [ ] Deploy the approved code, configuration, database changes, media, and content.
- [ ] Apply planned DNS, CDN, certificate, firewall, and redirect changes.
- [ ] Remove temporary maintenance content when the site is ready.
- [ ] Clear caches and rebuild search indexes.
- [ ] Run production smoke tests for pages, editing, forms, email, search, and integrations.
- [ ] Confirm HTTPS, redirects, sitemaps, robots directives, canonicals, analytics, and consent from outside the network.
- [ ] Monitor errors, uptime, resources, email, scheduled tasks, integrations, and support reports.
- [ ] Record launch problems and decisions.

## After launch

- [ ] Repeat important tests after DNS, caches, scheduled tasks, and search indexes settle.
- [ ] Review logs, monitoring, Site Health, forms, email, analytics, backups, and scheduled tasks.
- [ ] Crawl production for broken links, redirects, missing pages, and indexing problems.
- [ ] Submit or refresh XML sitemaps in the applicable search tools.
- [ ] Restore temporary DNS settings after the rollback window passes.
- [ ] Assign owners to remaining launch issues.
- [ ] Run the rollback plan when a rollback condition is met.
- [ ] Test the restored site and reconcile any data changed during a failed launch.

## References

- [WordPress requirements](https://wordpress.org/about/requirements/)
- [Hardening WordPress](https://developer.wordpress.org/advanced-administration/security/hardening/)
- [WordPress backups](https://developer.wordpress.org/advanced-administration/security/backup/)
- [WordPress Site Health](https://wordpress.org/documentation/site-health/)
- [WordPress Cron](https://developer.wordpress.org/plugins/cron/)
- [Updating WordPress](https://developer.wordpress.org/advanced-administration/upgrade/upgrading/)

Last verified against official documentation: 2026-07-24.
