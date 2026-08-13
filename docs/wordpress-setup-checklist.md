# WordPress setup checklist

## Purpose

Use this checklist to set up a maintainable self-hosted WordPress site. Mark items that do not apply.

Also use the [web coding standards](web-coding-standards.md), [website development checklist](website-development-checklist.md), and [WordPress launch checklist](wordpress-launch-checklist.md).

## Plan the site

- [ ] Document the site's purpose, important user journeys, content types, integrations, and expected traffic.
- [ ] Decide whether the installation will be single-site or Multisite.
- [ ] Assign owners for hosting, domains, content, security, privacy, backups, and maintenance.
- [ ] Record the supported WordPress, PHP, database, and browser versions.
- [ ] Identify accessibility, privacy, security, licensing, and retention requirements.

## Set up environments and source control

- [ ] Create the local, development, staging, and production environments the project needs.
- [ ] Set `WP_ENVIRONMENT_TYPE` correctly in each environment.
- [ ] Protect non-production sites from public access and search indexing.
- [ ] Prevent non-production sites from sending real email, webhooks, payments, or analytics.
- [ ] Put custom themes, plugins, configuration templates, dependency files, and deployment scripts in source control.
- [ ] Keep secrets, uploads, caches, logs, and backups out of source control.
- [ ] Document how code, database, media, and content move between environments.
- [ ] Document the deployment and rollback process.

## Configure hosting

- [ ] Confirm the host meets the current WordPress requirements.
- [ ] Confirm the host has the PHP extensions, memory, upload limits, storage, and database capacity the site needs.
- [ ] Configure HTTPS, the preferred domain, redirects, and certificate renewal.
- [ ] Configure permalinks and web-server rewrite rules.
- [ ] Set appropriate file ownership and permissions.
- [ ] Log production errors without displaying them to visitors.
- [ ] Set up secure SSH, SFTP, hosting, and WP-CLI access as needed.

## Configure WordPress and access

- [ ] Install WordPress, themes, and plugins from trusted sources.
- [ ] Do not modify WordPress core files.
- [ ] Generate unique authentication keys and salts.
- [ ] Protect `wp-config.php` and keep secrets out of the repository.
- [ ] Create named administrator accounts with strong authentication.
- [ ] Give editors, authors, integrations, and service accounts only the permissions they need.
- [ ] Remove unused accounts and installation-time credentials.
- [ ] Enable only the registration, comments, APIs, XML-RPC, and remote-publishing features the site needs.
- [ ] Disable dashboard file editing when code is managed through deployment.
- [ ] Define how WordPress, themes, and plugins will be updated and tested.
- [ ] Set up update and vulnerability monitoring.
- [ ] Review Site Health. Note and address any issues.

## Configure themes, plugins, and content

- [ ] Choose an actively maintained theme or theme architecture.
- [ ] Install only the plugins the site needs.
- [ ] Record the purpose, owner, support status, and license for important plugins.
- [ ] Remove unused themes and plugins.
- [ ] Test the complete theme and plugin combination outside production.
- [ ] Configure content types, taxonomies, templates, menus, patterns, and editor permissions.
- [ ] Configure permalinks, redirects, canonicals, XML sitemaps, and search visibility.
- [ ] Configure media sizes, upload types, storage, and image optimization.

## Configure services and operations

- [ ] Set up site email through an approved SMTP or email service.
- [ ] Test email delivery and failure reporting.
- [ ] Review scheduled tasks and use a system scheduler when WP-Cron is not reliable enough.
- [ ] Configure page, browser, CDN, and object caching only where needed.
- [ ] Configure analytics, tag management, cookies, and consent when required.
- [ ] Back up the database, uploads, custom code, and required configuration.
- [ ] Store backup copies outside the application host.
- [ ] Test a restore.
- [ ] Set up monitoring for uptime, errors, domains, certificates, backups, and important user journeys.
- [ ] Document routine maintenance and incident-response contacts.

## Initial test

- [ ] Test the homepage, templates, navigation, search, forms, email, login, editing, media, and scheduled tasks.
- [ ] Run an accessibility check on representative pages and editing workflows.
- [ ] Record an initial performance baseline.
- [ ] Crawl the site for broken links and technical SEO problems.
- [ ] Record unresolved issues and assign owners.

## References

WordPress runtime requirements last verified 2026-07-24: PHP 8.3 or greater, MariaDB 10.11 or greater or MySQL 8.0 or greater, and HTTPS. Recheck the official requirements before using these values for a project.

- [WordPress requirements](https://wordpress.org/about/requirements/)
- [How to install WordPress](https://developer.wordpress.org/advanced-administration/before-install/howto-install/)
- [Hardening WordPress](https://developer.wordpress.org/advanced-administration/security/hardening/)
- [WordPress backups](https://developer.wordpress.org/advanced-administration/security/backup/)
- [`wp_get_environment_type()`](https://developer.wordpress.org/reference/functions/wp_get_environment_type/)
- [WordPress roles and capabilities](https://developer.wordpress.org/apis/security/user-roles-and-capabilities/)
- [WordPress Site Health](https://wordpress.org/documentation/site-health/)
- [WordPress Cron](https://developer.wordpress.org/plugins/cron/)

Last verified against official documentation: 2026-07-24.
