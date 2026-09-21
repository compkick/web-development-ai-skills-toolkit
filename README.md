# Web Development AI Skills Toolkit

Practical checklists, automated audits, and agent skills for building better websites.

Reusable standards, checklists, guides, runbooks, and cheatsheets for web development and CMS work. The library emphasizes high-impact, observable checks; secure defaults; current primary sources; and workflows that remain practical for humans.

Created by [Computerkick](https://computerkick.com).

## Requirements

To run automated reports, either from the command line or through an agent skill, install these prerequisites first:

- **Node.js 22.19.0 or newer.** Use a supported LTS release that meets this minimum.
- **npm.** Use the version bundled with your Node.js installation; the toolkit does not specify a separate npm minimum.
- **For agent use:** Codex with the toolkit plugin installed. Command-line reports do not require Codex.
- **Network access and permission** to download the audit dependencies/browser and access the website you are authorized to review.

Follow the [Node.js and npm installation instructions](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/). After installation, reopen your terminal and agent app so they can find both commands. Check:

```bash
node --version
npm --version
```

**The toolkit bootstrap does not install Node.js or npm.** Once those are available, `npm run runtime:bootstrap` from this repository's root installs the pinned Playwright, axe, Lighthouse, and Chromium dependencies into the toolkit's user cache. An agent can run this setup after approval. See the [runtime setup guide](docs/website-audit-runtime-guide.md#install-the-runtime).

Reading the human checklists requires no software installation. Python and PyYAML are only needed for contributor skill/plugin validation, not for running reports. See [tested platforms](docs/supported-platforms-reference.md).

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
- [Website audit runtime guide](docs/website-audit-runtime-guide.md)
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
- [Security reporting](SECURITY.md)
- [Agent authoring instructions](AGENTS.md)
- [Modernization plan](modernization-plan.md)
- [Publishing copy and artwork](publishing-kit.md)
- [Supported platforms](docs/supported-platforms-reference.md)
- [MIT license](LICENSE)

For support, update inquiries, or security questions, use the [Computerkick contact form](https://computerkick.com/contact/). For suspected vulnerabilities, follow the [private reporting guidance](SECURITY.md) instead of posting details publicly.

Human-facing documentation lives in the flat `docs/` directory and uses lowercase kebab-case filenames. The Codex plugin lives under `plugins/web-dev-checklists/`, with packaged skills kept separately from their canonical human-readable guidance.

The plugin provides six focused review skills:

- [`review-web-accessibility`](plugins/web-dev-checklists/skills/review-web-accessibility/SKILL.md) — produce an evidence-backed accessibility review that separates automated, source-based, interactive, assistive-technology, and untested results.
- [`review-web-security`](plugins/web-dev-checklists/skills/review-web-security/SKILL.md) — combine bounded public checks, source and configuration evidence, approved authenticated testing, and operational evidence without claiming a penetration test.
- [`review-web-performance`](plugins/web-dev-checklists/skills/review-web-performance/SKILL.md) — combine repeatable desktop Lighthouse evidence with real-user data, source review, budgets, and representative workflows without treating one score as the result.
- [`review-technical-seo`](plugins/web-dev-checklists/skills/review-technical-seo/SKILL.md) — combine rendered crawl and indexing evidence with source, migration, Search Console, analytics, and representative-page review without promising rankings or indexing.
- [`review-website-launch`](plugins/web-dev-checklists/skills/review-website-launch/SKILL.md) — combine a bounded homepage and link preflight with prior specialist reviews and human confirmations to make a concise go/no-go recommendation and tailored launch checklist.
- [`audit-web-project`](plugins/web-dev-checklists/skills/audit-web-project/SKILL.md) — combine repository, public website, operational, and supplied evidence into a routed cross-discipline assessment with consolidated priorities.

## Install the Codex plugin

The repository includes a local Codex marketplace containing the internally named `web-dev-checklists` plugin. Install **Web Development AI Skills Toolkit** once to use its six skills from other Codex tasks and project folders.

Complete the [requirements](#requirements) first. Install the complete plugin, including its shared runtime; the skill folders are not standalone packages.

Clone or download this repository, install the current [Codex CLI](https://developers.openai.com/codex/cli/), and register the repository as a local marketplace:

```bash
codex plugin marketplace add "<absolute-path-to-this-repository>"
```

In the Codex desktop app, refresh Codex, open **Plugins**, select **Personal**, open **Web Development AI Skills Toolkit**, and select the plus button to install it. Start a new task after installation so Codex loads the bundled skills.

In Codex CLI, start Codex and enter `/plugins`, select the **Personal** marketplace, install **Web Development AI Skills Toolkit**, and then start a new session.

From any project folder, invoke a skill explicitly:

```text
$review-web-accessibility Review https://site.example, save the evidence under .output, and give me a prioritized accessibility report.
```

```text
$review-web-security Review https://site.example, save the evidence under .output, and give me a prioritized security report.
```

```text
$review-web-performance Review https://site.example, save the evidence under .output, and give me a prioritized performance report.
```

```text
$review-technical-seo Review https://site.example, save the evidence under .output, and give me a prioritized technical SEO report.
```

```text
$review-website-launch Review https://site.example, decide whether this release is ready to launch, and give me the remaining developer and post-launch checklist.
```

```text
$audit-web-project Audit this repository and https://site.example, then prioritize the most important technical risks and next steps.
```

Codex can also choose an installed skill from a natural-language request such as “Is this website ready to launch from an accessibility perspective?” Explicit invocation is useful when testing a specific skill. Runtime dependencies stay in the user cache rather than the project being reviewed.

When updating a locally installed development build, validate the plugin, update its Codex cachebuster, reinstall it from the **Personal** marketplace, and start another new task before retesting.

### First-run permissions

On first use, Codex may request approval to download the audit dependencies and Chromium, access the target website, and write evidence files. Prompts depend on your Codex permission settings and saved approvals. Some requests may recur on later runs.

For fewer interruptions, select **Approve for me** in the permissions control beneath the prompt, if available. Read the warning and accept only if you are comfortable letting an automatic reviewer approve eligible actions without asking you each time. The reviewer can make mistakes. **Ask for approval** remains supported; **Full access** is not required. See the [setup permission guidance](docs/website-audit-runtime-guide.md#first-run-permissions) and [OpenAI's auto-review documentation](https://learn.chatgpt.com/docs/sandboxing/auto-review).

### Versioning

The root `package.json` contains the toolkit's release version. The audit runtime uses the same version, and the plugin manifest uses that version as its base. Local plugin builds add `+codex.<timestamp>` as valid semantic-version build metadata so Codex recognizes a refreshed build without inventing another release number. Review profiles and evidence schemas keep independent contract versions because they change only when their procedure or data format changes.

Run `npm run versions:check` to confirm that the root package, lockfiles, audit runtime, and plugin base version agree. For a release, update all of those base versions together, refresh the plugin cachebuster, validate the repository, and reinstall the plugin.

## Agent website audit runtime

The plugin includes a generic Playwright, axe, and Lighthouse runtime that reviews an authorized URL without adding dependencies to the website project. It prefers its matching Playwright Chromium and falls back to Chrome or Edge.

Check whether the runtime matching the current plugin is already installed:

```bash
npm run runtime:status
```

If the read-only status check reports that the current runtime is not ready, bootstrap it from the repository root after approval:

```bash
npm run runtime:bootstrap
```

Use the low-level collector for troubleshooting, profile development, or ad hoc raw browser evidence:

```bash
npm run runtime:audit -- --url https://site.example
```

Use a deterministic checklist profile for normal human or agent review work:

```bash
npm run review:website -- --profile review-web-accessibility --url https://site.example
npm run review:website -- --profile review-web-security --url https://site.example
npm run review:website -- --profile review-web-performance --url https://site.example
npm run review:website -- --profile review-technical-seo --url https://site.example
npm run review:website -- --profile review-website-launch --url https://site.example
npm run review:website -- --profile audit-web-project --url https://site.example
```

Each command writes a timestamped package under `.output/<profile>/<host>/<run-id>/` by default. See the canonical [website audit runtime guide](docs/website-audit-runtime-guide.md) for profile scope, permissions, output artifacts, configuration, limitations, and plugin-local commands.

### Test the checklist runners

After bootstrapping the runtime, verify the deterministic profiles against their local pass and fail fixtures:

```bash
npm run reviews:test
npm run reviews:test-accessibility
npm run reviews:test-security
npm run reviews:test-performance
npm run reviews:test-technical-seo
npm run reviews:test-launch
npm run reviews:test-audit
```

Use `reviews:test` to run every profile fixture, or use a profile-specific command while working on one review.

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
