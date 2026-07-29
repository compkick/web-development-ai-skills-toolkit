# Web application security review checklist

## Purpose

Use this checklist for a non-destructive, risk-based review of a website or web application's design, implementation, configuration, and operational security. Use the current OWASP Top 10 for awareness and select a project-appropriate, explicitly versioned subset of OWASP ASVS for detailed verification requirements.

Do not conduct intrusive scanning, exploit production systems, access data beyond authorization, or change security controls without explicit approval and a recovery plan. This checklist does not replace a threat model, penetration test, code review, or compliance assessment when those are required.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Authorization and risk model

- [ ] **Baseline requirement:** Record written authorization, environments, domains, APIs, roles, test accounts, data-handling limits, prohibited actions, test window, contacts, and stop conditions.
- [ ] **Baseline requirement:** Identify critical assets, sensitive data, trust boundaries, entry points, privileged actions, threat actors, abuse cases, dependencies, and material business impacts.
- [ ] **Baseline requirement:** Define the security requirements and verification depth from the system's exposure, data sensitivity, privileges, transactions, contractual obligations, and threat model.
- [ ] **Conditional requirement:** Coordinate a qualified penetration test or deeper architecture review for high-risk, internet-exposed, regulated, payment, identity, administrative, or materially changed systems.

## Automated review

- [ ] **Baseline requirement:** Run approved secret, dependency, static, configuration, and infrastructure checks against the exact release or commit and manually triage material findings.
- [ ] **Conditional requirement:** Run approved dynamic or API security tests in an environment and mode designed to tolerate them; exclude destructive payloads unless separately authorized.
- [ ] **Baseline requirement:** Inventory direct and transitive application, build, runtime, container, CMS, plugin, theme, and infrastructure dependencies and identify unsupported or vulnerable components.
- [ ] **Baseline requirement:** Review externally visible TLS, certificate, canonical-host redirect, DNS, HTTP header, cookie, error-response, and administrative endpoint configuration.

## Identity, sessions, and authorization

- [ ] **Baseline requirement:** Verify every sensitive operation and object enforces server-side authorization for the authenticated user, role, tenant, and object rather than relying on hidden controls or predictable identifiers.
- [ ] **Conditional requirement:** Test anonymous, lower-privileged, cross-account, cross-tenant, and stale-session access to protected pages, APIs, files, exports, and administrative actions.
- [ ] **Baseline requirement:** Verify account creation, authentication, multifactor authentication, recovery, credential change, lockout or throttling, and error messages do not enable practical account takeover or unnecessary enumeration.
- [ ] **Baseline requirement:** Verify session identifiers are unpredictable, rotated after authentication or privilege change, invalidated on logout and credential reset, expired appropriately, and protected in transport and storage.
- [ ] **Baseline requirement:** Verify administrator, service, integration, and emergency accounts use least privilege, named ownership, strong authentication, reviewed recovery paths, and auditable use.

## Input, output, and business logic

- [ ] **Baseline requirement:** Verify untrusted input is validated on the server and output is encoded for its actual HTML, attribute, URL, JavaScript, CSS, command, template, or other execution context.
- [ ] **Baseline requirement:** Verify database and operating-system operations use safe parameterization or APIs and cannot be influenced into injection by untrusted input.
- [ ] **Conditional requirement:** Verify file uploads restrict type, size, content, name, storage location, retrieval behavior, permissions, and processing; scan or isolate content according to risk.
- [ ] **Baseline requirement:** Verify state-changing browser requests have appropriate CSRF protection and APIs defend against cross-origin, replay, forgery, and confused-deputy risks appropriate to their authentication model.
- [ ] **Baseline requirement:** Test critical workflows for skipped steps, parameter tampering, duplicate or replayed actions, race conditions, limit bypass, negative quantities, and inconsistent failure handling.
- [ ] **Conditional requirement:** Verify parsers, deserialization, server-side fetches, redirects, templates, regular expressions, archives, and document or image processors handle attacker-controlled input safely when present.

## Browser, API, and configuration security

- [ ] **Baseline requirement:** Verify secrets and privileged configuration are absent from source control, build output, client code, URLs, analytics, errors, logs, and downloadable artifacts.
- [ ] **Baseline requirement:** Verify production disables debug output, sample or default applications, directory listing, unsafe methods, unused endpoints, permissive cross-origin rules, and unnecessary services.
- [ ] **Baseline requirement:** Verify cookies have the narrowest practical domain, path, lifetime, and appropriate `Secure`, `HttpOnly`, and `SameSite` attributes.
- [ ] **Baseline requirement:** Verify a tested Content Security Policy and appropriate security headers are applied consistently; enable HSTS only after HTTPS and subdomain scope are verified.
- [ ] **Conditional requirement:** Verify APIs enforce authentication, authorization, schema and size limits, pagination limits, rate or resource controls, safe errors, version policy, and scoped credentials.
- [ ] **Conditional requirement:** Verify webhooks and machine-to-machine calls authenticate peers, validate signatures and freshness, use least-privilege credentials, handle retries idempotently, and fail safely.
- [ ] **Baseline requirement:** Verify private files, backups, logs, source maps, storage buckets, monitoring, health, metrics, and management interfaces are not exposed beyond their intended audience.

## Cryptography, data, and resilience

- [ ] **Baseline requirement:** Verify approved, current cryptographic libraries and protocols protect sensitive data in transit and at rest where required; do not rely on custom cryptography.
- [ ] **Conditional requirement:** Verify key and secret generation, storage, access, rotation, revocation, backup, and compromise response when the application manages cryptographic material.
- [ ] **Baseline requirement:** Verify sensitive-data collection, storage, display, export, caching, logging, retention, and deletion are minimized and access-controlled.
- [ ] **Baseline requirement:** Verify security-relevant authentication, authorization, administrative, data-access, validation, and integrity events are logged without secrets or unnecessary personal data.
- [ ] **Baseline requirement:** Verify material security alerts reach an owned response path and that logs, clocks, retention, access controls, and incident evidence support investigation.
- [ ] **Baseline requirement:** Verify exceptional conditions, dependency failures, malformed input, resource exhaustion, timeouts, retries, and partial transactions fail predictably without exposing data or bypassing controls.
- [ ] **Baseline requirement:** Confirm verified backups and recovery procedures exist for security incidents and that emergency patching, vulnerability intake, disclosure, and credential rotation have named owners.

## Review conclusion

- [ ] **Baseline requirement:** Map reviewed controls and findings to the selected ASVS version and requirements when ASVS is part of the review scope.
- [ ] **Baseline requirement:** Retest fixes using the original evidence path and check for equivalent issues in shared components and related endpoints.
- [ ] **Baseline requirement:** Record untested attack surfaces, unavailable evidence, accepted risks, compensating controls, and the need for follow-up testing without representing an incomplete review as proof of security.

## References

Security references last verified 2026-07-25 against OWASP Top 10:2025 and OWASP ASVS 5.0.0.

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

Last verified against official documentation: 2026-07-25.
