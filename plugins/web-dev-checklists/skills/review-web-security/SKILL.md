---
name: review-web-security
description: Review a website or web application for security using bounded public checks, source and configuration evidence, approved authenticated testing, and operational evidence. Use for website security reviews, pre-launch security checks, response-header or TLS reviews, and retesting; do not use for exploit development, unbounded penetration testing, or a general multidisciplinary audit.
---

# Review Web Security

Perform a scoped, non-destructive security review and distinguish observed evidence from assumptions, untested controls, and findings that require a qualified security reviewer.

## Invocation boundaries

Use this skill when the requested outcome is a website security assessment, pre-launch security review, public HTTPS or response-header check, source-based application-security review, authorized authenticated review, or retest of security fixes.

Do not invoke it for a performance-only review, a general multidisciplinary project audit with no security focus, implementation of one already-known fix, exploit development, credential attacks, stealth, persistence, or an unbounded penetration test. If the user asks for certification, guaranteed security, or proof that no vulnerability exists, provide the bounded evidence review while clearly declining the unsupported claim.

## Read the references

Before planning the review, read:

- [Web security review checklist](references/web-security-review-checklist.md) for the outcomes to assess.
- [Web review skill contract](references/web-review-contract.md) for safety, evidence, result, and reporting rules.
- [Web review findings reference](references/web-review-findings-reference.md) for scope records, statuses, severity, exceptions, and retesting.

Read [website audit runtime](references/website-audit-runtime.md) only when an authorized URL and automated public evidence are relevant.

## Establish scope and authorization

Record the repository and/or authorized URL, environment, release or commit, included accounts and roles, allowed test window, contacts, sensitive data, prohibited actions, and evidence available. Separate the work into the sections that can actually be supported:

- Public website baseline
- Source and configuration
- Authenticated behavior
- Operations and recovery

Do not imply that a public URL check covers the other sections. Ask only for missing information that would materially change safety, authorization, or the review result.

## Choose evidence

Use the least intrusive combination that answers the request:

- Use the plugin-owned deterministic runner with the `review-web-security` profile for an authorized public URL. Resolve the plugin root from this skill directory; do not assume the target project's working directory contains the runtime.
- Read `evidence.json` for stable public observations, `coverage.json` for the automation boundary, and `security-report.html` for the human-readable evidence summary. A machine `pass` applies only to its named check.
- Inspect source, dependency manifests, lockfiles, framework and runtime versions, configuration, infrastructure definitions, tests, and deployment guidance when repository access is available.
- Prefer the project's existing dependency, static-analysis, and secret-scanning tools when they are configured and safe. Do not install new project dependencies or copy secret values into evidence without approval.
- Use an available interactive browser for approved public or authenticated workflows that require interaction. Use only supplied or explicitly approved test accounts and safe test data.
- Review supplied platform, logging, alerting, backup, incident-response, or previous audit evidence when direct access is unavailable.

Put runtime artifacts in a task-specific temporary directory outside the target repository unless the user requests another location. Report the artifact path and treat screenshots, URLs, headers, cookie names, and optional browser errors as potentially sensitive.

The security profile loads the supplied page, requests its subresources, makes five bounded TLS handshakes to the rendered HTTPS hostname and port, makes a same-host plain-HTTP redirect probe when the supplied URL is HTTPS, and requests `/.well-known/security.txt` on the same HTTPS origin. The TLS handshakes perform one normal negotiation and one attempt each for TLS 1.3, TLS 1.2, TLS 1.1, and TLS 1.0; they do not enumerate cipher suites or send an HTTP request. The profile does not submit forms, enumerate endpoints, send injection payloads, scan ports, attempt authentication, or exploit vulnerabilities.

## Run the review

Assess every applicable checklist outcome against recorded evidence. Use `Not checked` when evidence is unavailable and `Not applicable` only when the condition is genuinely outside scope. State whether each result came from browser automation, source inspection, interactive testing, operational evidence, or supplied evidence.

Treat header, cookie, and TLS results as bounded configuration observations that need application context. A Content Security Policy does not prove that cross-site scripting is impossible. The TLS baseline checks selected protocol versions and the normally negotiated cipher and key exchange; it does not prove that every accepted cipher suite is strong. A clean dependency scan does not prove the application is secure.

Review automated warnings manually before calling them vulnerabilities. Group symptoms with the same root cause, prioritize exploitable or high-impact issues, and recommend the smallest practical remediation. Map findings to OWASP Top 10 or ASVS only when the mapping has been verified and adds value.

## Report results

Return the readable report in the Codex response by default. Follow the shared report structure and include:

1. Overall assessment and the most important actions
2. Scope, authorization, environment, tools, and evidence
3. Critical and high-priority findings
4. Other findings and recommendations
5. Checks that passed, grouped concisely
6. Items not checked, not applicable, or limited by missing access
7. Retest needs and the location of supporting artifacts

For each material finding, include the result, severity, affected scope, evidence or safe reproduction steps, risk, and the smallest practical recommendation. Do not include credentials, tokens, secret values, private data, or unnecessary exploit detail.

Write a durable Markdown report only when the user asks. Use their requested location, or propose `reports/security-review-YYYY-MM-DD.md` and confirm before adding it to the target repository. Do not place raw audit artifacts in the repository without explicit permission.

## Safety and stopping conditions

Treat an explicit request to review a supplied URL as authorization for the documented read-only public probes. Otherwise confirm the target before loading it. Obtain separate approval before bootstrapping the runtime, downloading a browser, capturing detailed browser-error messages, using credentials, accessing private operational systems, submitting any form, or performing an action that could modify data or notify people.

Never guess credentials, bypass access controls, test rate limits or account lockouts without a specific safe plan, expose secrets, run an unsandboxed browser outside an explicitly approved isolated environment, or expand a public review into endpoint enumeration or exploitation. Stop and request direction if evidence suggests a critical active compromise, if the authorized boundary is unclear, or if safe testing cannot continue.

Stop when the authorized scope has been assessed and every applicable checklist outcome has evidence or a documented gap. Do not turn the review into an unbounded crawl. Recommend a qualified penetration test for high-risk applications or when deeper adversarial validation is needed.
