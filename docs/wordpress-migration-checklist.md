# WordPress migration checklist

## Purpose

Use this checklist when moving a self-hosted WordPress site to another host, server, domain, protocol, path, or installation model.

Rehearse the migration and prepare a rollback before changing production. Mark items that do not apply.

## Plan the migration

- [ ] Record the source, destination, URL changes, expected downtime, and launch date.
- [ ] Confirm whether the site is single-site or Multisite.
- [ ] Choose the migration method and assign the people responsible for it.
- [ ] Decide when content changes must stop.
- [ ] Decide how orders, form entries, users, uploads, and other new data will be handled during the move.
- [ ] Write down the rollback steps and the point when rollback will no longer be practical.
- [ ] Rehearse the migration on staging.

## Review the current site

- [ ] Review Site Health in WordPress. Note and address any issues.
- [ ] Review users and roles. Remove accounts and permissions that are no longer needed.
- [ ] Review active and inactive themes and plugins. Remove anything that is no longer needed.
- [ ] Confirm required themes, plugins, licenses, and custom code will work on the new host.
- [ ] Review forms, email, search, analytics, scheduled tasks, webhooks, payments, and other integrations.
- [ ] Check the database size, uploads size, PHP version, database version, and storage needs.
- [ ] Confirm the destination meets the current WordPress requirements.
- [ ] Review `.htaccess`, `wp-config.php`, redirects, DNS records, and environment-specific settings.

## Prepare backups and the destination

- [ ] Back up the database, uploads, custom code, configuration, redirects, and DNS records.
- [ ] Store a backup outside the current host.
- [ ] Test that the backup can be restored.
- [ ] Create a restore point on the destination before importing the site.
- [ ] Set up the destination database, storage, HTTPS, logging, monitoring, and WP-CLI access.
- [ ] Prevent the destination from sending real email, payments, webhooks, analytics, or search-indexing signals during testing.
- [ ] Disable or bypass caching when it could hide migration changes.

## Move the site

- [ ] Transfer the database and files through SSH, SFTP, or another encrypted method.
- [ ] Import the database using a method suitable for its size and the destination host.
- [ ] Transfer the WordPress files and uploads without moving old caches, logs, or backup archives.
- [ ] Update database credentials, URLs, paths, environment settings, and secrets.
- [ ] Set appropriate file ownership and permissions.
- [ ] Recreate `.htaccess` rules in the server configuration when moving to Nginx or another server that does not use `.htaccess`.
- [ ] Test the destination before sending normal visitors to it.

## Update URLs

- [ ] Back up the imported database before changing URLs.
- [ ] Dry-run URL changes with a serialized-data-aware tool such as `wp search-replace`.
- [ ] Review the dry-run results before applying them.
- [ ] Do not run a blanket text replacement on the SQL export.
- [ ] Check WordPress Address, Site Address, content, menus, widgets, theme settings, plugin settings, and media URLs afterward.
- [ ] Review network domains, paths, users, and rewrite rules separately for Multisite.

```bash
# Preview changes
wp search-replace 'https://old.example' 'https://new.example' --all-tables-with-prefix --skip-columns=guid --dry-run

# Apply reviewed changes
wp search-replace 'https://old.example' 'https://new.example' --all-tables-with-prefix --skip-columns=guid
```

## Cut over to the new site

- [ ] Start the content freeze or maintenance window.
- [ ] Stop duplicate email, scheduled tasks, webhooks, payments, and other background work.
- [ ] Create and verify the final source backup.
- [ ] Run the rehearsed file, database, configuration, and URL-change steps.
- [ ] Confirm HTTPS works on the destination.
- [ ] Update DNS, CDN, load-balancer, and redirect settings as planned.
- [ ] Re-enable email, scheduled tasks, integrations, analytics, consent tools, caching, and monitoring.
- [ ] Clear caches and rebuild search indexes.

## Test the migrated site

- [ ] Test the homepage, navigation, important pages, forms, email, search, login, editing, and publishing.
- [ ] Confirm the expected theme and plugins are active and licensed.
- [ ] Review Site Health again. Note and address any new issues.
- [ ] Review PHP, JavaScript, server, cron, and integration errors.
- [ ] Check for old domains, staging URLs, localhost values, mixed content, and broken media.
- [ ] Crawl the site for broken links, bad redirects, missing pages, and indexing problems.
- [ ] Test backups and monitoring on the destination.
- [ ] Monitor traffic, errors, email, scheduled tasks, integrations, and support reports.

## Finish or roll back

- [ ] Restore temporary DNS TTL settings after the rollback window has passed.
- [ ] Keep the old site available in a restricted or read-only state until the rollback window ends.
- [ ] Roll back when an agreed rollback trigger is met.
- [ ] Reconcile any content, orders, users, submissions, or uploads created during a failed migration.
- [ ] Decommission the old host only after the migration is approved and required data is retained.

## References

WordPress runtime requirements last verified 2026-07-24: PHP 8.3 or greater, MariaDB 10.11 or greater or MySQL 8.0 or greater, and HTTPS. Recheck the official requirements before using these values for a migration.

- [Moving WordPress](https://developer.wordpress.org/advanced-administration/upgrade/migrating/)
- [WordPress requirements](https://wordpress.org/about/requirements/)
- [WordPress backups](https://developer.wordpress.org/advanced-administration/security/backup/)
- [`wp search-replace`](https://developer.wordpress.org/cli/commands/search-replace/)
- [WordPress Multisite administration](https://developer.wordpress.org/advanced-administration/multisite/administration/)
- [Hardening WordPress](https://developer.wordpress.org/advanced-administration/security/hardening/)

Last verified against official documentation: 2026-07-24.
