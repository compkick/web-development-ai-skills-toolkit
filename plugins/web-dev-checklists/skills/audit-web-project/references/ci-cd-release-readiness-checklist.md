<!-- Generated from docs/ci-cd-release-readiness-checklist.md by scripts/sync-skill-references.mjs. Do not edit this copy. -->

# CI/CD and release readiness checklist

## Purpose

Use this checklist to confirm that a release can be built, tested, deployed, observed, and rolled back safely. Adjust it to the project's size and risk.

## Identify the release

- [ ] Record the source revision, release artifact, target environment, owner, and approver.
- [ ] List database, infrastructure, configuration, dependency, and feature-flag changes.
- [ ] Record known issues, user impact, support coverage, and reasons to stop the release.
- [ ] Confirm the required code and operational reviews are complete.

## Build and test

- [ ] Build from a clean environment using the committed lockfiles and configuration.
- [ ] Run the lint, type, test, security, dependency, build, and documentation checks required by the change.
- [ ] Review skipped, flaky, quarantined, or disabled tests.
- [ ] Confirm untrusted code cannot access protected secrets, runners, caches, or deployment credentials.
- [ ] Keep workflow actions, build images, scripts, and tools approved and maintained.

## Credentials and environments

- [ ] Give each CI job and service account only the permissions it needs.
- [ ] Store secrets in approved systems and keep them out of logs.
- [ ] Protect production deployments with the project's required approval and branch rules.
- [ ] Document important differences between environments.
- [ ] Add extra approval for high-risk, payment, identity, data, infrastructure, or irreversible changes.

## Deployment and rollback

- [ ] Rehearse high-risk deployment, migration, smoke-test, and rollback steps.
- [ ] Confirm application and database versions remain compatible during deployment.
- [ ] Back up data before a migration that could require recovery.
- [ ] Make migrations observable and safe to retry or recover.
- [ ] Use a phased or feature-flagged rollout when it meaningfully reduces risk.
- [ ] Define clear rollback triggers and who can make the decision.
- [ ] Confirm the rollback covers code, configuration, database, routing, and content changes.

## Release and follow-up

- [ ] Confirm monitoring, logs, health checks, and alerts are ready for the release.
- [ ] Run production smoke tests immediately after deployment.
- [ ] Repeat important checks after caches, traffic, and scheduled work settle.
- [ ] Record the deployed version, results, incidents, and follow-up owners.
- [ ] Remove temporary access, debug settings, maintenance modes, and release flags.
- [ ] Update tests or runbooks when the release exposes a real gap.

## References

- [NIST Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [GitHub secure use of Actions](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments)
- [SLSA build track](https://slsa.dev/spec/v1.2/build-track-basics)

Last verified against official documentation: 2026-07-28.
