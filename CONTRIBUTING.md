# Contributing

## Purpose

Use this guide when adding, correcting, reorganizing, or reviewing repository documentation and Codex skills.

For support, update inquiries, or security questions, use the [Computerkick contact form](https://computerkick.com/contact/). Report suspected vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Branch and review workflow

The repository uses `develop` as its integration branch and `main` as its publishing branch.

1. Update local `develop`.
2. Create a short-lived topic branch from `develop`.
3. Make one coherent documentation change and update affected links and indexes.
4. Run the local validation suite.
5. Open a pull request into `develop` and address review findings.
6. Promote reviewed release changes from `develop` to `main` through a separate pull request.

Do not commit directly to `main`. Repository owners may adjust this workflow when branch protections or release automation require it.

## Add or rename a document

- Put human-facing guidance in `docs/`.
- Name files in lowercase kebab-case using `<area>-<purpose>-<type>.md`.
- Choose a filename that describes the reader's task, not the internal team that created it.
- Add the document to the appropriate categorized section in `README.md`.
- Update every relative link in the same change.
- Keep Codex skill packages under `plugins/web-dev-checklists/skills/`, separate from their human-readable source guidance.

## Add or update a Codex skill

- Keep the detailed human checklist canonical in `docs/`.
- Add the skill's canonical document mappings to `scripts/skill-reference-map.json`.
- Run `npm run skills:refs` after changing a mapped source document or adding a skill.
- Follow the shared safety, evidence, findings, and reporting rules in `plugins/web-dev-checklists/shared/web-review-contract.md`.
- Keep generic browser-audit dependencies in the plugin-owned runtime rather than adding them to a reviewed website project.
- Get approval before bootstrapping the runtime, downloading a browser, or auditing a live URL.
- Keep each skill independently usable and add scripts only for deterministic, repeatable checks.

## Write useful guidance

- Begin with one H1 and a `## Purpose` section that defines when the document should be used.
- Add audience, applicability, prerequisites, validation, recovery, and references only where they improve safe execution.
- Make checklist items observable and worth reviewing.
- Preserve critical coverage while combining redundant or overly granular items.
- Explain risk before commands that modify history, data, access, infrastructure, or production behavior.
- Use placeholders such as `site.example`; never include real secrets or sensitive client information.
- Follow the complete authoring and preservation rules in [AGENTS.md](AGENTS.md).

## Source current claims

- Cite primary standards, vendor documentation, or official project documentation near the relevant guidance or in `## References`.
- Verify current documentation before changing a version-sensitive claim.
- For materially version-sensitive documents, record `Last verified against official documentation: YYYY-MM-DD.` after the references.
- Do not advance the verification date after a copy edit or link-only change.
- Re-review affected guidance when a source announces a breaking change, deprecation, support-lifecycle change, or material security update.

## Validate locally

Install the current Node.js LTS release, then install the locked dependency:

```bash
npm ci
```

Run the full repository suite:

```bash
npm run repo:check
```

The build-validation suite checks Markdown structure, internal links, and generated skill references. External links run separately as an informational CI job: unavailable websites and private GitHub links produce a warning, not a failed build. No authentication tokens or private-link exceptions are used. Run `npm run docs:links:external` explicitly when checking publication readiness; that command still exits nonzero for failures. Focused commands are also available:

```bash
npm run docs:lint
npm run docs:links:internal
npm run docs:links:external
npm run skills:refs:check
npm run runtime:check
npm run reviews:check
npm run deps:audit
```

After changing the website audit runtime or deterministic review profiles, bootstrap it in an isolated cache and run `npm run runtime:test` plus `npm run reviews:test` against the local fixtures.

`repo:check` includes JSON Schema validation, evaluator contracts, report rendering, cache behavior, and bounded HTTP tests without launching a browser. Ajv and its format checks are repository-only development dependencies. The separate browser-fixture CI job installs the pinned runtime and Chromium in a fresh cache and runs both browser suites with sandboxing enabled. See [Playwright's CI setup](https://playwright.dev/docs/ci-intro).

### Runtime code locations

- `runtime/scripts/`: CLI entry points and integration tests.
- `runtime/config/`: settings, dependency fingerprints, worker staging, and readiness.
- `runtime/browser/` and `runtime/collectors/`: browser lifecycle and bounded evidence collection.
- `runtime/evaluators/`: profile-specific assessment rules; keep these explicit.
- `runtime/evidence/`: shared package structure, artifact handling, and failed-run records.
- `runtime/reporting/`: shared HTML layout and safety helpers, plus specialist report content.
- `runtime/testing/`: shared fixture lifecycle, subprocess timeouts, artifact assertions, and schema validation.

These paths are relative to `plugins/web-dev-checklists/`. Change a shared behavior once in its owning module, then test every affected profile. Keep generated reference copies; edit their canonical sources instead.

The official skill and plugin validators require Python and the locked development dependency in `requirements-dev.txt`. Install it in a local virtual environment rather than relying on a global package:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
```

On Windows PowerShell, activate the environment with `.\.venv\Scripts\Activate.ps1`, then run `python -m pip install -r requirements-dev.txt`. Run the skill and plugin validators documented by their respective Codex creator skills from that environment.

### Official validator record

On 2026-09-20, the official validators bundled with the local Codex `plugin-creator` and `skill-creator` system skills passed against commit `bbad993` using Python 3.14.5 and PyYAML 6.0.3:

- `validate_plugin.py plugins/web-dev-checklists`: passed.
- `quick_validate.py` against each of `audit-web-project`, `review-technical-seo`, `review-web-accessibility`, `review-web-performance`, `review-web-security`, and `review-website-launch`: all passed.

Validator SHA-256 fingerprints: `validate_plugin.py` = `1E6CB914505B458856C2CFAB7D18A224731C743EF47E0C9D78AFE64F35B67F7C`; `quick_validate.py` = `6068513D924ED3559E186DFCDEAD7439129828DCF402167FD925C06DFFBF2806`.

To repeat the checks, use the installed creator skills' validator scripts with the repository's Python virtual environment. Pass the plugin root to the plugin validator and each folder under `plugins/web-dev-checklists/skills/` to the skill validator. Record the candidate commit, validator fingerprints, Python/PyYAML versions, and results before release.

These are local structural-validation results, not CI jobs, installation tests, or proof of correct agent behavior. CI continues to run repository/schema checks and all browser-profile fixtures. Rerun the official validators for the final release candidate; do not treat this record as approval of later package changes.

Before requesting review, also run:

```bash
git diff --check
git status --short
```

## Pull-request readiness

- [ ] The change has one clear purpose.
- [ ] Original useful ideas remain represented or intentional removals are explained.
- [ ] New or changed claims use current primary sources.
- [ ] Checklists remain high-impact and realistically assessable.
- [ ] Filenames, the README index, and internal links agree.
- [ ] `npm run repo:check` passes.
- [ ] No credentials, private data, backups, proprietary product license files, or organization-specific secrets are included.
