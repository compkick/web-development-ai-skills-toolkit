# Contributing

## Purpose

Use this guide when adding, correcting, reorganizing, or reviewing repository documentation.

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
- Keep future Codex skill packages under `skills/`, separate from their human-readable source guidance.

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

Run the full documentation suite:

```bash
npm run docs:check
```

The full suite checks Markdown structure plus internal and external links. Focused commands are also available:

```bash
npm run docs:lint
npm run docs:links:internal
npm run docs:links:external
```

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
- [ ] `npm run docs:check` passes.
- [ ] No credentials, private data, backups, licenses, or organization-specific secrets are included.
