<!-- Generated from docs/web-security-review-checklist.md by scripts/sync-skill-references.mjs. Do not edit this copy. -->

# Web security review checklist

## Purpose

Use this checklist for a safe, non-destructive review of a website or web application. Run only the sections supported by the available access and record the rest as `Not checked`. A public website review can find important transport and configuration problems, but it cannot prove that authentication, authorization, application code, or operational controls are secure.

Use the current OWASP Top 10 for awareness and a risk-appropriate version of OWASP ASVS when detailed verification requirements are needed. Use a qualified security reviewer or penetration tester for high-risk systems. Do not run destructive tests or attempt to exploit a vulnerability without written authorization.

## Define the review

- [ ] Record the authorized targets, accounts, test window, contacts, and prohibited actions.
- [ ] Identify sensitive data, privileged functions, public entry points, and likely abuse cases.
- [ ] Choose and record the review sections based on exposure, data sensitivity, transactions, user privileges, and the evidence available.

## Public website baseline

- [ ] Confirm the canonical site loads over HTTPS with a certificate that is trusted, valid for the hostname, and within its validity dates.
- [ ] Confirm plain HTTP redirects to the canonical HTTPS URL without a downgrade or redirect loop.
- [ ] Confirm the site negotiates a strong cipher suite.
- [ ] Confirm the site uses a forward-secret key exchange.
- [ ] Confirm the site negotiates an approved key-exchange group.
- [ ] Confirm the site supports TLS 1.3 or TLS 1.2.
- [ ] Confirm the site rejects TLS 1.0 and TLS 1.1.
- [ ] Confirm pages, subresources, and form actions do not use insecure HTTP where HTTPS is required.
- [ ] Confirm production HTTPS responses send an HSTS policy with the project-approved duration and domain scope.
- [ ] Review the enforced Content Security Policy and record missing, invalid, or unnecessarily broad directives.
- [ ] Confirm responses restrict framing, prevent content-type sniffing, and use an appropriate referrer policy.
- [ ] Review cookies issued by public pages and confirm their `Secure`, `HttpOnly`, and `SameSite` settings match their purpose.
- [ ] Review CORS headers on sampled public responses and confirm they grant access only to intended origins, methods, headers, and credentials.
- [ ] Confirm normal responses and approved error pages do not reveal stack traces, debug details, private data, or unnecessary software versions.
- [ ] Recommended: publish a current `/.well-known/security.txt` file when the organization accepts vulnerability reports.

Record HTTP/2 or HTTP/3 support when it is useful, but do not fail a security review solely because a site uses HTTP/1.1. The public runner performs bounded TLS version handshakes and reviews the normally negotiated cipher and key exchange; it does not enumerate every cipher suite or test server cipher preference. Header checks and a Content Security Policy provide evidence, but they do not prove that the application is free of cross-site scripting or other injection vulnerabilities.

## Source and configuration

- [ ] Confirm runtimes, frameworks, plugins, and dependencies are supported and do not have unresolved vulnerabilities that exceed the project's risk tolerance.
- [ ] Scan the release for exposed secrets and unsafe production configuration without copying secret values into the review evidence.
- [ ] Confirm production debug features and unused services are disabled and known management, diagnostic, backup, and storage endpoints are appropriately restricted.
- [ ] Confirm authorization for protected pages, data, files, object identifiers, and actions is enforced on the server.
- [ ] Confirm untrusted input is validated on the server and output is encoded or sanitized for the context where it is used.
- [ ] Confirm file uploads restrict type, size, storage location, execution, and access when uploads are supported.
- [ ] Confirm state-changing requests have appropriate CSRF protection and important workflows resist tampering, skipped steps, and duplicate actions.
- [ ] Review applicable APIs, webhooks, redirects, parsers, templates, and server-side requests for injection, unsafe destinations, and unintended access.
- [ ] Confirm the application uses supported cryptographic libraries and protocols and does not implement custom cryptography.
- [ ] Confirm sensitive data and private files are protected in storage, caches, logs, exports, backups, and management tools.

## Authenticated behavior

- [ ] Using approved test accounts, test sign-in, sign-out, account recovery, password changes, and multifactor authentication when supported.
- [ ] Confirm roles, privileged accounts, and service accounts have only the access they require.
- [ ] Test representative roles and object identifiers to confirm users cannot access another user's data or perform privileged actions.
- [ ] Confirm sessions rotate when privilege changes, expire as intended, become invalid after sign-out, and use appropriately protected cookies.
- [ ] Test important workflows for unauthorized changes, skipped steps, repeated submissions, and failures that expose data or bypass controls.

## Operations and recovery

- [ ] Confirm important security events are logged and that logs do not contain secrets.
- [ ] Confirm that meaningful alerts reach an owner.
- [ ] Confirm emergency patching, vulnerability reports, incident response, and credential rotation have owners and usable procedures.
- [ ] Confirm backups are protected and restoration has been tested.

## Finish the review

- [ ] Review automated findings manually before treating them as confirmed issues.
- [ ] Retest fixes and look for the same problem in shared code or related endpoints.
- [ ] Record evidence, untested areas, accepted risks, follow-up work, owners, and any required ASVS mapping.

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Application Security Verification Standard](https://owasp.org/projects/asvs)
- [OWASP HTTP Security Response Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)
- [MDN Transport Layer Security](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Transport_Layer_Security)
- [RFC 9325 Recommendations for Secure Use of TLS](https://www.rfc-editor.org/rfc/rfc9325.html)
- [RFC 9116 security.txt specification](https://www.rfc-editor.org/rfc/rfc9116.html)

Last verified against official documentation: 2026-08-21. Current stable references at verification: OWASP Top 10:2025 and OWASP ASVS 5.0.0.
