---
name: review-web-performance
description: Review websites and web applications for performance using desktop lab evidence, real-user data, source inspection, budgets, and representative workflows. Use for Core Web Vitals reviews, Lighthouse analysis, performance launch checks, regression investigations, and retesting; do not use for general multidisciplinary audits or score-only optimization.
---

# Review Web Performance

Perform a bounded, evidence-based performance review that prioritizes real user experience and important tasks over a perfect synthetic score.

## Invocation boundaries

Use this skill when the requested outcome is a website performance assessment, Core Web Vitals review, Lighthouse analysis, performance launch check, regression investigation, budget review, or retest of performance fixes.

Do not invoke it for an accessibility-only or security-only review, a general multidisciplinary project audit with no performance focus, or implementation of one already-known optimization. Do not claim that one Lighthouse run proves real-user performance, search ranking, or whole-site performance.

## Read the references

Before planning the review, read:

- [Web performance review checklist](references/web-performance-review-checklist.md) for the outcomes to assess.
- [Web review skill contract](references/web-review-contract.md) for safety, evidence storage, result, and reporting rules.
- [Web review findings reference](references/web-review-findings-reference.md) for scope records, statuses, severity, exceptions, and retesting.

Read [website audit runtime guide](references/website-audit-runtime-guide.md) only when an authorized URL and automated browser evidence are relevant.

## Establish scope

Record the repository and/or authorized URL, environment, release or commit, representative pages and workflows, user states, target devices, networks, locations, cache states, performance budgets, current baseline, and available real-user data. Identify the user outcomes that matter most, such as viewing primary content, searching, signing in, or completing a transaction.

Choose a representative sample rather than implying that one URL covers the site. Include major templates, shared components, traffic-heavy pages, important journeys, authenticated states, and known slow paths when they are in scope and accessible. Ask only for missing information that would materially change the review.

## Choose evidence

Use the least intrusive combination that answers the request:

- Use the plugin-owned deterministic runner with the `review-web-performance` profile for an authorized public URL. Resolve the plugin root from this skill directory; do not assume the target project's working directory contains the runtime.
- Before deciding that the plugin runtime is unavailable, run `node runtime/scripts/status.mjs --json` from the resolved plugin root. If it reports `ready: true`, run the profile directly; do not look for `node_modules` under the plugin or run bootstrap.
- Read `evidence.json` for stable normalized observations, `coverage.json` for the automation boundary, `performance-report.html` for the concise evidence summary, and the Lighthouse HTML report for detailed diagnostics.
- Treat the profile as one repeatable 1440 × 900 desktop lab run. It does not measure field INP, mobile performance, warm-cache behavior, geographic variation, authenticated journeys, or important interactions.
- Inspect source, build configuration, server rendering, data fetching, caching, compression, images, fonts, scripts, styles, third parties, and deployment configuration when repository access is available.
- Run existing project performance tests, budgets, bundle analysis, or profiling tools when they are configured and safe. Do not install new project dependencies without approval.
- Review reliable real-user monitoring, Chrome UX Report, analytics, CDN, origin, and monitoring evidence when available. Keep field and lab data distinguishable.
- Use an available interactive browser or project-specific tests for important interactions, long-lived pages, warm-cache behavior, slow or failed dependencies, and states the single-page runner cannot establish.

## Interpret the evidence

Treat LCP, INP, and CLS at the 75th percentile of real visits, segmented by mobile and desktop, as the Core Web Vitals outcome when reliable field data is available. Use lab evidence to reproduce problems, diagnose causes, and catch regressions.

Lighthouse cannot measure INP in a page-load-only run. Treat Total Blocking Time as a lab diagnostic that may reveal responsiveness risk, not as an INP result. Likewise, one lab LCP or CLS observation is not a field pass.

Use approved project budgets and meaningful baselines when deciding whether a change is a regression. If no budget exists, report observed metrics and high-value opportunities without inventing a release gate. Review Lighthouse warnings in context, group symptoms with the same cause, and prefer the smallest change likely to improve user outcomes.

## Run the review

Assess every applicable checklist outcome against recorded evidence. Use `Not checked` when evidence is unavailable and `Not applicable` only when the condition is genuinely outside scope. State whether each result came from lab automation, field data, source inspection, interactive testing, operational evidence, or supplied evidence.

Prioritize meaningful regressions, slow critical journeys, poor field Core Web Vitals, render-blocking work, oversized or poorly delivered assets, main-thread contention, layout instability, and expensive third parties. Do not turn every Lighthouse suggestion or score difference into a finding.

## Report results

Return the readable report in the Codex response by default. Follow the shared report structure and include:

1. Overall assessment and the most important actions
2. Scope, environment, pages, devices, conditions, budgets, tools, and evidence
3. Field Core Web Vitals and important user outcomes when available
4. Desktop lab results and likely causes
5. Critical and high-priority findings
6. Other findings, passed checks, and recommendations
7. Items not checked, limitations, retest needs, and supporting artifact paths

For each material finding, include the result, priority, affected scope, evidence, user or business impact, and the smallest practical recommendation. Separate measured regressions from optimization opportunities.

Write a durable Markdown report only when the user asks. Use their requested location, or propose `reports/performance-review-YYYY-MM-DD.md` and confirm before adding it to the target repository.

## Safety and stopping conditions

Treat an explicit request to review a supplied URL as authorization for read-only navigation and the normal page reloads used by Lighthouse. Otherwise confirm the target before loading it. If runtime status reports that the current runtime is not ready, obtain separate approval before bootstrapping it. Also obtain approval before downloading a browser, capturing detailed browser-error messages, using credentials, generating meaningful load, or accessing private analytics and operational systems.

Do not run load, stress, denial-of-service, or destructive tests; submit production forms; create data; or change code unless the user explicitly expands the task. Prefer staging when repeated page loads could affect analytics, cost, caches, or production behavior.

Stop when the representative scope has been assessed and every applicable checklist outcome has evidence or a documented gap. Do not turn the review into an unbounded crawl or repeated score chasing.
