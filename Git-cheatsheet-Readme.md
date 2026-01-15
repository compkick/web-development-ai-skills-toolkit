# Git cheatsheet

Common Git commands by category.

| Command category | Command | What it does |
| --- | --- | --- |
| Setup | `git config --global user.name "Your Name"` | Set your global Git display name |
| Setup | `git config --global user.email "you@example.com"` | Set your global Git email |
| Setup | `git config --global init.defaultBranch main` | Set the default branch name for new repos |
| Setup | `git config --global core.autocrlf true` | Normalize line endings on Windows |
| Setup | `git init` | Initialize a new Git repo in the current folder |
| Setup | `git clone <url>` | Clone a remote repo to your machine |
| Status | `git status` | Show working tree status |
| Status | `git status -sb` | Show short status and branch |
| Status | `git diff` | Show unstaged changes |
| Status | `git diff --staged` | Show staged changes |
| Branching | `git branch` | List local branches |
| Branching | `git branch -a` | List local and remote branches |
| Branching | `git checkout -b feature/my-branch` | Create and switch to a new branch |
| Branching | `git switch -c feature/my-branch` | Create and switch to a new branch (newer syntax) |
| Branching | `git switch develop` | Switch branches |
| Branching | `git branch -d feature/my-branch` | Delete a local branch |
| Branching | `git push -u origin feature/my-branch` | Push branch and set upstream |
| Add/Commit | `git add .` | Stage all changes |
| Add/Commit | `git add <file>` | Stage a specific file |
| Add/Commit | `git commit -m "message"` | Commit staged changes |
| Add/Commit | `git commit --amend` | Amend last commit (avoid after push) |
| Add/Commit | `git restore --staged <file>` | Unstage a file |
| Pull/Fetch | `git fetch` | Update remote tracking branches |
| Pull/Fetch | `git pull` | Fetch and merge from upstream |
| Pull/Fetch | `git pull --rebase` | Fetch and rebase onto upstream |
| Push | `git push` | Push commits to upstream |
| Merge/Rebase | `git merge develop` | Merge a branch into current branch |
| Merge/Rebase | `git rebase develop` | Rebase current branch onto develop |
| Undo | `git restore <file>` | Discard unstaged changes in a file |
| Undo | `git reset <file>` | Unstage a file (keep changes) |
| Undo | `git reset --hard <commit>` | Reset working tree to a commit (destructive) |
| Inspect | `git log --oneline --graph --decorate --all` | Compact commit history graph |
| Inspect | `git show <commit>` | Show a specific commit |
| Inspect | `git blame <file>` | Show line-by-line history |
| Stash | `git stash` | Save uncommitted changes |
| Stash | `git stash pop` | Reapply and drop the last stash |
| Tags | `git tag` | List tags |
| Tags | `git tag -a v1.0.0 -m "release"` | Create an annotated tag |
| Tags | `git push origin v1.0.0` | Push a tag to origin |
