# WordPress migration checklist

## Purpose

Use this checklist when planning and performing a move of an existing self-hosted WordPress site between hosts, servers, domains, protocols, paths, or installation models. A migration can affect serialized data, media, email, scheduled tasks, integrations, search visibility, and user activity; rehearse it and define rollback before changing production.

Mark non-applicable items explicitly. Do not copy commands without confirming the database, table scope, URLs, and Multisite behavior for the project.

## Scope, ownership, and inventory

- [ ] Define the migration goal, source, destination, domain and URL changes, acceptable downtime, content freeze, success criteria, and rollback triggers.
- [ ] Assign migration leadership, source and destination access, database, DNS, testing, content, security, communications, and rollback authority.
- [ ] Record whether the source is single-site or Multisite and whether the destination changes that model.
- [ ] Inventory WordPress, the runtime, database, storage, uploads, custom code, theme, plugins, and licenses.
- [ ] Inventory users and roles, forms, email, search, analytics, consent, APIs, webhooks, scheduled tasks, queues, payments, ecommerce, memberships, and other data-writing features.
- [ ] Review source Site Health, users, roles, active and inactive themes and plugins, and remove or document obsolete components before the final backup.
- [ ] Identify content or transactions that can change during migration, including posts, comments, users, orders, form entries, uploads, and scheduled publishing.
- [ ] Confirm the destination meets WordPress requirements and has enough capacity, storage, networking, and vendor support.
- [ ] Confirm compatibility of every required theme, plugin, integration, and custom component with the destination runtime and hosting restrictions.
- [ ] Identify privacy, residency, retention, contractual, and secure-transfer requirements for the data being moved.

## Migration and rollback plan

- [ ] Choose and document the migration method, including which files, database tables, configuration, media, redirects, and external resources will move.
- [ ] Complete a staging rehearsal from representative source backups and record timings, commands, warnings, failures, validation results, and corrections.
- [ ] Define the final synchronization and freeze method so content and transactional data are not silently lost or overwritten.
- [ ] Define how source and destination email, cron, webhooks, payments, and other writers will be suppressed or coordinated to prevent duplicate actions.
- [ ] Prepare a DNS and TTL plan for the cutover and rollback.
- [ ] Define old-site behavior during and after cutover, including maintenance, read-only mode, redirects, access, and retention.
- [ ] Document the exact rollback sequence for application files, database, configuration, DNS, redirects, caches, search indexes, scheduled tasks, and communications.
- [ ] Confirm the rollback point, decision authority, decision deadline, recovery-time objective, and handling of data created during the cutover window.

## Backups and change control

- [ ] Create matching, timestamped backups of the source database, uploads, custom code, required configuration, rewrite rules, redirect map, and relevant DNS records.
- [ ] Store a backup outside the source host and verify integrity, encryption, access, retention, and the ability to restore it.
- [ ] Create destination snapshots or rollback points before importing source data.
- [ ] Record source and destination versions, checksums or file counts where useful, database table counts, and backup identifiers.
- [ ] Announce and enforce the approved code, plugin, theme, configuration, media, and content freeze or controlled final-delta process.
- [ ] Preserve logs and an auditable record of commands and changes without recording secrets.

## Prepare and populate the destination

- [ ] Provision the destination runtime, database, storage, certificates, logging, monitoring, WP-CLI access, and environment protections.
- [ ] Prevent the destination from sending real email, executing duplicate transactions or webhooks, polluting analytics, or becoming publicly indexable during rehearsal.
- [ ] Transfer files and backups through an approved encrypted method such as SSH, SFTP, or a secure provider-side migration channel.
- [ ] Transfer the required WordPress files and uploads without moving obsolete caches, logs, or backups.
- [ ] Import the database using a method appropriate to its size, character set, collation, timeout limits, and destination tooling.
- [ ] Configure destination database credentials, URLs, paths, environment type, secret sources, salts, cache settings, and other environment-specific values.
- [ ] Translate Apache `.htaccess` behavior into the destination web-server configuration when moving to Nginx or another server that does not use `.htaccess`.
- [ ] Set file ownership and permissions and protect configuration, backups, logs, and administrative tooling from public access.
- [ ] Keep unrelated cleanup and software upgrades out of the migration unless the combined change was tested and approved.
- [ ] Test the destination without sending normal visitors or production integrations to it.

## URL replacement and Multisite

- [ ] Back up the imported database immediately before changing URLs.
- [ ] Use a serialized-data-aware tool such as `wp search-replace`; do not perform a blanket text-editor replacement in an SQL export.
- [ ] Dry-run database replacements and review the affected tables, rows, and excluded columns.
- [ ] Select the table scope deliberately. Include plugin tables when required, and use the network-aware options and a per-site URL context for Multisite.
- [ ] Verify WordPress Address and Site Address, content URLs, widgets, block content, menus, theme options, plugin settings, uploads, and custom tables after replacement.
- [ ] For Multisite, verify network and site domains and paths, `wp-config.php`, server rewrite rules, domain mapping, upload locations, network-activated components, users, and capabilities.

