# Production observability and operations checklist

## Purpose

Use this checklist to review whether a production website or web application can be understood, supported, restored, and safely changed. Scale the controls to user impact, availability needs, architecture, data sensitivity, staffing, and vendor responsibilities.

Observability is not a requirement to collect every possible signal. Collect signals that support service health, diagnosis, security, capacity, and business-critical outcomes while controlling noise, cost, access, and sensitive data.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Service expectations and ownership

- [ ] **Baseline requirement:** Record the production architecture, critical journeys, dependencies, data stores, queues, scheduled work, regions, vendors, support hours, and accountable service owner.
- [ ] **Baseline requirement:** Define measurable availability, latency, correctness, freshness, and recovery expectations from user and business needs rather than infrastructure uptime alone.
- [ ] **Baseline requirement:** Define recovery time and acceptable data-loss objectives for critical services and data and align backups, replication, staffing, and runbooks to those objectives.
- [ ] **Baseline requirement:** Assign operational, incident, security, privacy, domain, certificate, backup, vendor, subscription, license, and after-hours ownership with current escalation paths.

## Telemetry and service visibility

- [ ] **Baseline requirement:** Monitor critical journeys and user-visible outcomes, including availability, latency, errors, and correctness, from outside the application where practical.
- [ ] **Baseline requirement:** Collect the logs and metrics needed to diagnose application, infrastructure, database, cache, queue, search, email, scheduled-job, and external-dependency failures.
- [ ] **Conditional requirement:** Use distributed traces or equivalent correlation when requests cross enough services or asynchronous boundaries that logs and metrics cannot explain failures efficiently.
- [ ] **Baseline requirement:** Include release, configuration, environment, region, tenant-safe, and request-correlation context needed to compare behavior and connect signals without exposing sensitive data.
- [ ] **Baseline requirement:** Verify timestamps are synchronized, telemetry arrives within an understood delay, missing telemetry is detectable, and retention supports diagnosis, security, trend, and policy needs.
- [ ] **Baseline requirement:** Restrict, audit, protect, and back up telemetry according to its sensitivity and prevent secrets, credentials, message bodies, tokens, or unnecessary personal data from being recorded.

## Dashboards and alerts

- [ ] **Baseline requirement:** Provide an operational view of critical journeys, traffic, errors, latency, saturation, dependencies, deployments, and business events at the granularity responders need.
- [ ] **Baseline requirement:** Make alerts actionable, owned, deduplicated, severity-appropriate, and tied to user impact, security events, imminent exhaustion, or a required human decision.
- [ ] **Baseline requirement:** Include a useful summary, affected service, severity, start time, relevant dashboard or query, recent changes, owner, and runbook in material alerts.
- [ ] **Baseline requirement:** Test paging, ticket, email, and escalation routes and verify acknowledgments, schedules, contact details, and backup responders.
- [ ] **Baseline requirement:** Review noisy, stale, unactionable, permanently suppressed, and never-firing alerts and correct the signal or response rather than normalizing alert fatigue.

## Incident response and support

- [ ] **Baseline requirement:** Maintain concise runbooks for likely high-impact failures, including diagnosis, safe mitigation, rollback or failover, verification, communication, and escalation.
- [ ] **Baseline requirement:** Define incident roles, severity, command, technical response, security and privacy escalation, user or stakeholder communication, evidence preservation, and closure criteria.
- [ ] **Baseline requirement:** Verify responders can obtain approved production access, logs, dashboards, vendor support, backups, deployment controls, and emergency credentials within the required time.
- [ ] **Baseline requirement:** Exercise a representative alert and incident path, including after-hours behavior when applicable, and record gaps in people, access, telemetry, documentation, or authority.
- [ ] **Baseline requirement:** Hold proportionate, blameless reviews for material incidents and near misses and track corrective actions to validation.

## Backup, recovery, and continuity

- [ ] **Baseline requirement:** Back up the code, configuration, infrastructure definitions, databases, media, search or derived state, secrets or key recovery material, and vendor data required to restore service.
- [ ] **Baseline requirement:** Keep required backup copies outside the primary failure boundary, protect them from unauthorized change or deletion, monitor jobs, and test integrity.
- [ ] **Baseline requirement:** Restore a representative backup into an approved environment and verify application usability, data consistency, permissions, integrations, and documented recovery time.
- [ ] **Conditional requirement:** Exercise failover, regional recovery, degraded operation, queue replay, data reconciliation, and vendor replacement when the architecture or continuity requirement depends on them.
- [ ] **Baseline requirement:** Document what cannot be restored, what must be reconstructed, data that may change during an incident, and who decides between recovery options.

## Capacity, maintenance, and change

- [ ] **Baseline requirement:** Monitor finite resources, quotas, certificates, domains, storage, database growth, queue depth, rate limits, vendor allowances, and renewal dates with enough lead time to act.
- [ ] **Baseline requirement:** Define routine patching, dependency updates, certificate renewal, backup review, account review, vulnerability response, and end-of-support replacement ownership.
- [ ] **Baseline requirement:** Correlate deployments, configuration, feature flags, content releases, experiments, and vendor changes with production signals and preserve useful change history.
- [ ] **Conditional requirement:** Test load, scaling, overload, rate limiting, graceful degradation, and recovery when traffic, campaigns, events, shared capacity, or contractual limits make them material.
- [ ] **Baseline requirement:** Review operational readiness after architecture, vendor, data, traffic, staffing, or availability expectations materially change.

## References

- [OpenTelemetry observability primer](https://opentelemetry.io/docs/concepts/observability-primer/)
- [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/)
- [Google SRE monitoring guidance](https://sre.google/workbook/monitoring/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [CISA logging guidance](https://www.cisa.gov/audiences/small-and-medium-businesses/secure-your-business/use-logging-on-business-systems)

Last verified against official documentation: 2026-07-25.
