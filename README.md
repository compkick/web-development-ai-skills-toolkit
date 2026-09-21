# Web Development AI Skills Toolkit

## About

The Web Development AI Skills Toolkit (or Web Dev AI Skills Toolkit) is a set of practical checklists, automated audits, and agent skills for building better websites.

Use the checklists yourself, run evidence reports from the command line, or ask an agent to review a website and prioritize findings. The library includes general web guidance, WordPress lifecycle checklists, and Sitefinity maintenance runbooks.

The plugin provides six focused review skills:

- [`review-web-accessibility`](plugins/web-dev-checklists/skills/review-web-accessibility/SKILL.md) — produce an evidence-backed accessibility review that separates automated, source-based, interactive, assistive-technology, and untested results.
- [`review-web-security`](plugins/web-dev-checklists/skills/review-web-security/SKILL.md) — combine bounded public checks, source and configuration evidence, approved authenticated testing, and operational evidence without claiming a penetration test.
- [`review-web-performance`](plugins/web-dev-checklists/skills/review-web-performance/SKILL.md) — combine repeatable desktop Lighthouse evidence with real-user data, source review, budgets, and representative workflows without treating one score as the result.
- [`review-technical-seo`](plugins/web-dev-checklists/skills/review-technical-seo/SKILL.md) — combine rendered crawl and indexing evidence with source, migration, Search Console, analytics, and representative-page review without promising rankings or indexing.
- [`review-website-launch`](plugins/web-dev-checklists/skills/review-website-launch/SKILL.md) — combine a bounded homepage and link preflight with prior specialist reviews and human confirmations to make a concise go/no-go recommendation and tailored launch checklist.
- [`audit-web-project`](plugins/web-dev-checklists/skills/audit-web-project/SKILL.md) — combine repository, public website, operational, and supplied evidence into a routed cross-discipline assessment with consolidated priorities.

## Created By

