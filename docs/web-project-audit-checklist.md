# Web project audit checklist

## Purpose

Use this checklist for a bounded, cross-discipline assessment of an existing website or web application and its repository. It identifies material risks, missing evidence, and the specialist reviews needed next; it is not a compressed substitute for those reviews.

Agree on the audit question before starting. A repository audit, production-site audit, acquisition review, modernization assessment, and release review require different access and evidence.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Audit scope and context

- [ ] **Baseline requirement:** Record the audit objective, decision it will support, system boundaries, environments, release or commit, stakeholders, access limits, exclusions, timeline, and accountable owner.
- [ ] **Baseline requirement:** Identify the site's purpose, primary audiences, critical journeys, business or public-service impact, sensitive data, availability needs, and success measures.
- [ ] **Baseline requirement:** Identify applicable laws, contracts, accessibility requirements, security policies, privacy obligations, retention rules, browser support, and organizational standards with qualified owners.
- [ ] **Baseline requirement:** Inventory applications, CMSs, repositories, hosting, infrastructure, data stores, identity, email, search, analytics, domains, certificates, vendors, integrations, and support ownership.
- [ ] **Baseline requirement:** Record unavailable systems or evidence as limitations; do not infer a pass from lack of access or documentation.

## Repository and delivery health

- [ ] **Baseline requirement:** Verify the repository has current setup, build, test, deployment, rollback, architecture, ownership, and contribution guidance sufficient for a new maintainer.
- [ ] **Baseline requirement:** Reproduce the supported setup and production build from the documented prerequisites and locked inputs without relying on unrecorded local state or secrets.
- [ ] **Baseline requirement:** Run the project's formatting, linting, type, test, build, dependency, secret, security, and documentation checks and triage failures.
- [ ] **Baseline requirement:** Review branch protections, change review, release traceability, environment separation, secret handling, deployment permissions, and production access.
- [ ] **Baseline requirement:** Verify non-production systems are access-controlled as needed and cannot expose production data, become unintentionally indexable, send real communications or transactions, or pollute production analytics.
- [ ] **Conditional requirement:** Apply the [agent-ready repository checklist](agent-ready-repository-checklist.md) when coding agents are expected to work safely and independently in the repository.

## Architecture and maintainability

- [ ] **Baseline requirement:** Compare the documented architecture with deployed reality and identify unsupported runtimes, frameworks, CMS versions, plugins, themes, services, or infrastructure.
- [ ] **Baseline requirement:** Review trust boundaries, privileged paths, data flows, external dependencies, failure modes, scaling constraints, and single points of failure with the responsible technical owner.
- [ ] **Baseline requirement:** Identify duplicated systems, dead code, unused dependencies, temporary workarounds, fragile manual steps, and high-change areas that materially increase support risk.
- [ ] **Baseline requirement:** Review automated test coverage against critical journeys and failure modes rather than relying on test counts or percentage alone.
- [ ] **Conditional requirement:** Record modernization constraints, compatibility dependencies, data migration needs, vendor lock-in, and safe sequencing when replacement or replatforming is being considered.

## User-facing quality

- [ ] **Baseline requirement:** Exercise the homepage, navigation, search, representative content, forms, authentication, critical transactions, error states, and supported responsive layouts.
- [ ] **Baseline requirement:** Check for broken links, browser errors, failed requests, mixed content, placeholder or stale content, inconsistent URLs, and unexpected environment-specific values.
- [ ] **Baseline requirement:** Route material accessibility questions through the [web accessibility review checklist](web-accessibility-review-checklist.md).
- [ ] **Baseline requirement:** Route material security questions through the [web application security review checklist](web-security-review-checklist.md).
- [ ] **Baseline requirement:** Route material performance questions through the [web performance review checklist](web-performance-review-checklist.md).
- [ ] **Baseline requirement:** Route material crawl and indexing questions through the [technical SEO review checklist](technical-seo-review-checklist.md).
- [ ] **Conditional requirement:** Apply the [privacy and data-handling review checklist](web-privacy-data-handling-review-checklist.md) when personal, sensitive, behavioral, or regulated data is collected or shared.

## Operational sustainability

- [ ] **Baseline requirement:** Verify domain, certificate, hosting, vendor, license, integration, and privileged-account ownership and renewal paths are current.
- [ ] **Baseline requirement:** Verify backups cover required code, data, media, configuration, and infrastructure and that a representative restore has been tested.
- [ ] **Baseline requirement:** Review production monitoring, logging, alerting, incident response, support escalation, recovery objectives, capacity, maintenance, patching, and vulnerability response.
- [ ] **Baseline requirement:** Apply the [production observability and operations checklist](production-observability-operations-checklist.md) when operational readiness or reliability is part of the audit decision.
- [ ] **Conditional requirement:** Apply the [CMS content governance checklist](cms-content-governance-checklist.md) when content ownership, editorial workflow, quality, retention, or lifecycle materially affects the system.

## Audit conclusion

- [ ] **Baseline requirement:** Consolidate duplicate symptoms into root-cause findings and distinguish demonstrated failures, incomplete evidence, accepted debt, and optional improvements.
- [ ] **Baseline requirement:** Prioritize findings by user and business impact, exploitability or likelihood, breadth, recovery difficulty, and dependency order rather than tool severity alone.
- [ ] **Baseline requirement:** Provide a small set of sequenced next actions, named owners, target dates, validation steps, and any specialist review required before a material decision.
- [ ] **Baseline requirement:** State what the audit did not establish and avoid unsupported claims of compliance, accessibility conformance, security, performance, or production readiness.

## References

- [Web development and CMS coding standards](web-coding-standards.md)
- [NIST Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [OWASP Top 10](https://owasp.org/Top10/)
- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)

Last verified against official documentation: 2026-07-25.
