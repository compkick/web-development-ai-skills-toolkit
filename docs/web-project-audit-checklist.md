# Web project audit checklist

## Purpose

Use this checklist for a practical review of an existing website, application, or repository. Agree on the question the audit needs to answer and use only the sections that help answer it.

## Define the audit

- [ ] Write down the audit goal, scope, environment, owner, and deadline.
- [ ] Identify the site's purpose, users, critical journeys, sensitive data, and major systems.
- [ ] Record any missing access or evidence as a limitation, not a pass.

## Review the repository

- [ ] Confirm the README explains how to set up, run, test, build, and deploy the project.
- [ ] Build the project and run its normal checks when repository health is in scope.
- [ ] Review dependency support, secret handling, branch protection, and production access.
- [ ] Confirm non-production environments are private and do not use production data unexpectedly.
- [ ] Use the [agent-ready repository checklist](agent-ready-repository-checklist.md) when coding agents will work in the repository.

## Review the implementation

- [ ] Compare the documented architecture with what is deployed and note major maintenance risks.
- [ ] Review test coverage for important user journeys and failure cases.

## Review the website

- [ ] Test important pages and journeys on representative desktop and mobile layouts.
- [ ] Look for broken links, browser errors, failed requests, mixed content, and stale content.
- [ ] Use the accessibility, security, performance, SEO, or privacy checklist when that area needs a deeper review.

## Review operations

- [ ] Confirm ownership of hosting, domains, certificates, vendors, and administrator accounts.
- [ ] Confirm the site is backed up and a representative restore has been tested.
- [ ] Review monitoring, logging, support, incident response, patching, and vulnerability handling.
- [ ] Review content ownership and publishing workflow when a CMS is in scope.

## Finish the audit

- [ ] Group related problems and separate confirmed failures from missing evidence and optional improvements.
- [ ] Prioritize findings by user impact, security risk, effort, and urgency.
- [ ] Give every accepted finding an owner and record any untested areas or follow-up reviews.

## References

- [Web review findings reference](web-review-findings-reference.md)
- [OWASP Top 10](https://owasp.org/Top10/)
- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)

Last verified against official documentation: 2026-07-28.
