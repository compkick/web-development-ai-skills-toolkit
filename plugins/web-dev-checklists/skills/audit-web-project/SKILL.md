---
name: audit-web-project
description: Audit an existing website, web application, or repository across implementation, accessibility, security, performance, technical SEO, privacy, operations, and maintainability. Use for multidisciplinary project-health reviews, inherited-project assessments, risk inventories, and prioritized improvement plans; do not use when the request is only for one specialist review or a launch go/no-go decision.
---

# Audit Web Project

Perform a bounded, cross-discipline review that answers the user's audit question and prioritizes the few changes that matter most. Use specialist evidence without duplicating specialist instructions or turning every possible check into required work.

## Invocation boundaries

Use this skill for requests such as auditing an existing web project, assessing an inherited site, identifying major technical risks, reviewing overall project health, or deciding what to improve first.

Use `review-web-accessibility`, `review-web-security`, `review-web-performance`, or `review-technical-seo` when the requested outcome is limited to that area. Use `review-website-launch` when the main question is whether a specific release should launch. Do not use this skill for implementing one known fix, an unbounded penetration test, exhaustive compliance certification, content strategy, or a request that has no review component.

## Read the references

Before planning the audit, read:

- [Web project audit checklist](references/web-project-audit-checklist.md) for the canonical high-level outcomes.
- [Web review skill contract](references/web-review-contract.md) for safety, evidence storage, result, and reporting rules.
- [Web review findings reference](references/web-review-findings-reference.md) for scope records, statuses, priority, exceptions, and follow-up.

Read [website audit runtime guide](references/website-audit-runtime-guide.md) only when an authorized public URL and automated website evidence are relevant.

Read the following only when that area is in scope and direct project evidence is available:

- [Agent-ready repository checklist](references/agent-ready-repository-checklist.md) when coding agents will work in the repository.
- [Software supply chain review checklist](references/software-supply-chain-review-checklist.md) for dependency, secret, provenance, and maintenance risks.
- [CI/CD release readiness checklist](references/ci-cd-release-readiness-checklist.md) for pipeline and deployment controls.
- [Production operations checklist](references/production-observability-operations-checklist.md) for monitoring, recovery, incident, and ownership evidence.
- [Privacy and data-handling checklist](references/web-privacy-data-handling-review-checklist.md) when personal, sensitive, regulated, or user-submitted data is involved.
- [CMS content governance checklist](references/cms-content-governance-checklist.md) when a CMS and publishing workflow are in scope.

## Choose the audit mode

Use the evidence available to select one or combine both:

- **Repository review:** inspect documentation, architecture, dependencies, configuration, tests, deployment, and maintainability. A public URL is not required.
- **Public website review:** use the bounded deterministic profile and supplied evidence. State that one public desktop page is not the whole project.
- **Combined review:** connect repository decisions with observed public behavior. This is the preferred mode when both sources are available.

Record the audit question, target repository and/or URL, environment, release or commit, important journeys, users, sensitive data, connected systems, deadline, available accounts, prohibited actions, and known evidence. Ask only for missing information that would materially change safety, scope, or the conclusions.

## Review the repository

Start with the README and repository instructions. Identify the documented setup, normal build and validation commands, architecture, environments, deployment path, ownership, and recovery procedure.

Run existing install, build, lint, type, and test commands only when repository health is in scope and the commands are safe for the current environment. Inspect changes after commands that may generate files. Do not install new project tooling, connect to production services, expose secrets, or make configuration changes merely to complete the audit.

Review representative source and configuration rather than every file. Look for unsupported dependencies, unclear boundaries, duplicated or fragile implementation, missing tests around important journeys, insecure secret handling, environment drift, and operational gaps. Distinguish an observed problem from a preference or optional modernization opportunity.

## Collect public website evidence

Reuse a current evidence package when it represents the same URL, release, and relevant configuration. Do not rerun five specialist profiles when their evidence is already current.

When a public baseline is needed, use the plugin-owned deterministic runner with the `audit-web-project` profile. Follow the [shared runtime procedure](references/website-audit-runtime-guide.md#install-the-runtime) for plugin resolution and readiness.

Follow the runtime guide's [output-location procedure](references/website-audit-runtime-guide.md#output-location-when-using-an-installed-plugin) and run:

```bash
node "<absolute-plugin-root>/runtime/scripts/review.mjs" --profile audit-web-project --url https://site.example
```

The profile collects accessibility, security, performance, technical SEO, and bounded homepage evidence in one browser and Lighthouse run. Read `web-project-audit-report.html` first, then use the linked detailed reports and JSON only when a finding needs diagnosis.

Treat machine passes as evidence for their named checks only. Public evidence does not verify repository quality, private environments, source controls, authentication, authorization, data handling, backups, monitoring, CMS governance, mobile behavior, or project-specific journeys.

## Route deeper reviews

Use a specialist skill only when the user requested that depth, the high-level evidence found a material concern, or a conclusion depends on missing specialist evidence. Reuse the current audit artifacts where possible instead of immediately collecting the same page again.

Do not copy every specialist checklist into the audit result. Summarize the area, name the material evidence, and recommend the focused follow-up. Privacy, operations, CMS governance, repository controls, and authenticated journeys remain manual or source-based unless appropriate authorized evidence is available.

## Assess and prioritize

Assess every applicable canonical audit item as `Pass`, `Fail`, `Warning`, `Not checked`, or `Not applicable`. Separate confirmed failures, missing evidence, accepted risks, and optional improvements.

Prioritize by user impact, security risk, likelihood, urgency, and effort. Group repeated symptoms by root cause. Avoid a synthetic overall score. Use a plain overall assessment such as `Generally healthy`, `Needs attention`, `High risk`, or `Incomplete evidence`, and explain the evidence that determines it.

## Report results

Use the [shared report structure](references/web-review-contract.md#report-structure). Lead with the three to five most important actions. Group findings by relevant area, distinguish accepted risks from missing evidence, and finish with recommended specialist follow-up and a practical next-step sequence.

Give each material finding a result, priority, affected scope, evidence, impact, and smallest practical recommendation. Include an owner and target date when known. Do not list every successful machine check or dump all referenced checklists into the response.

Write a durable Markdown audit only when the user asks. Use their requested path, or propose `reports/web-project-audit-YYYY-MM-DD.md` before adding it to the target repository.

## Safety and stopping conditions

Treat an explicit request to audit a supplied public URL as authorization for the documented read-only combined profile. Otherwise confirm the target before loading it. Obtain separate approval before bootstrapping the runtime, downloading a browser, using credentials, accessing private systems, installing dependencies, capturing detailed browser-error text, submitting forms, or performing any state-changing action.

Do not run intrusive security scans, unbounded crawls, production writes, deployments, or notification-producing workflows. Stop and request direction when the authorized boundary is unclear, a critical active compromise is suspected, or meaningful continuation requires new access or authority.

Stop when the audit question is answered, the applicable high-level checklist items have evidence or documented gaps, and the prioritized next steps are clear. Do not expand the review merely because a conditional reference contains more checks.
