<!-- Generated from docs/production-observability-operations-checklist.md by scripts/sync-skill-references.mjs. Do not edit this copy. -->

# Production operations checklist

## Purpose

Use this checklist to confirm that a production website can be monitored, supported, restored, and safely changed. A small website needs fewer tools than a complex application, but every production site needs clear ownership and a recovery path.

## Ownership and expectations

- [ ] Identify the site owner, technical owner, support contact, and after-hours contact when needed.
- [ ] List the critical pages, user journeys, services, vendors, scheduled jobs, and data stores.
- [ ] Define the availability and recovery expectations that matter to users.
- [ ] Assign ownership for hosting, domains, certificates, backups, vendors, licenses, security, and privacy.

## Monitoring and alerts

- [ ] Monitor whether the site and its most important user journeys work.
- [ ] Collect enough logs and metrics to investigate likely failures.
- [ ] Use request tracing only when logs and metrics cannot explain a multi-service problem.
- [ ] Keep secrets and unnecessary personal data out of logs.
- [ ] Protect logs and monitoring data from unauthorized access.
- [ ] Create alerts only for problems that need a human response.
- [ ] Route alerts to a current owner and test the notification path.
- [ ] Review and fix noisy, stale, or useless alerts.

## Support and incidents

- [ ] Keep short runbooks for likely high-impact failures.
- [ ] Define who leads an incident and who handles technical work and communications.
- [ ] Confirm responders can access logs, hosting, deployments, backups, and vendor support.
- [ ] Test one representative alert and incident path.
- [ ] Review serious incidents and assign follow-up work.

## Backup and recovery

- [ ] Back up the code, data, media, configuration, and other state needed to restore the site.
- [ ] Keep backup copies outside the main failure boundary.
- [ ] Monitor backup jobs and protect backups from unauthorized deletion.
- [ ] Restore a representative backup and confirm the site works.
- [ ] Document anything that cannot be restored automatically.

## Maintenance

- [ ] Monitor storage, database growth, quotas, domains, certificates, and vendor limits.
- [ ] Assign owners for patching, dependency updates, renewals, and end-of-support replacement.
- [ ] Keep a useful history of deployments and configuration changes.
- [ ] Load-test or test failover when traffic or availability requirements justify it.
- [ ] Review this checklist after major architecture, vendor, traffic, or staffing changes.

## References

- [OpenTelemetry observability primer](https://opentelemetry.io/docs/concepts/observability-primer/)
- [Google SRE monitoring guidance](https://sre.google/workbook/monitoring/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [CISA logging guidance](https://www.cisa.gov/audiences/small-and-medium-businesses/secure-your-business/use-logging-on-business-systems)

Last verified against official documentation: 2026-07-28.
