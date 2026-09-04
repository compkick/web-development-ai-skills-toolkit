---
name: review-web-accessibility
description: Review websites and web applications for accessibility using source inspection, browser evidence, automated scans, and supplied manual results. Use for WCAG-focused audits, keyboard or assistive-technology reviews, accessibility launch checks, and retesting; do not use for general multidisciplinary audits or isolated implementation fixes.
---

# Review Web Accessibility

Perform a bounded, evidence-based accessibility review and give the user practical priorities without claiming certification or complete conformance.

## Invocation boundaries

Use this skill when the requested outcome is an accessibility assessment, WCAG-focused review, keyboard or assistive-technology evaluation, accessibility launch check, analysis of accessibility scan results, or retest of accessibility fixes.

Do not invoke it for a performance-only review, a general multidisciplinary project audit with no accessibility focus, or implementation of one already-known HTML or ARIA fix. If a user asks for legal certification or guaranteed compliance, use the skill for the technical evidence review while clearly declining the unsupported claim.

## Read the references

Before planning the review, read:

- [Web accessibility review checklist](references/web-accessibility-review-checklist.md) for the outcomes to assess.
- [Web review skill contract](references/web-review-contract.md) for safety, evidence storage, result, and reporting rules.
- [Web review findings reference](references/web-review-findings-reference.md) for scope records, statuses, severity, exceptions, and retesting.

Read [website audit runtime guide](references/website-audit-runtime-guide.md) only when an authorized URL and automated browser evidence are relevant.

## Establish scope

Identify the repository and/or authorized URL, environment, release or commit, representative pages and states, critical journeys, accessibility target, supported browsers, and available assistive technologies. Use WCAG 2.2 Level AA as the working technical target when the project has no approved alternative, and record that assumption.

Choose a representative sample rather than implying that one page or an automated scan covers the whole site. Include shared components, major templates, important workflows, error states, and authenticated experiences when they are in scope and accessible. Ask only for missing information that would materially change the review.

## Choose evidence

Use the least intrusive combination that answers the request:

- Inspect source, components, styles, configuration, tests, and documentation when repository access is available.
- Run existing project accessibility or browser tests when they are already configured and safe to execute.
- Use the plugin-owned deterministic review runner with the `review-web-accessibility` profile for authorized pages when screenshot, HTTP, browser-error, axe, or Lighthouse evidence adds value. Resolve the plugin root from this skill directory; do not assume the target project's working directory contains the runtime.
- Treat the profile's 1440 × 900 axe scan and Lighthouse desktop configuration as the repeatable desktop baseline. Use separate interactive evidence for narrow-width reflow, mobile layouts, zoom, touch behavior, and responsive interactions; do not imply that the desktop scan tested those states. On first mention of a 320 CSS-pixel WCAG 1.4.10 check, call it a **WCAG zoom-equivalent reflow check** and state that 320 CSS pixels represents a 1280 CSS-pixel desktop viewport at 400 percent zoom, not a mobile-device simulation. Report contemporary mobile viewport testing separately when it is in scope.
- Before deciding that the plugin runtime is unavailable, run `node runtime/scripts/status.mjs --json` from the resolved plugin root. This read-only command checks the versioned user-cache location. If it reports `ready: true`, run the review profile directly; do not look for `node_modules` under the plugin or run bootstrap.
- Before reporting that automated evidence was saved, verify the package contains `summary.json`, `evidence.json`, `coverage.json`, and `page.png`; when axe completed, also preserve `axe-results.json`, `axe-report.html`, and any referenced `axe-elements/` screenshots; when Lighthouse completed, also preserve `lighthouse-report.json` and `lighthouse-report.html`. If either collector did not complete, preserve the partial package and report the missing artifacts and recorded error instead of implying they were saved.
- Use an available interactive browser for keyboard navigation, focus behavior, responsive states, menus, dialogs, forms, and complete journeys that a single-page scan cannot establish.
- Use actual screen-reader or other assistive-technology results only when that technology was genuinely available and used. An accessibility tree, ARIA snapshot, axe result, or code inspection is not a screen-reader test.
- Review supplied audit reports or human test evidence when direct access is unavailable.

Treat axe and Lighthouse as overlapping automated evidence. Do not double-count the same underlying problem, use a score as proof of accessibility, or convert a clean automated scan into a pass for manual checks.

Read the profile's `evidence.json` for normalized observations and `coverage.json` for the automation boundary. A machine `pass` applies only to its named automated check. Apply the canonical checklist separately and keep partial or manual items `Not checked` until sufficient evidence exists.

## Run the review

Assess every applicable outcome in the accessibility checklist against the recorded evidence. Use `Not checked` when evidence is unavailable and `Not applicable` only when the condition is genuinely outside scope. State whether each conclusion came from source inspection, automation, interactive testing, assistive technology, or supplied evidence.

Group repeated component-level problems into useful findings instead of producing one finding per page or DOM node. Map a finding to WCAG criteria only when the mapping has been verified. Prioritize user impact and practical remediation, then retest fixes or shared components when the request includes verification.

## Report results

Return the readable report in the Codex response by default. Follow the shared report structure and include:

1. Overall assessment and the most important actions
2. Scope, environment, sample, tools, and evidence
3. Critical and high-priority findings
4. Other findings and recommendations
5. Checks that passed, grouped concisely
6. Items not checked, not applicable, or limited by missing evidence
7. Retest needs and the location of supporting artifacts

For each material finding, include the result, severity, affected scope, evidence or reproduction steps, user impact, and the smallest practical recommendation. Keep automated and manual results distinguishable.

When the deterministic runner was used, identify the exact evidence-package directory and explicitly state whether the axe JSON/HTML reports and Lighthouse JSON/HTML reports were preserved. Link or name the primary human-readable reports when the delivery surface supports it.

When reporting a 320 CSS-pixel reflow result, explain the WCAG zoom equivalence before the finding and distinguish it from mobile-device or responsive-breakpoint testing.

Write a durable Markdown report only when the user asks. Use their requested location, or propose `reports/accessibility-review-YYYY-MM-DD.md` and confirm before adding it to the target repository.

## Safety and stopping conditions

Treat an explicit request to review a supplied URL as authorization for read-only navigation to that URL. Otherwise confirm the target before loading it. If the read-only runtime status reports that the current runtime is not ready, obtain separate approval before bootstrapping it. Also obtain approval before downloading a browser, capturing detailed browser-error messages, using credentials, or taking any action that could modify data or notify people.

Do not submit production forms, create content or accounts, bypass access controls, run an unsandboxed browser without the required isolated-environment approval, or change code unless the user explicitly expands the task to remediation.

Stop when the representative scope has been assessed and every applicable checklist outcome has evidence or a documented gap. Do not turn the review into an unbounded crawl. If the user requests legal certification or a conformance guarantee, explain the limitation and offer the evidence-based technical review instead. Give a go, conditional-go, or no-go recommendation only when an authorized decision owner and explicit criteria are available.
