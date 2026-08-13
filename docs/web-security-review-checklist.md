# Web security review checklist

## Purpose

Use this checklist for a safe, non-destructive review of a website or web application. Use the current OWASP Top 10 for awareness and select an appropriate version of OWASP ASVS when detailed verification requirements are needed.

Use a qualified security reviewer or penetration tester for high-risk systems. Do not run destructive tests without written authorization.

## Define the review

- [ ] Get permission and record the systems, accounts, test window, contacts, and prohibited actions.
- [ ] Identify sensitive data, privileged functions, public entry points, and likely abuse cases.
- [ ] Choose the review depth based on exposure, data sensitivity, transactions, and user privileges.

## Automated and configuration checks

- [ ] Scan the release for exposed secrets, vulnerable dependencies, and unsafe configuration.
- [ ] Review unsupported software and check HTTPS, headers, cookies, errors, and administrative endpoints.
- [ ] Review automated findings manually before treating them as real issues.

## Accounts and access

- [ ] Confirm protected pages, data, files, and actions enforce authorization on the server.
- [ ] Test sign-in, sign-out, account recovery, password changes, and multifactor authentication.
- [ ] Confirm sessions end correctly and privileged accounts use least privilege.

## Input and important workflows

- [ ] Validate untrusted input on the server and encode output for where it is displayed.
- [ ] Restrict file uploads by type, size, storage location, and access when uploads are supported.
- [ ] Protect state-changing requests and test important workflows for tampering, skipped steps, and duplicate actions.
- [ ] Review APIs, webhooks, redirects, parsers, templates, and server-side requests when present.

## Configuration and data

- [ ] Keep secrets out of code and output, and disable debug features and unused services in production.
- [ ] Apply appropriate cookie settings and a tested Content Security Policy.
- [ ] Use supported cryptographic libraries and protocols; do not invent custom cryptography.
- [ ] Protect sensitive data and keep private files, backups, logs, storage, and management tools private.

## Detection and recovery

- [ ] Log important security events without secrets and send meaningful alerts to an owner.
- [ ] Confirm failures and unusual input do not expose data or bypass controls.
- [ ] Confirm backups, emergency patching, vulnerability reports, and credential rotation have owners.

## Finish the review

- [ ] Retest fixes and look for the same problem in shared code or related endpoints.
- [ ] Record untested areas, accepted risks, follow-up work, and any required ASVS mapping.

Security references last verified 2026-07-28 against OWASP Top 10:2025 and OWASP ASVS 5.0.0.

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

Last verified against official documentation: 2026-07-28.
