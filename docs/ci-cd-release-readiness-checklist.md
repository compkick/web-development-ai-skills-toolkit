# CI/CD and release readiness checklist

## Purpose

Use this checklist to determine whether a continuous-integration and deployment path can build, verify, authorize, deploy, observe, and recover a specific release safely. It is vendor-neutral; adapt controls to the repository, hosting platform, risk, and deployment strategy.

Use the [website launch checklist](website-launch-checklist.md) for the broader site go-live. This checklist focuses on the engineering delivery path.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Release identity and ownership

- [ ] **Baseline requirement:** Record the source revision, release artifact or digest, environment, changes, database or infrastructure migrations, feature flags, dependencies, owner, approver, window, and rollback decision maker.
- [ ] **Baseline requirement:** Verify required code, configuration, infrastructure, dependency, security, and operational review is complete and branch or release protections cannot be bypassed without an auditable emergency process.
- [ ] **Baseline requirement:** Verify the same approved artifact is promoted between environments or record and verify any necessary environment-specific transformation.
- [ ] **Baseline requirement:** Confirm the release scope, known issues, accepted exceptions, user impact, support coverage, communications, and no-go criteria are understood by the people operating the release.

## CI integrity and test gates

- [ ] **Baseline requirement:** Verify a clean build from locked or otherwise controlled inputs succeeds without relying on undocumented local files, mutable dependencies, interactive steps, or exposed secrets.
- [ ] **Baseline requirement:** Verify formatting, linting, type, unit, integration, end-to-end, accessibility, security, dependency, build, and documentation checks required by the change pass against the intended release.
- [ ] **Baseline requirement:** Verify critical tests assert user-visible or security-relevant outcomes and that skipped, quarantined, flaky, or conditionally disabled tests are visible and justified.
- [ ] **Baseline requirement:** Verify untrusted contributions cannot access protected secrets, deployment credentials, signing material, privileged runners, or writable trusted caches.
- [ ] **Baseline requirement:** Verify workflow dependencies, runners, images, reusable jobs, scripts, and build tools are approved, governed, and included in dependency and vulnerability maintenance.

## Credentials, environments, and approvals

- [ ] **Baseline requirement:** Minimize workflow token and service-account permissions by job and environment and use short-lived, federated, or otherwise scoped credentials where supported.
- [ ] **Baseline requirement:** Protect production environments with approved branch or tag rules, named authorization, separation of duties appropriate to risk, and auditable emergency access.
- [ ] **Baseline requirement:** Verify secrets are stored in approved systems, masked from logs, unavailable to untrusted jobs, rotated when exposed, and removed when unused.
- [ ] **Baseline requirement:** Verify environment configuration differences are documented and validated without printing secret values.
- [ ] **Conditional requirement:** Require manual approval, change window, segregation of duties, or additional evidence for high-risk production, data, identity, payment, infrastructure, or irreversible changes.

## Deployment and migration safety

- [ ] **Baseline requirement:** Rehearse the deployment, migration, smoke-test, monitoring, and rollback steps in a sufficiently representative environment for the release risk.
- [ ] **Baseline requirement:** Verify schema, application, configuration, cache, queue, search, and client compatibility during rolling or partial deployment, or use a controlled atomic strategy.
- [ ] **Baseline requirement:** Make database and content migrations bounded, observable, backed up, restartable or safely recoverable, and explicit about data changed after deployment.
- [ ] **Baseline requirement:** Verify concurrent deployments, retries, duplicate events, interrupted jobs, timeouts, and partial failures cannot silently corrupt state or deploy an unintended version.
- [ ] **Conditional requirement:** Use canary, blue-green, phased, or feature-flagged rollout when blast radius, traffic, uncertainty, or recovery time justifies the added complexity.

## Observability and recovery

- [ ] **Baseline requirement:** Capture the pre-release baseline and verify dashboards, logs, traces, health checks, synthetic journeys, business events, and alerts can distinguish the new version and configuration.
- [ ] **Baseline requirement:** Confirm actionable alerts route to people available during the release and that vendor, infrastructure, security, product, and communications escalation paths are current.
- [ ] **Baseline requirement:** Define measurable rollback or mitigation triggers and verify the authorized decision maker can execute them within the required recovery time.
- [ ] **Baseline requirement:** Verify rollback points cover application, configuration, infrastructure, schema, content, routing, cache, and search state and address forward data created after release.
- [ ] **Baseline requirement:** Run production smoke tests after deployment and again after caches, traffic, asynchronous work, scheduled jobs, and dependent systems have stabilized.

## Closeout

- [ ] **Baseline requirement:** Record deployed version, timestamps, approvals, pipeline and migration logs, smoke-test evidence, observed metrics, incidents, rollback decisions, and follow-up owners.
- [ ] **Baseline requirement:** Confirm temporary access, flags, maintenance modes, debug settings, freezes, elevated monitoring, and change-window controls are removed or deliberately retained.
- [ ] **Baseline requirement:** Feed material failures, near misses, manual work, and false gates back into tests, automation, runbooks, and release criteria.

## References

- [NIST Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [GitHub Actions secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments)
- [SLSA build track](https://slsa.dev/spec/v1.2/build-track-basics)

Last verified against official documentation: 2026-07-25.
