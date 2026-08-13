# Web review findings reference

## Purpose

Use this result model with the repository's audit and review checklists so different reviewers record scope, evidence, findings, and exceptions consistently. It is intentionally tool-neutral and works in Markdown, a spreadsheet, an issue tracker, or another approved delivery system.

A completed checkbox means the reviewer verified the stated outcome. It does not mean the topic was merely discussed or that an automated tool reported no issue.

## Using the checklists

Every applicable checklist item is expected unless it is marked **Recommended**. Mark an item not applicable when its feature or condition is outside the recorded scope, and explain why when that is not obvious.

Applicable laws, regulations, contracts, policies, and formally adopted standards take precedence over this general guidance. Obtain qualified review when determining a legal or regulatory obligation.

## Review record

Record this information once for each checklist run:

| Field | Value |
| --- | --- |
| Project, site, or application | |
| Environment and base URL | |
| Release, artifact, or commit | |
| Review date | |
| Reviewer and accountable owner | |
| In-scope pages, workflows, roles, data, and integrations | |
| Explicit exclusions and rationale | |
| Applicable standards, policies, contracts, and jurisdictions | |
| Automated tools, configurations, and versions | |
| Manual methods, browsers, devices, and assistive technologies | |
| Known limitations or unavailable evidence | |

For sampled reviews, explain how the sample represents critical journeys, templates, content types, states, roles, and supported environments. Do not claim whole-site or whole-application conformance from an unrepresentative sample.

## Per-check result

Use one result for every applicable check:

- **Pass** — current evidence demonstrates the expected outcome for the recorded scope.
- **Fail** — the expected outcome is not met, a required test failed, or contrary evidence exists.
- **Warning** — evidence is incomplete, the outcome is partially met, or a material risk needs judgment but is not a demonstrated failure.
- **Not applicable** — the triggering feature or condition is absent; record the reason.

Do not use **Pass** when a check was not run, evidence is unavailable, or an exception merely accepts the risk.

## Finding record

Create one finding for each failed check, material warning, or recommendation selected for follow-up:

| Field | Value |
| --- | --- |
| Finding ID and checklist check | |
| Result | Fail or warning |
| Severity | Critical, high, medium, or low |
| Affected scope | |
| Evidence and reproduction steps | |
| Expected outcome or source | |
| Risk and rationale | |
| Recommended remediation | |
| Owner and target date | |
| Accepted exception | Approver, rationale, scope, compensating controls, and expiration or review date |
| Retest evidence and final status | |

Use the project's approved severity system when one exists. Otherwise:

- **Critical** — credible immediate risk of severe harm, broad compromise, unrecoverable loss, or a release condition that must stop.
- **High** — likely or substantial harm to critical users, data, security, accessibility, revenue, or operations.
- **Medium** — meaningful impact with limited scope, lower likelihood, or a practical workaround.
- **Low** — limited impact, defense-in-depth weakness, or maintainability issue that still merits tracking.

Severity describes impact and urgency, not whether a check is a requirement or recommendation. Record uncertainty instead of inflating certainty.

## Review summary

Summarize:

- Scope, exclusions, and important limitations
- Automated checks completed and their configurations
- Manual checks completed and representative workflows
- Counts by result and severity
- Critical and high findings
- Release or operational recommendation, when requested
- Accepted exceptions and their expiration dates
- Owners, target dates, and required retests

Use **go**, **conditional go**, or **no-go** only when the review has an authorized decision owner and explicit decision criteria. A checklist review supports a compliance assessment but does not by itself certify legal compliance, security, accessibility conformance, or search performance.

## References

- [W3C accessibility evaluation report template](https://www.w3.org/WAI/test-evaluate/report-template/)
- [OWASP Risk Rating Methodology](https://owasp.org/www-community/OWASP_Risk_Rating_Methodology)

Last verified against official documentation: 2026-07-25.
