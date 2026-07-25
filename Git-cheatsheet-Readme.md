# Git cheatsheet

Common commands for a branch-and-pull-request workflow. Replace values in angle brackets and confirm your current branch with `git status -sb` before any command that changes history or discards work.

Use a repository-level `.gitattributes` file for consistent line-ending behavior. Do not copy a global `core.autocrlf` setting without considering the operating systems and file types used by the project.

| Task | Command | What it does |
| --- | --- | --- |
| Configure identity | `git config --global user.name "Your Name"` | Set the author name for new commits |
| Configure identity | `git config --global user.email "you@example.com"` | Set the author email for new commits |
| Configure defaults | `git config --global init.defaultBranch main` | Set the default branch name for new repositories |
| Create a repository | `git init` | Initialize a repository in the current directory |
| Get a repository | `git clone <url>` | Clone a remote repository |
| Inspect | `git status -sb` | Show the branch and concise working-tree status |
| Inspect | `git diff` | Review unstaged changes |
| Inspect | `git diff --staged` | Review exactly what will be committed |
| Inspect | `git log --oneline --graph --decorate --all` | Show a compact history graph |
| Inspect | `git show <commit>` | Show a commit and its changes |
| Synchronize | `git fetch --prune origin` | Update remote-tracking branches and remove stale ones |
| Synchronize | `git pull --ff-only` | Update the current branch only when no merge commit is needed |
| Branch | `git branch` | List local branches |
| Branch | `git branch -a` | List local and remote-tracking branches |
| Branch | `git switch <branch>` | Switch to an existing branch |
| Branch | `git switch -c <type>/<short-name>` | Create and switch to a topic branch |
| Branch | `git push -u origin <branch>` | Publish a branch and set its upstream |
| Branch | `git branch -d <branch>` | Delete a fully merged local branch |
| Stage | `git add <file>` | Stage a specific file |
| Stage | `git add -p` | Review and stage selected portions of changes |
| Stage | `git add -A` | Stage all changes only after reviewing the working-tree status |
| Stage | `git restore --staged <file>` | Unstage a file without discarding its changes |
| Commit | `git commit -m "<message>"` | Commit the staged changes |
| Commit | `git commit --amend` | Replace the latest local commit; avoid after others use it |
| Merge | `git merge <branch>` | Merge the named branch into the current branch |
| Merge | `git merge --abort` | Return to the state before a conflicted merge |
| Rebase | `git rebase origin/<target>` | Replay the current topic branch on the updated target |
| Rebase | `git rebase --continue` | Continue after resolving and staging rebase conflicts |
| Rebase | `git rebase --abort` | Return to the state before the rebase |
| Push | `git push` | Push commits to the configured upstream |
| Push after rebase | `git push --force-with-lease` | Replace a published topic-branch history only if the remote has not unexpectedly changed |
| Undo shared change | `git revert <commit>` | Create a new commit that reverses an earlier commit |
| Discard file changes | `git restore <file>` | Discard unstaged changes in one tracked file |
| Recover | `git reflog` | Find recent local branch and `HEAD` positions |
| Investigate | `git blame <file>` | Show the commit and author associated with each line |
| Stash | `git stash push -u -m "<description>"` | Temporarily save tracked and untracked changes |
| Stash | `git stash list` | List saved stashes |
| Stash | `git stash pop` | Reapply and remove the latest stash |
| Tags | `git tag` | List local tags |
| Tag release | `git tag -a <version> -m "<message>"` | Create an annotated tag |
| Publish tag | `git push origin <version>` | Push one tag to the remote |

## Commands requiring extra care

- `git add -A` stages modifications, deletions, and untracked files throughout the repository. Review `git status` before staging and `git diff --staged` before committing.
- `git push --force-with-lease` rewrites the remote branch. Use it only for your own topic branch after confirming nobody else has added work.
- `git restore <file>` permanently discards unstaged changes in that file.
- `git reset --hard <commit>` discards tracked working-tree changes and moves the current branch. It is intentionally omitted from the main table because safer commands usually exist.
- If a command produces an unexpected conflict or history, stop and inspect `git status`, `git log`, and `git reflog` before trying another corrective command.

## Reference

- [Official Git documentation](https://git-scm.com/docs)
