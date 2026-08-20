# Modernization plan for Dev Docs and Checklists repo

## Purpose

Modernize this repository's web-development guidance, add missing core
checklists, and turn the stable workflows into a publishable Codex skills
library.

This file is the canonical implementation roadmap. Update it as work is
completed or decisions change. Do not treat discussion notes or chat history as
the authoritative plan when this file contains a newer decision.

## Status

- Plan status: In progress
- Current phase: Phase 4B
- Next work item: Design and scaffold `review-web-security`
- Last reviewed: 2026-08-20

## Guiding decisions

- Correct and normalize the human documentation before encoding it in skills.
- Keep detailed human guidance canonical in `docs/` and generate any skill-local copies during packaging.
- Make the core library useful to web developers regardless of framework or CMS.
- Keep checklists concise, high-impact, security-conscious, and realistically assessable; exclude items that do not support a decision, verify a meaningful outcome, or prevent a material failure, but never remove critical risk coverage merely to reduce length.
- Make WordPress the primary CMS documentation track.
- Retain Sitefinity as lower-priority maintenance and specialist guidance.
- Treat skills as focused workflows, not one-to-one wrappers around documents.
- Keep deterministic checks in scripts and detailed standards in references.
- Package the broad web-development skills separately from optional CMS and
  tooling skills.
- Preserve the repository's actual `develop` to `main` contribution workflow,
  while documenting other valid Git strategies in the public guidance.
- Preserve the existing uncommitted README formatting update when Phase 2
  rewrites the repository index.

## Phase 1: Correct and modernize existing guidance

### Phase 1A: General web guidance

- [x] Update the web and CMS coding standards.
- [x] Update the general website development and launch checklist.
- [x] Replace unsafe, obsolete, or overly absolute recommendations.
- [x] Add current accessibility, security, performance, privacy, SEO, and
      operational expectations.
- [x] Distinguish requirements, recommendations, and project-specific choices.
- [x] Verify version-sensitive claims against primary sources.

### Phase 1B: Engineering workflows

- [x] Update the Git development practices.
- [x] Update the Git cheatsheet.
- [x] Update the Playwright testing guidance.
- [x] Add modern CI, test-isolation, evidence, and safe-operation guidance.
- [x] Present `develop`/GitFlow as an available strategy rather than a universal default.

### Phase 1C: WordPress documentation

Create a coherent WordPress lifecycle section:

- [x] Add `docs/wordpress-setup-checklist.md`.
- [x] Add `docs/wordpress-testing-checklist.md`.
- [x] Add `docs/wordpress-launch-checklist.md`.
- [x] Expand and modernize `docs/wordpress-migration-checklist.md`.

The WordPress setup checklist should cover:

- Runtime and hosting compatibility
- Local, staging, and production environments
- Repository and environment configuration
- HTTPS and canonical domains
- Accounts, roles, secrets, salts, and least privilege
- Themes, plugins, licensing, and update policies
- Backups and restore testing
- SMTP and transactional email
- Caching, CDN, object caching, and media
- Permalinks, redirects, sitemaps, and search visibility
- Analytics, consent, and privacy
- Security, monitoring, scheduled tasks, and WP-CLI
- Initial accessibility and performance baselines

The WordPress testing checklist should cover:

- Frontend templates, navigation, search, and error pages
- Forms, email, uploads, integrations, and scheduled tasks
- Administrator and block-editor workflows
- Roles and permissions
- Responsive and supported-browser testing
- Accessibility, performance, technical SEO, and security
- Caching and cache invalidation
- Theme and plugin conflicts
- Backup restoration
- Regression evidence and sign-off

The WordPress launch checklist should cover:

- Content freeze and final synchronization
- Verified backups and rollback points
- DNS, SSL, canonical domains, and redirects
- Production configuration and secrets
- Search visibility, sitemaps, robots directives, and canonicals
- Forms, email, analytics, and consent
- Caching, CDN activation, and cache warming
- Security headers, account audits, and monitoring
- Accessibility, performance, SEO, and smoke-test gates
- Go/no-go ownership, cutover, follow-up checks, and rollback triggers

The WordPress migration checklist should cover:

- Source and destination inventory
- Compatibility and capacity checks
- Staging rehearsal and content freeze
- Verified file and database backups
- Secure transfer
- Serialized-data-safe WP-CLI search and replace
- Multisite handling when applicable
- Domain, DNS, HTTPS, redirects, email, cron, media, and caching
- Functional, accessibility, performance, SEO, and security validation
- Monitoring and rollback

