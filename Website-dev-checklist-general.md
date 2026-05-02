# General website development checklist

## Development checklist

- Set up SSL certs
- Create and review sitemap
- Create navigation
- Create header and footer
- Create homepage
- Set up redirects (optional)
- Add page titles and meta data
- Add open graph tags
- Add canonical tags
- Configure error pages, 404 and 500
- Configure site email functionality
- Configure site search index
- Add tracking/cookie compliance (optional)
- Check licensing for fonts/images/plugins
- Develop responsive views
  - Desktop and laptop XL, default
  - Desktop XXL
  - Tablet
  - Phone
- Add robots.txt, per environment(s)
  - Dev
  - Prod
- Add favicons
- Add bundling and cache busting, css and JavaScript
- Configure caching (Sitefinity, Cloudflare, Azure, etc)?
- Set up environments (test / dev / prod / etc?)
- Set up environment syncing, if any
- Add analytics and tag manager
- Configure backups for site and database

## Pre-launch checklist

- Review homepage
- Review header and footer
- Review navigation and menus
- Review level one pages
- Review about page
- Review contact and form pages
- Check navigation links on level one and level two pages
- Delete or hide temporary/test pages
- Remove dummy content
- Check responsive views, mobile and tablet
- Review usability (optional)
- Check redirects (www and page-level)
- Audit backend users
- Set up site monitoring and down-detection (optional)
- Review cornerstone content
- Review backups
- For migrations - Shorten DNS A record TTL – 30 seconds, or minimum allowed by system

## Launch day checklist

- Review databases and move as necessary – dev / test / prod
- For migrations - Point DNS records to new server
- For migrations - enable redirects on old site
- New sites - Remove temporary "under development" home page
- Check urls, domain and www
- Test environment sync, if any
- Run search re-index
- Test analytics
- Test forms
- Test emails / notifications
- Check for dead links and missing pages – run SEO crawl

## Post-launch checklist

- Test forms
- Test site speed
- Submit to google and search engines
- Review content
- Review SEO
- Test backups
- Reset DNS record TTL – one hour or one day as per client

## Remediation/rollback plan for launch day

As necessary -

- Set temporary home page
- Disable migration redirects, if any
- Roll back release via pipeline (ADO, GitHub, bitbucket, etc)
- Roll back database to previous version
- Set robots.txt to disallow crawl
- Roll back DNS changes, point to old server
