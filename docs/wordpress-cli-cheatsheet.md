# WordPress WP-CLI cheatsheet

## Purpose

Use this cheatsheet for common WordPress inspection, maintenance, migration, and troubleshooting tasks. Run `wp help <command>` before using an unfamiliar command because available options can change with WP-CLI and installed command packages.

> **Safety:** Confirm the target site and environment before every write operation. Back up the database and relevant files before updates, imports, replacements, or deletions. Test material changes outside production, use least-privilege access, and never place credentials or database exports in source control.

## Confirm the target

```bash
wp cli info
wp core is-installed
wp core version
wp option get home
wp option get siteurl
```

Useful global parameters:

```bash
wp <command> --path=/path/to/wordpress
wp <command> --url=https://site.example
wp <command> --user=editor-login
wp <command> --ssh=user@host/path/to/wordpress
wp <command> --skip-plugins --skip-themes
wp <command> --debug
```

- Use `--path` when the shell is not in the WordPress root.
- Use `--url` to select a site in Multisite.
- Use `--skip-plugins` or `--skip-themes` for diagnosis when normal WordPress loading fails; must-use plugins still load.
- Treat `--ssh`, configured aliases, and production paths as live access, not as a safety boundary.

## Get help and inspect the installation

```bash
wp help core update
wp cli version
wp cli check-update
wp core check-update
wp plugin list
wp theme list
wp user list --fields=ID,user_login,roles
```

Use structured output for scripts instead of parsing display tables:

```bash
wp plugin list --format=json
wp plugin list --update=available --fields=name,version,update_version
wp theme list --update=available --fields=name,version,update_version
wp option get siteurl --format=json
```

## Back up and inspect the database

```bash
wp db check
wp db size
wp db tables
wp db export ../backup-before-change.sql
```

Import replaces data in the target database and should be treated as destructive:

```bash
wp db import ../reviewed-backup.sql
```

Confirm the export exists, is protected as sensitive data, and can be restored through the project's documented recovery process. Commands such as `wp db drop`, `wp db reset`, and `wp db clean` are intentionally omitted from this everyday cheatsheet.

## Update WordPress

Review available updates and the project release notes first. Take a backup, use maintenance mode when appropriate, and test the site after each logical update group.

```bash
wp maintenance-mode activate
wp core update
wp core update-db
wp plugin update --all
wp theme update --all
wp maintenance-mode deactivate
```

Do not blindly update every plugin or theme when the project requires pinned versions, commercial-package authentication, compatibility sequencing, or change approval.

Verify WordPress.org-distributed files when investigating unexpected changes:

```bash
wp core verify-checksums
wp plugin verify-checksums --all
```

Checksum success does not prove the entire site is safe. Custom or commercial plugins may not have WordPress.org checksums, and uploads, configuration, users, the database, and server files require separate review.

## Manage plugins and themes

```bash
wp plugin status
wp plugin activate plugin-slug
wp plugin deactivate plugin-slug
wp plugin install plugin-slug
wp theme status
wp theme activate theme-slug
wp theme install theme-slug
```

Before deleting a plugin or theme, confirm it is not active, network-active, a required parent theme, or needed for rollback:

```bash
wp plugin delete plugin-slug
wp theme delete theme-slug
```

## Search and replace safely

WP-CLI handles serialized data, making it safer than a raw SQL replacement for WordPress migrations. Always review a dry run first and keep the verified pre-change backup.

```bash
wp search-replace 'https://old.example' 'https://new.example' --all-tables-with-prefix --skip-columns=guid --dry-run
wp search-replace 'https://old.example' 'https://new.example' --all-tables-with-prefix --skip-columns=guid
```

- Use exact, quoted old and new values.
- Use `--all-tables-with-prefix` only when plugin tables with the WordPress prefix are intentionally in scope.
- Avoid `--all-tables` unless every table in the database has been inventoried and approved.
- Use `--network` for an intentional network-wide Multisite replacement.
- Recheck `home`, `siteurl`, content, media, widgets, forms, redirects, and serialized settings afterward.

To produce a transformed export without modifying the database:

```bash
wp search-replace 'https://old.example' 'https://new.example' --all-tables-with-prefix --skip-columns=guid --export=transformed.sql
```

## Cache, rewrites, and scheduled tasks

```bash
wp cache type
wp cache flush
wp rewrite flush
wp cron test
wp cron event list --fields=hook,next_run_gmt,next_run_relative
wp cron event run --due-now
```

Flushing a persistent object cache can affect every site in a Multisite network and can temporarily increase production load. A hard rewrite flush can modify `.htaccess`; use it only when that result is intended and supported by the server configuration. Running due cron events may send email, publish content, call external services, or start resource-intensive jobs.

## Users and sessions

```bash
wp user list --fields=ID,user_login,display_name,roles
wp user get editor-login
wp user session list editor-login
wp user application-password list editor-login
```

User creation, role changes, password resets, session destruction, and application-password creation are security-sensitive. Confirm authorization and use the exact command help before changing them:

```bash
wp help user create
wp help user set-role
wp help user reset-password
wp help user session destroy
wp help user application-password
```

## Multisite

```bash
wp site list --fields=blog_id,url,public,archived,deleted
wp plugin list --url=https://subsite.example
wp theme list --url=https://subsite.example
wp user list --url=https://subsite.example
```

Do not assume a command is network-wide. Use `--url` to select the intended site, and use `--network` only for commands whose documentation explicitly supports and requires it.

## Project aliases

WP-CLI can store reusable defaults and remote aliases in `wp-cli.yml`. Keep secrets out of the file.

```yaml
@staging:
  ssh: deploy@staging.example
  path: /var/www/html
  url: https://staging.example
```

Run a command through the alias:

```bash
wp @staging core version
```

Review an alias before using it for a write operation. A convenient name such as `@staging` or `@production` does not verify where it currently points.

## References

- [WP-CLI command reference](https://developer.wordpress.org/cli/commands/)
- [WP-CLI handbook](https://make.wordpress.org/cli/handbook/)
- [Global configuration and aliases](https://make.wordpress.org/cli/handbook/references/config/)
- [`wp core`](https://developer.wordpress.org/cli/commands/core/)
- [`wp plugin`](https://developer.wordpress.org/cli/commands/plugin/)
- [`wp theme`](https://developer.wordpress.org/cli/commands/theme/)
- [`wp db`](https://developer.wordpress.org/cli/commands/db/)
- [`wp search-replace`](https://developer.wordpress.org/cli/commands/search-replace/)
- [`wp cron`](https://developer.wordpress.org/cli/commands/cron/)
- [`wp user`](https://developer.wordpress.org/cli/commands/user/)

Last verified against official documentation: 2026-07-24.
