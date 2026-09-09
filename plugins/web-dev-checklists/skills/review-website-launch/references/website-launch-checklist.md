<!-- Generated from docs/website-launch-checklist.md by scripts/sync-skill-references.mjs. Do not edit this copy. -->

# Website launch checklist

## Purpose

Use this checklist for a new website, redesign, migration, or major release. Adjust it to the size and risk of the launch.

Complete specialist reviews before launch. At launch, confirm that their results still apply; do not rerun every review without a reason.

Use the [website development checklist](website-development-checklist.md) for the common build and configuration work that comes before this launch gate.

## Plan the launch

- [ ] Define what is launching and identify the exact release or commit.
- [ ] Choose the launch window and assign the people responsible for deployment, testing, communications, and rollback.
- [ ] Define what would stop the launch or trigger a rollback.
- [ ] Record known issues, approve accepted risks, and tell stakeholders what is changing.

## Confirm readiness

- [ ] Complete the reviews that apply to this launch: accessibility, security, performance, SEO, privacy, and release readiness.
- [ ] Confirm there are no unresolved launch-blocking findings.
- [ ] Test the release candidate in a production-like environment.
- [ ] Review the homepage, navigation, important pages, forms, search, downloads, and error pages.
- [ ] Remove test content, placeholder text, draft material, and environment-specific values.
- [ ] Set up and verify that the site can send emails.
- [ ] Confirm analytics, consent tools, important integrations, and production content are ready.

## Prepare the cutover

- [ ] Back up everything needed for recovery and confirm the backups can be restored.
- [ ] Write down the deployment, migration, smoke-test, and rollback steps.
- [ ] Rehearse high-risk migrations or deployment steps before launch.
- [ ] Prepare any DNS, certificate, redirect, or domain changes.
- [ ] Lower and later restore DNS TTLs when the cutover plan requires it.
- [ ] Confirm production access, monitoring, support, and any necessary change freeze are ready.

## Go or no-go

- [ ] Confirm the approved release, configuration, content, and rollback point have not changed.
- [ ] Review open issues, current incidents, and unavailable dependencies.
- [ ] Record the final go, delay, or no-go decision.

## Launch

- [ ] Deploy the approved release and any related database, content, DNS, or redirect changes.
- [ ] Remove maintenance mode, clear caches, and rebuild search indexes when the site is ready.
- [ ] Test critical pages, navigation, forms, email, search, authentication, and integrations.
- [ ] Confirm HTTPS, redirects, analytics, consent, canonicals, robots directives, and sitemaps.
- [ ] Watch monitoring and support reports, and record problems or launch decisions.

## After launch

- [ ] Repeat critical tests after DNS, caches, search, and scheduled work have settled.
- [ ] Check logs, monitoring, backups, forms, email, analytics, and scheduled jobs.
- [ ] Crawl the site for broken links, bad redirects, and indexing problems.
- [ ] Remove temporary settings and assign every remaining issue an owner.
- [ ] **Recommended:** Update the runbook and tests with useful lessons from the launch.

## Rollback or recovery

- [ ] Stop the launch and use the approved rollback plan when a rollback trigger is met.
- [ ] Roll back code, database, redirects, and DNS changes as needed.
- [ ] Confirm the recovered site works and reconcile data changed during the failed launch.
- [ ] Tell stakeholders what happened, the current status, and the next step.

## References

- [Web review findings reference](web-review-findings-reference.md)
- [Google site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [NIST contingency-planning resources](https://csrc.nist.gov/topics/security-and-privacy/security-programs-and-operations/contingency-planning)

Last verified against official documentation: 2026-07-28.