[Computerkick](https://computerkick.com).

## Requirements

To run automated reports, either from the command line or through an agent skill, install these prerequisites first:

- **Node.js 22.19.0 or newer.** Use a supported LTS release that meets this minimum.
- **npm.** Use the version bundled with your Node.js installation; the toolkit does not specify a separate npm minimum.
- **For agent use:** a local agent with file and command access. Codex plugin installation is tested; see the compatibility notes for other agents below. Command-line reports do not require an agent.
- **Network access and permission** to download the audit dependencies/browser and access the website you are authorized to review.

Follow the [Node.js and npm installation instructions](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/). After installation, reopen your terminal and agent app so they can find both commands. Check:

```bash
node --version
npm --version
```

**The toolkit bootstrap does not install Node.js or npm.** Once those are available, `npm run runtime:bootstrap` from this repository's root installs the pinned Playwright, axe, Lighthouse, and Chromium dependencies into the toolkit's user cache. An agent can run this setup after approval. See the [runtime setup guide](docs/website-audit-runtime-guide.md#install-the-runtime).

Reading the human checklists requires no software installation. See [tested platforms](docs/supported-platforms-reference.md).

## Repository guidance

- `docs/` contains the canonical human-readable checklists and guides.
- `plugins/web-dev-checklists/skills/` contains the six agent skills and their packaged references.
- `plugins/web-dev-checklists/runtime/` contains the shared automated evidence runner.
- `.output/` contains generated reports and is ignored by Git.

Keep the plugin folder intact: the skills use its shared runtime. See the [supported platforms](docs/supported-platforms-reference.md) and [MIT license](LICENSE).

## How to install

### Codex

The repository includes a local Codex marketplace containing the internally named `web-dev-checklists` plugin. Install **Web Development AI Skills Toolkit** once to use its six skills from other Codex tasks and project folders.

Complete the [requirements](#requirements) first. Install the complete plugin, including its shared runtime; the skill folders are not standalone packages.

Clone or download this repository, install the current [Codex CLI](https://developers.openai.com/codex/cli/), and register the repository as a local marketplace:

```bash
codex plugin marketplace add "<absolute-path-to-this-repository>"
```

In the Codex desktop app, refresh Codex, open **Plugins**, select **Personal**, open **Web Development AI Skills Toolkit**, and select the plus button to install it. Start a new task after installation so Codex loads the bundled skills.

In Codex CLI, start Codex and enter `/plugins`, select the **Personal** marketplace, install **Web Development AI Skills Toolkit**, and then start a new session.

### Bionic / general use

Clone or download the complete repository and meet the requirements above. You can use the checklists directly or run the commands under [Manual runs](#manual-runs) without installing any agent plugin.

Bionic supports skills and can discover compatible skills from other apps through **Settings → Skills → Use skills found in other apps**. Select a discovered skill with `@`. See [Bionic's skill documentation](https://lmstudio.ai/docs/bionic/agent/skills).

**Toolkit compatibility is not yet verified in Bionic.** Discovery alone does not prove that Bionic can resolve the shared runtime. Do not import only a `SKILL.md` file or copy individual skill folders away from the plugin. For an experimental checkout-based review, give your file/command-capable agent the following request, replacing the paths and URL:

```text
Read <toolkit-repository>/plugins/web-dev-checklists/skills/review-web-accessibility/SKILL.md and its required references. Review https://site.example with my authorization. Keep the shared runtime in the toolkit checkout, ask before installing missing prerequisites or dependencies, and save evidence under <target-project>/.output using the documented profile/host/run structure. Report any unavailable tools or checks you cannot perform.
```

This is direct use of the local instructions, not a verified native skill installation. Keep the repository available and grant only the file, command, and network access needed for the review.

### Claude Code

**A native Claude Code plugin installation is not yet packaged or tested in this repository.** Claude Code supports its own skill/plugin discovery locations; our Codex marketplace entry does not register the toolkit there. See [Claude Code's skill documentation](https://code.claude.com/docs/en/skills).

For experimental use, make the complete toolkit checkout accessible to Claude Code and use the checkout-based prompt above, or run the [manual reports](#manual-runs) yourself and ask Claude to interpret the results. Do not copy the six skill folders into `.claude/skills/` without also addressing their shared-runtime paths. Ordinary Claude web chat is not equivalent to local Claude Code execution.

### First-run permissions

On first use, Codex (or your other agent) may request approval to download the audit dependencies and Chromium, access the target website, and write evidence files. Prompts depend on your Codex permission settings and saved approvals. Some requests may recur on later runs.

For fewer interruptions, select **Approve for me** in the permissions control beneath the prompt, if available. Read the warning and accept only if you are comfortable letting an automatic reviewer approve eligible actions without asking you each time. The reviewer can make mistakes. **Ask for approval** remains supported; **Full access** is not required. See the [setup permission guidance](docs/website-audit-runtime-guide.md#first-run-permissions) and [OpenAI's auto-review documentation](https://learn.chatgpt.com/docs/sandboxing/auto-review).

## How to use

Open your agent app (such as Codex) and start a new chat with the toolkit available. You do not need to open the website's project folder or have its source code: you can review an authorized public website by supplying its URL in a plain chat.

Automated reports still need an agent environment with command, file, and network access, plus the prerequisites above. The agent uses its task folder or an agreed local folder to save evidence; that folder does not need to contain a web project. Provide a repository only when you want source-code or configuration checks as well.

### Invoke a skill explicitly

In Codex, name the skill in your chat message to select a specific review. Replace `https://site.example` with the website you are authorized to review:

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
$audit-web-project Audit https://site.example, then prioritize the most important technical risks and next steps. Identify any checks that need source code or backend access.
```

For a repository-aware audit, you can instead ask:

```text
Audit this repository and https://site.example, then prioritize the most important technical risks and next steps.
```

### Let the agent choose a skill

Ask in plain language without naming a skill, for example:

```text
Review https://site.example for accessibility problems and give me the most important fixes first.
```

```text
Is https://site.example ready to launch? Review the available evidence and tell me what I still need to check manually.
```

Codex can select the relevant installed skill from your request. Other agent apps may use different selection controls; see their installation and compatibility notes above.

The agent summarizes the findings in chat and provides the location of the saved reports. Evidence normally goes under `.output/<profile>/<host>/<run-id>/` in the task or agreed output folder. Runtime dependencies stay in the user cache, separate from that evidence and any website project.

## Contributors and testers

### Validate the repository

For contributors and release testing, not ordinary report use. After meeting the Node.js/npm requirements, install the locked development dependencies:

```bash
npm ci
```

Run the non-browser repository checks:

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

Repository validation and browser fixtures run in GitHub Actions. External links are checked separately as informational warnings. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and official skill/plugin validators; only those contributor validators require Python and PyYAML.

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

## Manual runs

You can run the checklist evidence reports manually, without an AI agent. From a terminal in this repository's root, use the commands below. The shared Playwright, axe, and Lighthouse runtime prefers its matching Chromium build and falls back to Chrome or Edge; it does not add dependencies to the website project.

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

## Human-review checklists

The Web Development AI Skills Toolkit is based on a set of practical checklists and guides originally written by developers, for developers to use directly, without an AI agent or any software installation.

Instead of "reinventing the wheel" project after project, I decided to write these simple guides and checklists. These documents are the source guidance for the agent skills (note that not every document has a matching skill or automated runner). Those source documents are listed in this section.

Open the document that fits your task, work through the relevant items, and record what is complete or still needs attention. The documents cover building, testing, launching, and maintaining websites, including checks that automated reports cannot verify.

### General web guidance

- [Web development and CMS coding standards](docs/web-coding-standards.md)
- [Website development checklist](docs/website-development-checklist.md)
- [Web project audit checklist](docs/web-project-audit-checklist.md)
- [Website release and launch checklist](docs/website-launch-checklist.md)
- [Web review findings reference](docs/web-review-findings-reference.md)

### Specialist web reviews

- [Web accessibility review checklist](docs/web-accessibility-review-checklist.md)
- [Web application security review checklist](docs/web-security-review-checklist.md)
- [Web performance review checklist](docs/web-performance-review-checklist.md)
- [Technical SEO review checklist](docs/technical-seo-review-checklist.md)

### Engineering workflows

- [Development using Git](docs/git-development-guide.md)
- [Git command cheatsheet](docs/git-command-cheatsheet.md)
- [Playwright testing guide](docs/playwright-testing-guide.md)
- [Website audit runtime guide](docs/website-audit-runtime-guide.md)
- [Dependency and software supply chain review checklist](docs/software-supply-chain-review-checklist.md)
- [CI/CD and release readiness checklist](docs/ci-cd-release-readiness-checklist.md)
- [Production observability and operations checklist](docs/production-observability-operations-checklist.md)
- [Agent-ready repository checklist](docs/agent-ready-repository-checklist.md)

### Content, privacy, and governance

- [Privacy and data-handling review checklist](docs/web-privacy-data-handling-review-checklist.md)
- [CMS content governance checklist](docs/cms-content-governance-checklist.md)

### WordPress

- [WordPress setup checklist](docs/wordpress-setup-checklist.md)
- [WordPress testing checklist](docs/wordpress-testing-checklist.md)
- [WordPress launch checklist](docs/wordpress-launch-checklist.md)
- [WordPress migration checklist](docs/wordpress-migration-checklist.md)
- [WordPress WP-CLI cheatsheet](docs/wordpress-cli-cheatsheet.md)

### Sitefinity

Sitefinity is a specialist, legacy .NET CMS. I retained those checklists here for maintenance.

- [Sitefinity development prerequisites](docs/sitefinity-development-prerequisites.md)
- [Sitefinity project-start checklist](docs/sitefinity-project-start-checklist.md)
- [Sitefinity testing checklist](docs/sitefinity-testing-checklist.md)
- [Sitefinity upgrade runbook](docs/sitefinity-upgrade-runbook.md)
- [Sitefinity editor training plan](docs/sitefinity-editor-training-plan.md)

## Support

For support requests, update inquiries, bug reports, feature requests, or security questions, use the [Computerkick contact form](https://computerkick.com/contact/).

Include the toolkit version and a sanitized description of the problem. Follow [SECURITY.md](SECURITY.md) for private vulnerability reports. No response-time guarantee or managed support service is included.

## Development and legacy info

Maintainer and agent-authoring references:

- [Contributing and official validator records](CONTRIBUTING.md)
- [Agent authoring instructions](AGENTS.md)
- [Modernization plan and release gates](modernization-plan.md)
- [Publishing copy and artwork](publishing-kit.md)

Edit human guidance in `docs/` and run `npm run skills:refs` to refresh packaged references. Do not maintain separate hand-edited copies in each skill.

When updating a locally installed development build, validate the plugin, refresh its Codex cachebuster, reinstall it from the **Personal** marketplace, and start a new task before retesting.

### Versioning

The root `package.json` contains the toolkit's release version. The audit runtime uses the same version, and the plugin manifest uses that version as its base. Local plugin builds add `+codex.<timestamp>` as valid semantic-version build metadata so Codex recognizes a refreshed build without inventing another release number. Review profiles and evidence schemas keep independent contract versions because they change only when their procedure or data format changes.

Run `npm run versions:check` to confirm that the root package, lockfiles, audit runtime, and plugin base version agree. For a release, update all of those base versions together, refresh the plugin cachebuster, validate the repository, and reinstall the plugin.

VS Code with the `markdownlint` extension is a convenient editing and preview setup. Compatible Markdown editors such as Typedown work as well; the repository commands remain the authoritative validation.
