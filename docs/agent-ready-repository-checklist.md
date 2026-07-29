# Agent-ready repository checklist

## Purpose

Use this checklist to determine whether a coding agent can understand, change, validate, and hand off work in a repository without relying on undocumented tribal knowledge or unsafe assumptions. It is written for Codex but most outcomes benefit human contributors and other coding agents.

Agent readiness does not mean granting broad permissions or automating every task. Start with the least access needed, keep consequential actions reviewable, and require the same quality and security gates used for human-authored changes.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Repository orientation

- [ ] **Baseline requirement:** Provide a current README that explains the project's purpose, major directories, prerequisites, supported setup, common workflows, and where detailed guidance lives.
- [ ] **Baseline requirement:** Keep a concise root `AGENTS.md` with repository-specific layout, commands, conventions, constraints, review expectations, and definition of done.
- [ ] **Conditional requirement:** Add nested `AGENTS.md` or `AGENTS.override.md` instructions only where a subtree genuinely needs different commands or rules, and verify closer guidance does not conflict unintentionally.
- [ ] **Baseline requirement:** Document architecture, data flows, generated files, external services, environment differences, and ownership at the level needed to avoid unsafe inference.
- [ ] **Baseline requirement:** Identify files or systems that must not be changed, generated outputs that must not be edited directly, and actions that require explicit approval.

## Reproducible setup and commands

- [ ] **Baseline requirement:** Document exact, noninteractive commands for dependency installation, development, build, formatting, linting, type checks, tests, security checks, and documentation validation.
- [ ] **Baseline requirement:** Verify the documented setup and validation commands work from a clean clone or equivalent clean environment with supported tool versions.
- [ ] **Baseline requirement:** Commit supported manifests, lockfiles, tool configuration, example environment files, and deterministic scripts required to reproduce checks.
- [ ] **Baseline requirement:** Make command failures actionable and keep routine validation bounded enough to run during normal agent work; document focused and complete test commands.
- [ ] **Conditional requirement:** Provide safe fixtures, seeds, mocks, local services, or disposable test accounts for workflows that otherwise require private data or live-system access.

## Scope, safety, and permissions

- [ ] **Baseline requirement:** Keep real secrets, credentials, personal data, production exports, private endpoints, and privileged configuration out of the repository and example prompts.
- [ ] **Baseline requirement:** Define safe handling for migrations, generated code, dependency changes, destructive commands, external messages, deployments, production data, and other consequential actions.
- [ ] **Baseline requirement:** Ensure default local tests and scripts cannot write to production services, send real communications, incur uncontrolled cost, or mutate shared environments.
- [ ] **Baseline requirement:** Use repository and agent permissions that limit filesystem, network, credential, and deployment access to the task; broaden access only for a demonstrated need.
- [ ] **Conditional requirement:** Document required MCP servers, connectors, plugins, environment variables, or repository `.codex/config.toml` settings when the workflow truly depends on them, including a safe unavailable-tool fallback.

## Change and review workflow

- [ ] **Baseline requirement:** Document branch, commit, pull-request, review, generated-file, dependency, migration, and release expectations, including how to preserve unrelated user changes.
- [ ] **Baseline requirement:** Define what evidence accompanies a change: commands run, results, screenshots or traces when relevant, risks, limitations, migrations, rollback, and unresolved findings.
- [ ] **Baseline requirement:** Keep formatting and mechanical rules enforceable through repository tools rather than asking an agent to reproduce them from prose.
- [ ] **Baseline requirement:** Provide representative tests around critical behavior and prefer stable user-visible, API, or contract assertions over fragile implementation details.
- [ ] **Conditional requirement:** Put repository-wide and subtree-specific code-review rules in the applicable `AGENTS.md` when Codex review should enforce them consistently.

## Agent trial

- [ ] **Baseline requirement:** Give a fresh agent a small representative task using only repository instructions and record setup failures, unanswered questions, unsafe assumptions, and missing validation.
- [ ] **Baseline requirement:** Give a fresh agent a review-only task and verify it can locate the intended standards, distinguish findings from suggestions, and cite repository evidence.
- [ ] **Baseline requirement:** Verify the agent reports checks it did not run, missing access, incomplete context, and residual risk instead of implying completion.
- [ ] **Baseline requirement:** Review the resulting diff and evidence as rigorously as human-authored work and add durable instructions only for repeated, material friction.
- [ ] **Recommended:** Convert stable repeated workflows into focused skills or scripts while keeping project-specific facts and commands in the repository.

## References

- [Codex best practices](https://learn.chatgpt.com/guides/best-practices)
- [Codex custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [AGENTS.md open format](https://agents.md/)

Last verified against official documentation: 2026-07-25.
