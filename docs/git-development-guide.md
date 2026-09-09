# Development using Git

## Purpose

Use a documented Git workflow that matches the project's release process. The goal is safe collaboration and reviewable changes, not a complicated branch model.

## Choose the workflow intentionally

- Use a lightweight workflow when changes can move from short-lived topic branches directly into a protected production branch.
- Use an integration branch such as `develop` when the team needs to combine and test multiple changes before promoting a release to `main`.
- Do not add permanent branches unless they represent a real release, support, or environment need.
- Document the target branch, merge method, release path, and hotfix path in the repository.

## Branching strategy

This repository uses an integration-branch workflow: ordinary changes merge into `develop`, and tested releases merge from `develop` into `main`. The `main` branch represents stable, releasable production code.

## Standard change workflow

1. Start from the current target branch and create a short-lived branch with a descriptive name such as `feature/user-authentication`, `fix/login-error`, or `docs/git-guidance`.
2. Keep the change focused. Commit coherent progress regularly with descriptive messages, separate unrelated work, and never commit credentials, tokens, private keys, production data, or local environment files.
3. Run the checks relevant to the change before opening a pull request. Include tests when behavior changes.
4. Update the topic branch using the project's agreed merge or rebase policy. Rebase only branches whose history is safe to rewrite.
5. Open a pull request that explains the purpose, risk, validation performed, and any deployment or rollback considerations.
6. Obtain the required review and passing CI results. Resolve or acknowledge review comments before merging.
7. Merge using the repository's selected merge method and delete the topic branch after it is no longer needed.

Small pull requests are usually easier to review and safer to deploy, but do not split a coherent change merely to meet an arbitrary size target.

## Repository safeguards

- Protect `main` and any shared integration or release branches from direct pushes, deletion, and force pushes.
- Require pull requests and the CI checks that provide meaningful release confidence. Avoid required checks that are noisy, redundant, or routinely bypassed.
- Require review by someone other than the author for security-sensitive, production, permission, dependency, infrastructure, or data-handling changes.
- Limit administrator and bypass access. Use code owners when specific files require review from a responsible team.
- Enable secret and dependency detection appropriate to the hosting platform, and investigate alerts rather than treating the tools as a substitute for review.

## History and conflict safety

- Do not rebase or amend commits on a protected branch or a shared branch that other work uses as a base.
- After rebasing your own published topic branch, use `git push --force-with-lease`, not `git push --force`. Confirm the branch and remote before running it.
- Review `git status`, the staged diff, and the branch name before committing or pushing.
- Address conflicts promptly by understanding both changes; do not automatically choose one side. Run affected tests after resolution.
- Coordinate with the affected contributors when a conflict overlaps their work or the correct resolution is not clear.
- Use `git rebase --abort` or `git merge --abort` when a conflict resolution is going in the wrong direction.
- Prefer `git revert` for undoing a change already shared with others. Treat `git reset --hard` and history-rewriting commands as destructive operations.
- If a secret is committed, revoke or rotate it immediately. Removing it from a later commit does not make the exposed secret safe.

## Hotfix workflow

Create an urgent production fix from the production branch, keep it narrowly scoped, and use an expedited pull request rather than bypassing review and CI without a documented emergency reason. After release, ensure the fix also reaches every active integration or release branch so it is not lost in the next deployment.

## References

- [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow)
- [GitHub rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Available rules for GitHub rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Git rebase documentation](https://git-scm.com/docs/git-rebase)
- [Git push documentation](https://git-scm.com/docs/git-push)

Last verified against official documentation: 2026-07-24.
