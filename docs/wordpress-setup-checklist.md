# WordPress setup checklist

## Purpose

Use this checklist to establish and verify a maintainable self-hosted WordPress site before feature development or content entry is considered ready. Adapt it to the site's risk, hosting model, editorial workflow, and whether it is a single site or Multisite network. Mark non-applicable items explicitly.

This checklist covers WordPress-specific setup. Also apply the [web coding standards](web-coding-standards.md), [website development checklist](website-development-checklist.md), and general launch checklist.

## Scope and ownership

- [ ] Document the site's purpose, critical journeys, content model, integrations, expected traffic, data sensitivity, and availability needs.
- [ ] Confirm whether the installation is single-site or Multisite and document the reason for that architecture.
- [ ] Assign technical, hosting, domain, content, security, privacy, backup, incident, and renewal ownership.
- [ ] Record the supported WordPress, PHP, database, browser, and assistive-technology policy.
- [ ] Identify applicable accessibility, privacy, security, retention, licensing, and contractual requirements.

## Environments, repository, and delivery

- [ ] Establish the necessary local, development, staging, and production environments and document material differences.
- [ ] Set `WP_ENVIRONMENT_TYPE` accurately for each environment and confirm environment-dependent behavior fails safely.
- [ ] Protect non-production environments with authentication or network controls and prevent unintended indexing, analytics, email, and external writes.
- [ ] Define what belongs in source control, including custom themes, plugins, must-use plugins, configuration templates, dependency manifests, lockfiles, and deployment scripts.
- [ ] Exclude secrets, generated caches, logs, backup archives, authentication exports, and environment-specific uploads from source control.
- [ ] Store credentials and environment configuration in approved systems rather than committed `wp-config.php` values or browser-delivered code.
- [ ] Document code, database, media, configuration, and content synchronization directions; prevent an automated workflow from overwriting newer production data.
- [ ] Configure CI to run the relevant formatting, linting, tests, build, dependency, security, and documentation checks.
- [ ] Produce a traceable release artifact or commit and document the deployment and rollback process.

## Hosting, runtime, and domain

- [ ] Verify the host meets WordPress's current recommended PHP, database, HTTPS, and server requirements and supports every required theme, plugin, and integration.
- [ ] Confirm PHP extensions, memory, execution time, upload limits, storage, database capacity, and traffic limits are appropriate for the site.
- [ ] Configure the database character set and collation appropriately and restrict the database account to the required database.
- [ ] Configure HTTPS, the canonical scheme and host, HTTP-to-HTTPS redirects, and certificate renewal.
- [ ] Verify web-server rewrites, permalink support, file ownership, and permissions without making application files broadly writable.
- [ ] Configure production error handling so errors are logged securely and are not displayed to visitors.
- [ ] Provide secure administrative access through the hosting platform and WP-CLI where needed; use SSH or SFTP rather than unencrypted transfer.

## WordPress configuration and access

- [ ] Obtain WordPress core, themes, and plugins from approved, trustworthy sources and do not modify WordPress core files.
- [ ] Generate unique authentication keys and salts, protect `wp-config.php`, and define a controlled process for rotating exposed secrets.
- [ ] Create named administrator accounts, require strong authentication, and enable multifactor authentication when the project's risk and tooling support it.
- [ ] Assign the lowest practical WordPress role or custom capability set to each editor, author, integration, and service account.
- [ ] Remove unused accounts and installation-time credentials and verify account-recovery addresses.
- [ ] Enable and protect only the public registration, comments, APIs, and remote-publishing features the site needs.
- [ ] Decide whether production administrators may install, update, or edit code from the dashboard; disable file editing when code is managed through deployment.
- [ ] Define WordPress core, theme, and plugin update responsibilities, test requirements, maintenance windows, and emergency security-update process.
- [ ] Enable vulnerability and update monitoring appropriate to the hosting model and review material findings.
- [ ] Review Tools > Site Health and resolve or document material issues.

## Themes, plugins, content, and URLs

- [ ] Select an actively maintained theme architecture and document child-theme, block-theme, or custom-theme responsibilities.
- [ ] Install only required plugins, confirm current support and licensing, and document the owner and purpose of each material plugin.
- [ ] Remove inactive themes and plugins that are not retained intentionally for rollback or troubleshooting.
- [ ] Test the approved theme and plugin combination in a non-production environment before production updates.
- [ ] Define content types, taxonomies, block patterns, templates, menus, widgets, reusable content, and editorial permissions.
- [ ] Configure the permalink structure, canonical URLs, redirect ownership, XML sitemaps, and environment-appropriate search visibility.
- [ ] Configure media sizes, allowed upload types, storage, optimization, responsive images, and any external media service.

## Email, scheduling, caching, privacy, and operations

- [ ] Configure transactional email through an approved SMTP or email API service and verify sender-domain authentication, routing, and failure visibility.
- [ ] Review scheduled tasks and use a system scheduler when WP-Cron is not reliable enough.
- [ ] Configure page caching, browser caching, CDN behavior, and persistent object caching only where the architecture benefits, with documented exclusions and invalidation.
- [ ] Configure analytics, tag management, cookies, consent, privacy notices, data retention, and data-subject workflows according to approved requirements.
- [ ] Configure backups for the database, uploads, custom code, and required configuration; store copies outside the application host.
- [ ] Complete and record a restore test that verifies the site can be recovered, not merely that backup files exist.
- [ ] Configure uptime, certificate, domain, backup, security, application-error, and critical-journey monitoring with owned alerts.
- [ ] Document routine maintenance, incident response, renewal, recovery, and vendor-escalation procedures.

## Initial quality baseline

- [ ] Verify the homepage, representative templates, navigation, search, forms, email, authentication, editor, media, scheduled tasks, and error handling.
- [ ] Establish an accessibility baseline with automated and manual checks on representative frontend and administrative workflows.
- [ ] Establish performance budgets and record representative lab results before adding avoidable third-party code.
- [ ] Crawl the site and record the initial technical SEO, redirects, metadata, canonical, sitemap, and indexing state.
- [ ] Review WordPress, hosting, theme, plugin, account, secret, file-permission, and public-endpoint security before accepting the setup.
- [ ] Record unresolved risks, accepted exceptions, owners, and target dates.

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
