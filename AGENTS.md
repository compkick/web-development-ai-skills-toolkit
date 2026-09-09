# Repository instructions for coding agents

## Scope

These instructions apply to the entire repository. This repository contains human documentation and packaged Codex skills. Keep those concerns distinct.

## Preserve the source material

- Preserve the original author's useful ideas when modernizing or reorganizing documents.
- Correct unsafe, inaccurate, or obsolete advice, but do not silently remove an idea merely because the structure changes.
- Before a substantial rewrite, compare against the committed version and account for removed concepts.
- Keep user changes and unrelated work intact.

## Repository structure

- Keep human-facing guidance in the flat `docs/` directory.
- Use lowercase kebab-case filenames following `<area>-<purpose>-<type>.md`, omitting redundant words when the filename remains clear.
- Prefer the type suffixes `checklist`, `guide`, `standards`, `cheatsheet`, `plan`, `runbook`, and `reference`.
- Keep repository governance, plans, validation configuration, and automation at the root or in their conventional tool directories.
- Keep packaged Codex skills under `plugins/web-dev-checklists/skills/`; do not place skill packages in `docs/`.
- Keep human-readable guidance canonical in `docs/` and use `npm run skills:refs` to generate skill-local reference copies.
- Keep the plugin-owned website audit runtime under `plugins/web-dev-checklists/runtime/`; never install its dependencies into the website project being reviewed.
- Obtain user approval before bootstrapping the audit runtime, downloading a browser, or running it against a target URL.
- Add documentation subdirectories only when a category or its supporting assets have become materially difficult to navigate in the flat index.

## Authoring style

- Write for a web developer or technical project owner who needs to act on the guidance.
- Keep one paragraph, checklist item, or list item on one physical line. Do not hard-wrap prose merely to satisfy a column limit.
- Use standard Markdown headings and leave blank lines around headings, lists, blockquotes, tables, and code fences.
- Start every document with one H1 and a `## Purpose` section.
- Add only the sections the document needs. Use `Audience`, `Applicability`, `Prerequisites`, `Validation`, `Rollback or recovery`, and `References` when they help the reader act safely.
- Use `- [ ]` for an outcome a reader can actually verify. Do not convert explanatory material into checkbox busywork.
- Keep checklists concise and high-impact without dropping critical security, accessibility, privacy, recovery, or operational coverage.
- State what a completed checkbox proves when that meaning is not obvious.
- Label vendor defaults, examples, project-specific choices, organization-specific processes, and version-specific requirements.
- Prefer relative Markdown links for repository files and descriptive link text for external sources.
- Never include real credentials, secrets, proprietary product license files, personal data, private endpoints, or production exports.

## Sources and maintenance

- Use primary, authoritative sources for standards and version-sensitive claims.
- Check current vendor documentation before adding a version, support policy, runtime requirement, command option, or security recommendation.
- Prefer durable unversioned guidance when the exact version is not necessary.
- Add `Last verified against official documentation: YYYY-MM-DD.` to documents whose usefulness materially depends on changing vendor behavior or command syntax.
- Update a verification date only after checking all material version-sensitive claims and references in that document.
- Review affected documents when a cited standard, vendor release, support lifecycle, or tool behavior materially changes. A passing link check alone does not verify that the advice remains correct.

## Validation

Run the complete validation suite after changing documentation, skills, links, filenames, repository instructions, or validation tooling:

```bash
npm ci
npm run repo:check
```

For focused work, use:

```bash
npm run docs:lint
npm run docs:links:internal
npm run docs:links:external
npm run skills:refs:check
npm run runtime:check
npm run reviews:check
npm run deps:audit
```

After changing the website audit runtime or deterministic review profiles, bootstrap it in an isolated cache and run `npm run runtime:test` plus `npm run reviews:test` against the local fixtures. These integration tests require Chrome, Edge, or Playwright Chromium.

Also run `git diff --check` and inspect `git diff --stat` plus the relevant content diff. Do not mark a roadmap item complete until the associated work and validation are complete.
