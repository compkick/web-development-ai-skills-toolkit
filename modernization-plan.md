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
- Current phase: Phase 1
- Next work item: Phase 1C, WordPress documentation
- Last reviewed: 2026-07-24

## Guiding decisions

- Correct and normalize the human documentation before encoding it in skills.
- Keep one canonical copy of detailed guidance in the final repository.
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

- [ ] Add `wordpress-setup-checklist.md`.
- [ ] Add `wordpress-testing-checklist.md`.
- [ ] Add `wordpress-launch-checklist.md`.
- [ ] Expand and modernize `wordpress-migration-checklist.md`.

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

- [ ] Update Sitefinity prerequisites.
- [ ] Update the Sitefinity project-start checklist.
- [ ] Update the Sitefinity test plan.
- [ ] Verify and update the Sitefinity upgrade instructions.
- [ ] Turn the Sitefinity training outline into a runnable training plan.
- [ ] Label version-specific and organization-specific assumptions clearly.

### Phase 1 exit criteria

- [ ] No known unsafe guidance remains.
- [ ] Version-sensitive claims have primary sources.
- [ ] Vendor and framework defaults are clearly labeled.
- [ ] Checklist items describe observable outcomes.
- [ ] Markdown linting passes.
- [ ] Links pass automated validation.

## Phase 2: Reorganize and normalize the library

Target human-documentation structure:

```text
README.md
AGENTS.md
CONTRIBUTING.md
docs/
  standards/
  checklists/
  how-tos/
  cms/
    wordpress/
    sitefinity/
  reference/
```

- [ ] Move documents into the target information architecture.
- [ ] Normalize filenames to lowercase kebab-case.
- [ ] Update all internal links after moves and renames.
- [ ] Rewrite the README as a categorized repository index.
- [ ] Add `AGENTS.md` with authoring, sourcing, and validation guidance.
- [ ] Add contribution and maintenance guidance.
- [ ] Add EditorConfig and Markdown lint configuration.
- [ ] Add automated internal and external link checking.
- [ ] Add local and CI documentation-validation commands.
- [ ] Adopt a common document structure:
  - Purpose
  - Audience
  - Applicability
  - Prerequisites
  - Procedure or checklist
  - Validation
  - Rollback or recovery
  - References
- [ ] Define how verification dates and version-sensitive sources are maintained.

### Phase 2 exit criteria

- [ ] Contributors can locate documents by task and platform.
- [ ] Similar documents use consistent structure and vocabulary.
- [ ] Documentation checks run locally and in CI.
- [ ] No internal links are broken.
- [ ] The repository clearly distinguishes general guidance from CMS-specific
      guidance.

## Phase 3: Add missing core checklists

### Skill-aligned checklists

- [ ] Web project audit
- [ ] Web accessibility audit
- [ ] Web application security review
- [ ] Web performance review
- [ ] Technical SEO review
- [ ] Website release and launch

Refactor the existing general website checklist into the website release and
launch checklist instead of creating overlapping documents.

### Supporting checklists

- [ ] Dependency and software-supply-chain review
- [ ] Privacy and data-handling review
- [ ] CI/CD and release readiness
- [ ] Production observability and operations
- [ ] Agent-ready repository review
- [ ] CMS content-governance review

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

- [ ] Every check is observable and testable.
- [ ] Requirements and recommendations are distinguishable.
- [ ] Compliance-sensitive items require jurisdiction-specific verification.
- [ ] A human can run every checklist without Codex.
- [ ] The checklists are structured for later use as skill references.

## Phase 4: Build the core skills

Build the specialist skills before the cross-discipline audit skill:

1. [ ] `review-web-accessibility`
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
- [ ] Put detailed guidance in skill-local `references/`.
- [ ] Add scripts only for deterministic, repeatable checks.
- [ ] Test every included script.
- [ ] Generate and verify `agents/openai.yaml`.
- [ ] Define inputs, assumptions, safe defaults, output format, and stopping
      conditions.
- [ ] Avoid unsupported compliance or certification claims.
- [ ] Run the skill validator.

When an existing human checklist becomes a skill reference, move the canonical
checklist into the skill and replace the former document with an appropriate
human-facing index link. Do not maintain independent copies of the same rules.

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
- [ ] Add `.codex-plugin/plugin.json`.
- [ ] Add a repository or personal marketplace entry for local installation.
- [ ] Choose and add a license.
- [ ] Adopt semantic versioning.
- [ ] Add plugin installation and usage guidance to the repository README.
- [ ] Add plugin metadata and presentation assets.
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