### Phase 1D: Sitefinity maintenance guidance

- [x] Update Sitefinity prerequisites.
- [x] Update the Sitefinity project-start checklist.
- [x] Update the Sitefinity test plan.
- [x] Verify and update the Sitefinity upgrade instructions.
- [x] Turn the Sitefinity training outline into a runnable training plan.
- [x] Label version-specific and organization-specific assumptions clearly.

### Phase 1 exit criteria

- [x] No known unsafe guidance remains.
- [x] Version-sensitive claims have primary sources.
- [x] Vendor and framework defaults are clearly labeled.
- [x] Checklist items describe observable outcomes.
- [x] Markdown linting passes.
- [x] Existing internal links pass validation; repeatable external-link automation is included in Phase 2.

## Phase 2: Reorganize and normalize the library

Target human-documentation structure:

```text
README.md
AGENTS.md
CONTRIBUTING.md
.editorconfig
.markdownlint.jsonc
.agents/
  plugins/
    marketplace.json
docs/
  git-best-practices.md
  git-command-cheatsheet.md
  web-coding-standards.md
  website-development-checklist.md
  website-launch-checklist.md
  playwright-testing-guide.md
  wordpress-setup-checklist.md
  wordpress-cli-cheatsheet.md
  sitefinity-upgrade-runbook.md
  ...
plugins/
  web-dev-checklists/
    .codex-plugin/
      plugin.json
    skills/
      ...
```

Keep human-facing documents in one flat `docs/` directory while the collection remains easy to scan. Reserve the repository root for the README, contributor and agent instructions, validation configuration, and automation. Keep packaged Codex skills under `plugins/web-dev-checklists/skills/` because a skill is a packaged workflow rather than a human document. Add documentation subdirectories only when a category has enough material or supporting assets that the flat index becomes meaningfully harder to navigate.

Use lowercase kebab-case filenames following `<area>-<purpose>-<type>.md`, omitting redundant segments when the meaning remains clear. Prefer stable type suffixes such as `checklist`, `guide`, `standards`, `cheatsheet`, `plan`, `runbook`, and `reference`.

- [x] Move human documentation into the flat `docs/` directory.
- [x] Normalize filenames to lowercase kebab-case.
- [x] Update all internal links after moves and renames.
- [x] Rewrite the README as a categorized repository index.
- [x] Add a concise WP-CLI cheatsheet for common, high-impact WordPress operations.
- [x] Add `AGENTS.md` with authoring, sourcing, and validation guidance.
- [x] Add contribution and maintenance guidance.
- [x] Add EditorConfig and Markdown lint configuration.
- [x] Add automated internal and external link checking.
- [x] Add local and CI documentation-validation commands.
- [x] Adopt a common document pattern: one H1 and a `Purpose` section are required; audience, applicability, prerequisites, validation, rollback or recovery, and references are included when they help the reader act safely.
- [x] Define how verification dates and version-sensitive sources are maintained.

### Phase 2 exit criteria

- [x] Contributors can locate documents by task and platform.
- [x] Similar documents use consistent structure and vocabulary.
- [x] Documentation checks run locally and in CI.
- [x] No internal links are broken.
- [x] The repository clearly distinguishes general guidance from CMS-specific guidance.

## Phase 3: Add missing core checklists

### Skill-aligned checklists

- [x] Web project audit
- [x] Web accessibility audit
- [x] Web application security review
- [x] Web performance review
- [x] Technical SEO review
- [x] Website release and launch

Refactor the existing general website checklist into the website release and
launch checklist instead of creating overlapping documents.

### Supporting checklists

- [x] Dependency and software-supply-chain review
- [x] Privacy and data-handling review
- [x] CI/CD and release readiness
- [x] Production observability and operations
- [x] Agent-ready repository review
- [x] CMS content-governance review

### Shared checklist result model

Every checklist should capture:

- Scope and applicability
- Automated checks
- Manual checks
- Evidence
- Result: pass, fail, warning, or not applicable
- Severity and rationale
- Recommended remediation
- Owner and target date
- Accepted exceptions

### Phase 3 exit criteria

- [x] Every check is observable and testable.
- [x] Requirements and recommendations are distinguishable.
- [x] Compliance-sensitive items require jurisdiction-specific verification.
- [x] A human can run every checklist without Codex.
- [x] The checklists are structured for later use as skill references.

## Phase 4: Build the core skills

### Phase 4A: Plugin foundation

