# Agent-ready repository checklist

## Purpose

Use this checklist to confirm that Codex or another coding agent can understand, change, test, and hand off work without relying on undocumented knowledge or unsafe assumptions.

## Repository guidance

- [ ] Keep a useful README and a short root `AGENTS.md`.
- [ ] Add more specific agent instructions only where a folder genuinely needs different rules.
- [ ] Document the architecture, external services, environment differences, ownership, and sensitive areas.

## Reproducible work

- [ ] Document and test the commands for setting up, running, building, and checking the project.
- [ ] Commit the manifests, lockfiles, tool configuration, and example environment files needed to reproduce the work.
- [ ] Provide focused checks, a complete validation command, and safe test data when needed.

## Safety

- [ ] Keep secrets, credentials, personal data, production exports, and private endpoints out of the repository.
- [ ] Explain how to handle risky changes and confirm normal tests cannot affect production.
- [ ] Give agents only the filesystem, network, credential, and deployment access needed for the task.
- [ ] Document required tools or connectors and what to do when they are unavailable.

## Change and review

- [ ] Document the change workflow and the evidence that should accompany a change.
- [ ] Enforce formatting and mechanical rules with repository tools.
- [ ] Keep representative tests around critical behavior.
- [ ] Put repository-specific code-review rules in the applicable `AGENTS.md`.

## Try it

- [ ] Give a fresh agent a small change and a review-only task using only repository instructions.
- [ ] Confirm the agent reports limitations and review its work with the same care as human work.
- [ ] **Recommended:** Turn stable, repeated workflows into focused skills or scripts.

## References

- [Codex best practices](https://learn.chatgpt.com/guides/best-practices)
- [Codex custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [AGENTS.md open format](https://agents.md/)

Last verified against official documentation: 2026-07-28.
