WordPress migration checklist

# Pre-migration

- Review site health
- Review plugins
- Remove or disable unnecessary plugins
- Disable caching plugins
- Sweep and clean database
- Review and audit user accounts
- Review email and site contact settings
- Shorten DNS A record TTL

# Migration

- Export database as sql file from old host
- Download site files from old host
- Review .htaccess
- Review wp-config.php in WP install root
  - If moving domains - define 'wp_home' and 'wp_siteurl' variables
  - Update database settings
- Update database export sql – wp_options table, 'siteurl' and 'home'
- Upload database to new host
  - Usually this is via phpMyAdmin or mysql import
- Upload site files to new host
  - Via ftps or SSH – some hosts allow a zip or tar.gz import
- If moving domains - Install Better Search and Replace plugin
  - Replace old domain with new domain
  - Other option use a text editor to search/replace domains in sql file, pre import to new host
- Update email and site contact settings – use SMTP plugin if necessary
- Set up new server and repoint DNS record

NOTE: if migrating from Apache to Nginx, htaccess will not work. Rewrite custom htaccess in nginx conf files

# Post-migration

- Test home page
- Test navigation and links
- Test tier one and tier two pages
- Test contact form(s)
- Log in and test wp-admin
- Review site health
- Review plugins
- Reset DNS record TTL to default
- Optional – crawl site with spider tool, check for dead links and SEO issues