- [x] Scaffold `plugins/web-dev-checklists/` with a valid plugin manifest.
- [x] Add a repository-local marketplace entry for development and testing.
- [x] Define shared read-only defaults, safety boundaries, evidence rules, finding fields, and report structure.
- [x] Add deterministic generation and drift checking for skill-local copies of canonical references.
- [x] Add skill-reference validation to the local and CI repository checks.
- [x] Add a plugin-owned Playwright, axe, and Lighthouse audit runtime whose dependencies are installed in a user cache rather than the target project.
- [x] Require explicit approval before runtime bootstrap, browser download, or live-site execution.
- [x] Download and prefer the matching Playwright Chromium build after approval, with Chrome and Edge as launch-tested fallbacks.
- [x] Enable Chromium sandboxing by default and require an explicit isolated-environment override for an unsandboxed root run.
- [x] Record browser-error counts by default and make potentially sensitive error details opt-in.
- [x] Verify the runtime against a local website fixture with real browser, screenshot, axe, console, HTTP, and Lighthouse evidence.

The skills should combine the plugin-owned generic audit runtime, an available interactive browser, target-repository inspection, and existing project tools as appropriate. Project-specific Playwright tests remain valuable for authentication and important user journeys, but the target project does not need Playwright merely for the plugin to audit a URL. Missing credentials, inaccessible environments, unsupported journeys, or unavailable tools must be reported as `Not checked`, not treated as a pass.

### Phase 4B: Core skill build-out

Build the specialist skills before the cross-discipline audit skill:

1. [x] `review-web-accessibility`
2. [ ] `review-web-security`
3. [ ] `review-web-performance`
4. [ ] `review-technical-seo`
5. [ ] `prepare-website-launch`
6. [ ] `audit-web-project`

### Expected outputs

| Skill | Primary output |
| --- | --- |
| `review-web-accessibility` | Evidence-backed WCAG review that separates automated and manual results |
| `review-web-security` | Non-invasive risk review mapped to current OWASP guidance |
| `review-web-performance` | Lab and source findings, Core Web Vitals risks, budgets, and prioritized remediation |
| `review-technical-seo` | Crawl, indexing, metadata, structured-data, and migration findings |
| `prepare-website-launch` | Go/no-go report, owners, runbook, rollback plan, and post-launch checks |
| `audit-web-project` | Routed cross-discipline assessment with consolidated priorities |

### Skill implementation requirements

For every skill:

- [ ] Define realistic triggering prompts and non-triggering boundaries.
- [ ] Initialize the folder with the official skill scaffolding tool.
- [ ] Write concise, imperative `SKILL.md` instructions.
- [ ] Keep detailed guidance canonical in `docs/` and generate skill-local references for packaging.
- [ ] Add scripts only for deterministic, repeatable checks.
- [ ] Test every included script.
- [ ] Generate and verify `agents/openai.yaml`.
- [ ] Define inputs, assumptions, safe defaults, output format, and stopping
      conditions.
- [ ] Avoid unsupported compliance or certification claims.
- [ ] Run the skill validator.

When an existing human checklist becomes a skill reference, keep the canonical checklist in `docs/`. During packaging, generate the required skill-local copy under `references/` and verify that it matches the canonical source. Do not hand-maintain two authoritative copies of the same guidance.

### Phase 4 exit criteria

- [ ] Explicit and implicit invocation work as intended.
- [ ] Neighboring skill descriptions have clear boundaries.
- [ ] Findings use consistent evidence, severity, and limitation language.
- [ ] Each specialist skill works independently.
- [ ] The audit skill routes work without duplicating specialist instructions.
- [ ] All skill validators pass.

## Phase 5: Validate and publish the core library

- [ ] Test positive and negative trigger examples.
- [ ] Test a static or content-led site.
- [ ] Test a JavaScript web application.
- [ ] Test a CMS-backed site.
- [ ] Test missing-tool and incomplete-context behavior.
- [ ] Verify scripts on the supported operating systems.
- [ ] Obtain approval before independent-agent forward testing if that testing
      could be lengthy or modify live systems.
- [ ] Forward-test skills using fresh context and raw artifacts.
- [x] Add `.codex-plugin/plugin.json`.
- [x] Add a repository or personal marketplace entry for local installation.
- [ ] Choose and add a license.
- [ ] Adopt semantic versioning.
- [ ] Add plugin installation and usage guidance to the repository README.
- [x] Add basic plugin metadata.
- [ ] Add presentation assets if they materially improve discovery.
- [ ] Validate Markdown, links, manifests, and skills in CI.

### Phase 5 exit criteria

