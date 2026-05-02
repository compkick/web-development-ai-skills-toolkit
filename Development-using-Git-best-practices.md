# Development using Git

Using Git with a distributed development team requires a defined workflow and adherence to best practices. Following documented workflows and best practices will ensure smooth collaboration and maintain a clean codebase. The following section explains the Git workflow and branching strategy as it relates to general website development. Adapt these strategies and practices for other project types.

## Branching strategy

- Main branch (main):
  - The main branch should always contain stable and production-ready code
  - Only merge changes into main from the develop branch after thorough testing and code reviews
  - Prefer pull requests (PRs), with rulesets and approvals, to update the main branch
- Development Branch (develop):
  - The develop branch is used for development and integration
  - Feature branches should merge/PR to develop branch
  - Regularly merge feature branches into develop to keep it up-to-date
  - If a feature branch runs long, regularly rebase onto develop so you keep your changes and pick up the latest upstream updates
- Feature / Fix / Hotfix Branches:
  - Feature branches
    - Used for developing new features. Branch from develop and merge back into develop when complete
    - Example: git checkout develop  
       git checkout -b feature/feature-name
  - Fix Branches
    - Used for bug fixes. Branch from develop and merge back into develop when complete
    - Example: git checkout develop  
       git checkout -b fix/bug-description
- Hotfix Branches
  - Used for urgent fixes on the main branch. Branch from main and merge back into main and develop when complete
    - Example: git checkout main  
       git checkout -b hotfix/issue-description

## Best practices

- Consistent Branch Naming:
  - Use a consistent naming convention for branches (e.g., feature/, fix/, hotfix/)
  - Examples: feature/user-authentication, fix/login-bug, hotfix/security-patch
- Regular Commits and Pull Requests:
  - Commit changes frequently with descriptive commit messages
  - Separate distinct changes into separate commits. Don’t include multiple unrelated changes in single commit
  - Create pull requests (PRs) for all changes and require code reviews before merging
- Code Reviews and Approvals:
  - Implement a code review process to ensure code quality
  - Use tools like Azure DevOps, Bitbucket or GitHub for PRs and code reviews
  - Require at least one or two approvals before merging a PR
- Rebasing and Merging:
  - Ensure feature/fix/hotfix branches are up-to-date with the target branch before starting work
  - For feature/fix/hotfix branches, prefer rebasing over merging to keep the feature branches up-to-date with develop
  - To keep a clean commit history, git rebase will apply changes from one branch onto another, avoiding the creation of a merge commit
  - Example: git checkout feature/feature-name
    git pull --rebase origin develop
  - Preserve history on important branches (develop and main). Use git merge command, rather than rebase
- Handling Conflicts:
  - Address merge conflicts as soon as they arise
  - Communicate with team members to resolve conflicts collaboratively
