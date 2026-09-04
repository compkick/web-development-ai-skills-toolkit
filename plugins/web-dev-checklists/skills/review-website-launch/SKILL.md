---
name: review-website-launch
description: Review a specific website release for launch readiness using a bounded homepage preflight, existing specialist-review evidence, release context, and human confirmations. Use for launch-readiness reviews, go/no-go recommendations, cutover planning, and post-launch checklists; do not use for deployment execution, a broad project audit, or a specialist-only accessibility, security, performance, or SEO review.
---

# Website Launch Readiness Review

Make a high-level, evidence-backed launch recommendation without duplicating the specialist reviews or turning the launch into an exhaustive audit.

## Invocation boundaries

Use this skill when the user asks whether a specific website or release is ready to launch, requests a go/no-go review, needs a launch or cutover checklist, or wants post-launch checks.

Do not invoke it for a general quality audit with no scheduled release, deployment implementation, one known fix, or a specialist-only accessibility, security, performance, or technical SEO review. Do not deploy, change DNS, clear production caches, submit forms, send email, publish content, or invoke rollback unless the user separately authorizes that action.

## Read the references

Always read:

- [Website launch checklist](references/website-launch-checklist.md) for the canonical launch gate and post-launch outcomes.
- [Web review skill contract](references/web-review-contract.md) for evidence storage, safety, and reporting rules.
- [Web review findings reference](references/web-review-findings-reference.md) for result, finding, risk-acceptance, and ownership language.

Read [website development checklist](references/website-development-checklist.md) only when development readiness is uncertain or the user asks what build work remains. Read [WordPress launch checklist](references/wordpress-launch-checklist.md) only when the site is WordPress. Read [website audit runtime](references/website-audit-runtime.md) only when an authorized public URL and automated preflight evidence are relevant.

Do not load or repeat every specialist checklist. Use the accessibility, security, performance, and technical SEO skills only when the user explicitly requests a missing or stale specialist review.

## Establish the launch

Identify as much as possible before asking questions:

- Target URL and whether it is the intended public production homepage
- Exact release, commit, content, configuration, and migration scope
- Launch type, such as new site, redesign, migration, domain change, or major release
- Platform and hosting, including whether WordPress applies
- Critical pages and journeys
- Launch window, owners, known issues, accepted risks, and current incidents
- Backup, rollback, monitoring, communication, and support readiness
- Status and release relevance of prior accessibility, security, performance, SEO, privacy, and project test evidence

Ask only for missing information that could change the recommendation or make the review unsafe. User confirmation can establish an operational fact, but label it as supplied evidence rather than an automated observation.

## Run the bounded preflight

For an authorized public homepage, use the plugin-owned deterministic runner with the `review-website-launch` profile. Resolve the plugin root from this skill directory; do not assume the reviewed project contains the runtime.

Before deciding that the runtime is unavailable, run `node runtime/scripts/status.mjs --json` from the plugin root. If it reports `ready: true`, run the profile directly. If it is not ready, obtain approval before bootstrapping dependencies or downloading Chromium.

Read `evidence.json`, `coverage.json`, `launch-results.json`, and `launch-readiness-report.html`. Treat the report's automated preflight as one evidence source, not the final go/no-go decision.

The profile renders one supplied homepage and checks only launch-critical basics:

- Successful homepage response, final HTTPS URL, and bounded HTTP-to-HTTPS redirect
- Header, navigation, main content, and footer presence
- Empty, placeholder, JavaScript, malformed, and missing-fragment link destinations
- Up to 50 unique same-host HTTP(S) links, prioritizing navigation, header, footer, and then content
- Homepage noindex directives and browser-error counts
- A full-page screenshot and high-level title and heading summary

It does not request external link destinations, submit forms, authenticate, run axe, run Lighthouse, repeat the security or technical SEO collectors, or crawl the site.

## Reuse existing evidence

Assume the developer or project lead normally completed the specialist reviews before this launch gate. Reuse reports or explicit completion confirmation when they apply to the same release, environment, templates, and critical journeys and no material change invalidated them.

Record each relevant review as current, stale, missing, not applicable, or confirmed by the user. Do not rerun all specialist profiles merely because artifacts were not attached. If missing or stale evidence could block the launch, recommend `NO-GO until confirmed` or ask whether the user wants the relevant specialist review.

Inspect repository, CI, test, release, deployment, or operational evidence when available and helpful. Run existing safe project checks when they are configured, but do not install dependencies or mutate the release without approval.

## Make the recommendation

Lead with exactly one recommendation:

- **GO** — no launch blocker remains and launch-critical evidence is complete.
- **GO WITH ACCEPTED RISKS** — no unresolved blocker remains, and each material risk has an accountable owner and explicit acceptance.
- **NO-GO** — a confirmed blocker exists or a launch-critical fact is still unknown.

Missing evidence is not a pass. Use `NO-GO until confirmed` when a critical fact such as recovery, production configuration, or a required review is unknown.

Treat these as default blocker candidates, subject to recorded project context:

- The intended production homepage is unavailable, insecure, still in maintenance mode, or unintentionally noindex.
- Primary navigation or another critical public journey is confirmed broken.
- A confirmed critical security issue or exposed secret affects the release.
- A serious accessibility failure prevents a critical journey.
- Required authentication, payment, form, email, legal, consent, or integration behavior is broken.
- A stateful or high-risk launch lacks a usable recovery point or rollback procedure.
- The tested release or environment does not match what will be deployed.
- A project-defined no-go condition is met.

Do not make an arbitrary Lighthouse score, optional header, minor broken content link, or unaccepted automated warning a universal blocker. Review context and group related symptoms before deciding launch impact. Codex recommends; the accountable launch owner records the final decision.

## Tailor the developer checklist

After the recommendation, provide a short checklist containing only applicable items that remain unverified, require a human or external system, or must happen during cutover. Do not repeat automated passes or dump every canonical checkbox.

Use the general launch checklist as the base. For WordPress, add only applicable unresolved items from the WordPress launch checklist, such as Site Health, backups, accounts, supported versions, production debug settings, WP-Cron, email, caching, and administrator access. Use the development checklist only to surface confirmed prerequisite gaps.

Group remaining actions by when they happen:

1. Required before the decision
2. During launch
3. Immediately after launch
4. After DNS, caches, search, or scheduled work settle
5. After the rollback window

Include an owner and due point when known. Keep accepted risks separate from unfinished work.

## Report results

Return a concise response with:

1. GO, GO WITH ACCEPTED RISKS, or NO-GO
2. The few reasons that determine the recommendation
3. Scope, release, environment, evidence, and specialist-review status
4. Automated homepage preflight results
5. The tailored developer checklist
6. Cutover, rollback, and post-launch reminders
7. Items not checked, limitations, and artifact paths

Write a durable Markdown launch report or client handoff only when the user asks. Use their requested path or propose a task-specific file outside the release source. Treat screenshots, URLs, release details, issue lists, owners, and operational instructions as potentially sensitive.

## Safety and stopping conditions

Treat an explicit request to review a supplied URL as authorization for the documented homepage load, its normal third-party resources, the same-host plain-HTTP redirect probe, and up to 50 read-only same-host link requests. Otherwise confirm the target before loading it.

The runner does not request external destinations or perform state-changing actions. Obtain separate approval before using credentials, accessing private systems, submitting forms, sending messages, changing content or infrastructure, installing dependencies, or executing any deployment or rollback step.

Stop when the high-level preflight, specialist status, launch-critical confirmations, recommendation, and tailored pre/post-launch checklist are complete. Do not expand the work into a whole-site crawl or specialist re-audit without the user's direction.