Example for a reviewed single-site table prefix:

```bash
# Report proposed changes without writing them
wp search-replace 'https://old.example' 'https://new.example' --all-tables-with-prefix --skip-columns=guid --dry-run

# Apply only after reviewing the dry-run output and confirming a backup
wp search-replace 'https://old.example' 'https://new.example' --all-tables-with-prefix --skip-columns=guid
```

Use `--network` and the appropriate `--url` context for Multisite only after reviewing the network structure and official command options.

## Cutover

- [ ] Announce the cutover and activate the approved maintenance, read-only, or content-freeze controls.
- [ ] Stop or coordinate source and destination cron, queues, email, webhooks, payments, and other writers.
- [ ] Capture the final source backup or delta and verify it before the final transfer and import.
- [ ] Apply the approved file, database, configuration, URL-replacement, rewrite, permission, cache, and search-index steps in the rehearsed order.
- [ ] Disable or bypass caches that could conceal migration changes, then restore only the approved cache configuration after validation.
- [ ] Verify destination HTTPS and certificate coverage before directing normal users to it.
- [ ] Apply DNS, load-balancer, CDN, routing, and canonical-host changes and activate the approved redirect map.
- [ ] Enable production email, scheduled tasks, integrations, analytics, consent, caching, and monitoring once duplicate execution is controlled.
- [ ] Record actual cutover times, commands, evidence, issues, and decisions.

## Validation

- [ ] Test important pages, editing, forms, email, search, authentication, integrations, scheduled tasks, and error pages.
- [ ] Confirm the expected theme and plugins are installed, active, and licensed.
- [ ] Verify users, roles, capabilities, passwords or sessions as expected, and remove obsolete or temporary migration accounts.
- [ ] Review Tools > Site Health, PHP and JavaScript errors, server and application logs, failed cron events, queue failures, and integration errors.
- [ ] Search the database and rendered site for unexpected old domains, paths, mixed content, localhost values, staging values, and broken media URLs.
- [ ] Crawl the site for bad responses, redirects, canonicals, metadata, broken links, and indexing problems.
- [ ] Verify accessibility and performance on representative templates and critical journeys against the pre-migration baseline and acceptance criteria.
- [ ] Verify HTTPS, security headers, cookies, file permissions, public endpoints, backups, logs, account access, and destination monitoring.
- [ ] Verify page, CDN, browser, and object caches vary and invalidate correctly for public, authenticated, personalized, and dynamic responses.
- [ ] Monitor traffic, errors, latency, resources, email, search, cron, integrations, conversions, and support reports throughout the cutover window.
- [ ] Record pass, fail, warning, and not-applicable results with evidence and owners.

## Post-migration and rollback

- [ ] Repeat critical tests after DNS, caches, scheduled tasks, search indexes, and traffic stabilize.
- [ ] Submit or refresh sitemaps through applicable webmaster tools and monitor crawling, indexing, redirects, and 404 reports.
- [ ] Restore temporary DNS settings after rollback risk passes and update inventories, documentation, access records, monitoring, backup jobs, and renewal ownership.
- [ ] Keep the source available in the approved read-only or restricted state until validation and rollback periods end.
- [ ] If a rollback trigger is met, preserve evidence, stop destination writers, execute the approved recovery sequence, and verify the restored service.
- [ ] Reconcile content, users, orders, submissions, uploads, and other data created or changed during the failed migration window.
- [ ] Decommission the source only after written approval, retention needs are met, required data is preserved, and secrets or access are revoked.
- [ ] Close, prioritize, or schedule every finding and hold a retrospective before repeating a failed migration.

## References

WordPress runtime requirements last verified 2026-07-24: PHP 8.3 or greater, MariaDB 10.11 or greater or MySQL 8.0 or greater, and HTTPS. Recheck the official requirements before using these values for a migration.

- [Moving WordPress](https://developer.wordpress.org/advanced-administration/upgrade/migrating/)
- [WordPress requirements](https://wordpress.org/about/requirements/)
- [WordPress backups](https://developer.wordpress.org/advanced-administration/security/backup/)
- [`wp search-replace`](https://developer.wordpress.org/cli/commands/search-replace/)
- [WordPress Multisite administration](https://developer.wordpress.org/advanced-administration/multisite/administration/)
- [Migrate sites into WordPress Multisite](https://developer.wordpress.org/advanced-administration/multisite/sites-multisite/)
- [Hardening WordPress](https://developer.wordpress.org/advanced-administration/security/hardening/)

Last verified against official documentation: 2026-07-24.
