# Dev Docs and Checklists

Reusable standards, checklists, guides, runbooks, and cheatsheets for web development and CMS work. The library emphasizes high-impact, observable checks; secure defaults; current primary sources; and workflows that remain practical for humans.

## General web guidance

- [Web development and CMS coding standards](docs/web-coding-standards.md)
- [Website development checklist](docs/website-development-checklist.md)
- [Web project audit checklist](docs/web-project-audit-checklist.md)
- [Website release and launch checklist](docs/website-launch-checklist.md)
- [Web review findings reference](docs/web-review-findings-reference.md)

## Specialist web reviews

- [Web accessibility review checklist](docs/web-accessibility-review-checklist.md)
- [Web application security review checklist](docs/web-security-review-checklist.md)
- [Web performance review checklist](docs/web-performance-review-checklist.md)
- [Technical SEO review checklist](docs/technical-seo-review-checklist.md)

## Engineering workflows

- [Development using Git](docs/git-development-guide.md)
- [Git command cheatsheet](docs/git-command-cheatsheet.md)
- [Playwright testing guide](docs/playwright-testing-guide.md)
- [Dependency and software supply chain review checklist](docs/software-supply-chain-review-checklist.md)
- [CI/CD and release readiness checklist](docs/ci-cd-release-readiness-checklist.md)
- [Production observability and operations checklist](docs/production-observability-operations-checklist.md)
- [Agent-ready repository checklist](docs/agent-ready-repository-checklist.md)

## Content, privacy, and governance

- [Privacy and data-handling review checklist](docs/web-privacy-data-handling-review-checklist.md)
- [CMS content governance checklist](docs/cms-content-governance-checklist.md)

## WordPress

- [WordPress setup checklist](docs/wordpress-setup-checklist.md)
- [WordPress testing checklist](docs/wordpress-testing-checklist.md)
- [WordPress launch checklist](docs/wordpress-launch-checklist.md)
- [WordPress migration checklist](docs/wordpress-migration-checklist.md)
- [WordPress WP-CLI cheatsheet](docs/wordpress-cli-cheatsheet.md)

## Sitefinity

Sitefinity is retained as specialist maintenance guidance. New general and WordPress guidance should not assume Sitefinity conventions.

- [Sitefinity development prerequisites](docs/sitefinity-development-prerequisites.md)
- [Sitefinity project-start checklist](docs/sitefinity-project-start-checklist.md)
- [Sitefinity testing checklist](docs/sitefinity-testing-checklist.md)
- [Sitefinity upgrade runbook](docs/sitefinity-upgrade-runbook.md)
- [Sitefinity editor training plan](docs/sitefinity-editor-training-plan.md)

## Repository guidance

- [Contributing](CONTRIBUTING.md)
- [Agent authoring instructions](AGENTS.md)
- [Modernization plan](modernization-plan.md)

Human-facing documentation lives in the flat `docs/` directory and uses lowercase kebab-case filenames. The Codex plugin lives under `plugins/web-dev-checklists/`, with packaged skills kept separately from their canonical human-readable guidance.

Phase 4A established the plugin manifest, repository-local marketplace entry, shared review contract, generated-reference checks, and plugin-owned website audit runtime. Phase 4B is adding the individual review skills:

- [`review-web-accessibility`](plugins/web-dev-checklists/skills/review-web-accessibility/SKILL.md) — produce an evidence-backed accessibility review that separates automated, source-based, interactive, assistive-technology, and untested results.

## Agent website audit runtime

The plugin includes a generic Playwright, axe, and Lighthouse runner that audits an authorized URL without adding dependencies to the website project. After approval, it installs pinned Node.js dependencies and Playwright Chromium into the user's cache, prefers that matching browser, and falls back to Chrome or Edge.

From the repository root, bootstrap the runtime once:

```bash
npm run runtime:bootstrap
```

Then run an audit into a new or empty output directory:

```bash
npm run runtime:audit -- --url https://site.example --output ./website-audit
```

See [website audit runtime guidance](plugins/web-dev-checklists/shared/website-audit-runtime.md) for permissions, optional Chromium installation, outputs, and limitations.

Run a deterministic skill evidence profile into a new or empty output directory:

```bash
npm run review:website -- --profile review-web-accessibility --url https://site.example --output ./accessibility-evidence
```

The profile produces normalized `evidence.json` and checklist `coverage.json` files alongside the raw browser, axe, screenshot, and Lighthouse artifacts. It identifies manual and partially automated checklist coverage instead of treating automated evidence as a complete skill result.

After bootstrapping the runtime, verify the deterministic profiles against their local pass and fail fixtures:

```bash
npm run reviews:test
```

## Validate the repository

Install the current Node.js LTS release and the locked development dependency:

```bash
npm ci
```

Run every documentation and skill-reference check:

```bash
npm run repo:check
```

Individual commands are available for Markdown linting and internal or external link checks:

```bash
npm run docs:lint
npm run docs:links:internal
npm run docs:links:external
npm run skills:refs:check
npm run runtime:check
npm run reviews:check
npm run deps:audit
```

The same checks run in GitHub Actions. See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch, sourcing, review, and maintenance workflow.

VS Code with the `markdownlint` extension is a convenient editing and preview setup. Compatible Markdown editors such as Typedown work as well; the repository commands remain the authoritative validation.
