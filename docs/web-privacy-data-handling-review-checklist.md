# Privacy and data-handling review checklist

## Purpose

Use this checklist to review personal, sensitive, behavioral, and regulated data handled by a website or web application. Apply it early enough to change collection, architecture, vendors, and user experience—not only after implementation.

This is not legal advice. Privacy requirements depend on the organization, people, data, purposes, jurisdictions, contracts, and sector. A qualified privacy or legal owner must determine applicable obligations and approve required notices, consent behavior, rights processes, retention, and transfer mechanisms.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Applicability and data inventory

- [ ] **Baseline requirement:** Record the organization and product roles, intended users, relevant jurisdictions, privacy owner, systems, environments, vendors, and decision being reviewed.
- [ ] **Baseline requirement:** Inventory data collected, inferred, generated, received, stored, displayed, logged, exported, deleted, or shared through forms, accounts, content, cookies, browser storage, analytics, support, and integrations.
- [ ] **Baseline requirement:** Classify data sensitivity and identify data about children, health, finances, precise location, identity, authentication, employment, protected characteristics, communications, or other heightened-risk categories.
- [ ] **Baseline requirement:** Map each material data flow from collection through internal systems, processors, vendors, locations, backups, archives, and deletion, including server-side and browser-side transfers.
- [ ] **Conditional requirement:** Complete the organization's privacy impact or risk assessment when new technology, monitoring, profiling, sensitive data, vulnerable users, large-scale processing, or another policy trigger applies.

## Purpose, minimization, and transparency

- [ ] **Baseline requirement:** Record the approved purpose and applicable legal or policy basis for each material collection, use, disclosure, and retention activity with qualified review.
- [ ] **Baseline requirement:** Remove data fields, precision, identifiers, copies, logs, and retention that are not necessary for the approved purpose.
- [ ] **Baseline requirement:** Verify personal data is not repurposed, combined, sold, shared, or used for automated decisions beyond what was approved and communicated.
- [ ] **Baseline requirement:** Verify privacy notices are findable, understandable, current, and accurately describe material collection, purposes, recipients, retention, rights, and contact paths.
- [ ] **Conditional requirement:** Explain material automated decisions, profiling, personalization, recording, session replay, artificial-intelligence processing, or sensitive inferences as required by approved policy and applicable law.

## Choice, consent, and user controls

- [ ] **Conditional requirement:** Verify consent is requested before the applicable processing, is specific and informed, is not obtained through deceptive design, and can be demonstrated when consent is the approved basis.
- [ ] **Conditional requirement:** Verify refusing or withdrawing optional consent is as usable as granting it and stops future nonessential processing without breaking unrelated required service.
- [ ] **Conditional requirement:** Test cookie, tag, advertising, analytics, preference, and global privacy controls across first visit, refusal, acceptance, partial choice, withdrawal, expiry, and changed notice states.
- [ ] **Baseline requirement:** Verify user-facing privacy choices are honored consistently by client code, servers, tag managers, vendors, mobile views, and authenticated or anonymous states.
- [ ] **Baseline requirement:** Verify required service does not depend on unnecessary personal data or bundled optional permission unless qualified review has approved that design.

## Access, security, vendors, and transfers

- [ ] **Baseline requirement:** Restrict access to personal and sensitive data by role, purpose, environment, and time; review privileged, support, vendor, and machine access.
- [ ] **Baseline requirement:** Protect data appropriately in transit, at rest, in backups, in exports, and in non-production; exclude secrets and unnecessary personal data from logs and analytics.
- [ ] **Baseline requirement:** Verify production personal data is not copied into development, testing, demonstrations, or support tools without an approved necessity and safeguards.
- [ ] **Baseline requirement:** Inventory processors and other recipients and verify approved contracts, instructions, security expectations, deletion or return terms, incident duties, and subprocessor visibility.
- [ ] **Conditional requirement:** Verify approved international or cross-entity transfer requirements and geographic storage or access restrictions with qualified review.

## Retention, rights, and incidents

- [ ] **Baseline requirement:** Define and implement retention and deletion rules by data category and system, including logs, analytics, vendor copies, backups, abandoned accounts, and failed submissions.
- [ ] **Baseline requirement:** Test applicable access, correction, deletion, export, restriction, objection, and consent-withdrawal workflows end to end, including identity verification and downstream vendors.
- [ ] **Baseline requirement:** Verify user requests and deletions are logged sufficiently for accountability without retaining the deleted content unnecessarily.
- [ ] **Baseline requirement:** Verify privacy and security incident procedures identify responsible decision makers, preserve evidence, assess affected data and people, coordinate vendors, and meet qualified notification decisions.
- [ ] **Conditional requirement:** Verify records-management, legal hold, fraud, safety, or contractual retention exceptions are narrow, documented, access-controlled, and reviewed.

## Validation and maintenance

- [ ] **Baseline requirement:** Inspect network requests, browser storage, server logs, tag-manager output, vendor dashboards, forms, exports, and deletion behavior rather than relying only on written policies.
- [ ] **Baseline requirement:** Recheck the review when data, purpose, audience, jurisdiction, vendor, tracking, authentication, or automated decision behavior materially changes.
- [ ] **Baseline requirement:** Record unresolved legal questions separately from technical findings and do not label the system compliant without the required qualified determination.

## References

- [NIST Privacy Framework](https://www.nist.gov/privacy-framework)
- [FTC privacy and data-security guidance](https://www.ftc.gov/business-guidance/privacy-security)
- [FTC Start with Security](https://www.ftc.gov/business-guidance/resources/start-security-guide-business)

Last verified against official documentation: 2026-07-25.
