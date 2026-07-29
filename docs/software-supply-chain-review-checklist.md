# Dependency and software supply chain review checklist

## Purpose

Use this checklist to review how a project selects, acquires, changes, builds, publishes, monitors, and retires third-party and internally produced software components. Scale the depth to the software's exposure, privileges, data, distribution, and recovery needs.

This checklist does not require every project to produce an SBOM, signed provenance, or a particular SLSA level. Those are conditional controls whose value and maintenance cost should be justified by the project's threat model, contracts, distribution model, or organizational policy.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Inventory and policy

- [ ] **Baseline requirement:** Inventory package manifests, lockfiles, vendored code, containers, base images, build tools, CI actions, CMS extensions, themes, client assets, infrastructure modules, and externally loaded code.
- [ ] **Baseline requirement:** Identify direct and transitive production dependencies, their source, resolved version or digest, purpose, owner, support status, license, and update path using ecosystem-appropriate tooling.
- [ ] **Baseline requirement:** Define approval criteria for new dependencies based on need, maintenance, provenance, security history, license, privacy, accessibility, size, and replacement cost.
- [ ] **Baseline requirement:** Remove unused, duplicate, abandoned, unsupported, unexpectedly sourced, or unjustifiably privileged components.
- [ ] **Conditional requirement:** Generate and retain an SBOM in an approved format when required for distribution, procurement, incident response, customer assurance, or organizational inventory.

## Acquisition and change control

- [ ] **Baseline requirement:** Obtain packages, images, actions, plugins, themes, and tools from approved sources over authenticated transport and verify expected publisher or ownership.
- [ ] **Baseline requirement:** Commit and review supported lockfiles or equivalent resolved inputs and prevent routine builds from silently selecting materially different dependencies.
- [ ] **Baseline requirement:** Review dependency changes—including transitive additions, scripts, licenses, maintainers, source changes, and unexpected size or capability—before merge.
- [ ] **Baseline requirement:** Prevent package-name confusion, unapproved registries, dependency substitution, and unsafe installation scripts through applicable namespace, registry, scope, and execution controls.
- [ ] **Conditional requirement:** Verify checksums, signatures, attestations, or provenance against documented expectations for high-risk, externally distributed, or policy-governed artifacts.

## Build and artifact integrity

- [ ] **Baseline requirement:** Build release artifacts through a controlled, reviewed process from an identified source revision and record the build system, inputs, configuration, and output digest.
- [ ] **Baseline requirement:** Isolate untrusted pull-request or contributor code from release credentials, protected caches, signing material, deployment permissions, and writable production resources.
- [ ] **Baseline requirement:** Minimize CI and build permissions, pin or otherwise govern reusable automation, protect configuration changes, and review who can alter the release path.
- [ ] **Baseline requirement:** Store release artifacts in an access-controlled registry or repository with retention, immutability or overwrite controls, and traceability to source and checks.
- [ ] **Conditional requirement:** Generate and verify signed build provenance or artifact attestations when the threat model, customer requirements, or distribution process needs tamper evidence.
- [ ] **Recommended:** Assess an appropriate SLSA source or build level as an improvement roadmap rather than claiming a level without verifying every requirement.

## Vulnerability, license, and lifecycle management

- [ ] **Baseline requirement:** Run supported dependency and container vulnerability checks on changes and the deployed inventory and triage findings using reachability, exposure, exploitability, and impact.
- [ ] **Baseline requirement:** Define owners and timeframes for routine updates, urgent security fixes, unsupported components, revoked releases, and vendor or maintainer advisories.
- [ ] **Baseline requirement:** Verify license obligations and compatibility for code, fonts, images, media, datasets, and other distributed or hosted assets with qualified review when uncertain.
- [ ] **Baseline requirement:** Document temporary vulnerability or license exceptions with affected versions, rationale, compensating controls, owner, expiration, and retest trigger.
- [ ] **Conditional requirement:** Maintain a process to identify where a compromised component or build input is deployed and to rebuild, revoke, replace, and communicate affected artifacts.

## Validation

- [ ] **Baseline requirement:** Reproduce the supported build from a clean environment using documented and locked inputs and compare the output or expected behavior.
- [ ] **Baseline requirement:** Verify update automation cannot merge or release changes without the same tests, review, security gates, and rollback expectations applied to human-authored changes.
- [ ] **Baseline requirement:** Sample the deployed artifact and confirm it matches the approved source, dependency, configuration, and registry records.
- [ ] **Baseline requirement:** Record blind spots such as dynamically downloaded code, opaque vendor bundles, unavailable transitive data, mutable tags, or unsupported scanners.

## References

- [NIST Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [SLSA specification](https://slsa.dev/spec/v1.2/)
- [GitHub dependency review](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review)
- [CISA software bill of materials resources](https://www.cisa.gov/sbom)

Last verified against official documentation: 2026-07-25.