- [ ] The core plugin installs successfully from a clean environment.
- [ ] All six skills appear with correct metadata.
- [ ] Representative forward tests produce useful and bounded results.
- [ ] Packaged skills include all required references and scripts.
- [ ] The first public release is tagged and reproducible.

## Phase 6: Optional specialized skills

### WordPress skills

- [ ] Evaluate `setup-wordpress-project` after using the setup checklist.
- [ ] Evaluate `test-wordpress-site` after using the testing checklist.
- [ ] Evaluate `prepare-wordpress-launch` after using the launch checklist.
- [ ] Build `migrate-wordpress-site` as a distinct migration workflow.

### Tooling skills

- [ ] Build `configure-playwright-testing` if repeated use demonstrates value
      beyond the general Playwright documentation.

### Sitefinity skills

- [ ] Evaluate `bootstrap-sitefinity-project`.
- [ ] Evaluate `upgrade-sitefinity-project`.
- [ ] Evaluate `test-sitefinity-release`.
- [ ] Evaluate `prepare-cms-editor-training`.

Package broad web-quality skills separately from optional WordPress, testing,
and Sitefinity workflows so developers install only the skill families they
need.

### Specialized-skill admission criteria

Add a specialized skill only when:

- At least two realistic repeated use cases exist.
- The workflow adds material value beyond Codex's general knowledge.
- Its authoritative sources and safety boundaries are known.
- It can produce a clear, testable output.
- Its maintenance burden is justified.

## Suggested delivery slices

1. General web documentation refresh
2. Git and Playwright documentation refresh
3. WordPress documentation section
4. Sitefinity maintenance refresh
5. Repository reorganization and documentation validation
6. Core checklist set
7. Five specialist core skills
8. Cross-discipline audit skill
9. Core plugin validation and packaging
10. Optional specialized skill families

## Project publishing and go-live

- Rename the project and repo to a new name that reflects the new purpose, i.e. web dev checklists plus agent skills
- Set up public page on Computerkick
- Share to LinkedIn and Facebook
- Brainstorm marketing and sharing ideas

## Plan maintenance rules

- Update checkboxes only when the associated work and validation are complete.
- Update `Current phase`, `Next work item`, and `Last reviewed` whenever this plan materially changes.
- Record scope or sequencing changes in the decision log.
- Keep implementation details in the relevant pull request or commit rather than expanding this file into a work diary.
- Do not silently remove deferred work; move it to a later phase and explain why.

## Decision log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-07-21 | Modernize and normalize documentation before building skills. | Skills should encode reviewed guidance, not preserve stale advice. |
| 2026-07-21 | Make WordPress the primary CMS documentation track. | Expected future work is more WordPress-focused. |
| 2026-07-21 | Retain Sitefinity as lower-priority specialist guidance. | Existing knowledge remains useful, but should not define the core library. |
| 2026-07-21 | Build five specialist skills before `audit-web-project`. | The audit skill should route into stable specialist workflows. |
| 2026-07-21 | Separate core and optional plugin families. | This keeps skill discovery focused and reduces irrelevant context. |
| 2026-07-24 | Preserve critical risk coverage while keeping checklists assessable, security-conscious, and tied to meaningful outcomes. | Long inventories create review fatigue, but an arbitrary length target must not create blind spots. |
| 2026-07-24 | Keep human documentation flat under `docs/` and reserve the plugin's `skills/` directory for packaged workflows. | The current library is easier to scan by filename and README category than through a premature directory hierarchy. |
| 2026-08-19 | Package the core skills under `plugins/web-dev-checklists/` and treat browser and project test tooling as runtime capabilities. | A publishable plugin needs a normalized package identity, while installing Playwright in this repository would not make it available in a reviewed project. |
| 2026-08-19 | Add a plugin-owned, user-cached Playwright, axe, and Lighthouse runner. | Generic URL audits should work without modifying the target project, while project-owned tests remain available for application-specific journeys. |
| 2026-07-24 | Own documentation linting and link validation in the repository and CI. | Repeatable checks make reorganizations and source maintenance deterministic for humans and agents. |
| 2026-07-25 | Use one shared result model for review evidence, severity, ownership, and exceptions. | Checklist items should remain plain-language actions rather than repeating formal requirement labels. |
| 2026-07-25 | Refactor the general website checklist into a launch gate and preserve its broader concepts in focused Phase 3 checklists. | Humans need a runnable launch checklist, while future skills need clear specialist boundaries and one canonical home for detailed guidance. |
| 2026-07-28 | Restore a compact website development checklist. | The original repository included a practical build checklist whose purpose was lost when development and launch guidance were split into specialist reviews. |
