# Playwright testing

Minimal Playwright guidance for this repo. Use as a baseline and customize per project.

## Setup

- Install Node.js LTS
- Initialize Playwright in your project repo
  - `npm init playwright@latest`
- Choose TypeScript unless the project is strict JavaScript only

## Project structure

- Keep tests in `tests/`
- Keep shared helpers in `tests/helpers/`
- Store auth state in `tests/.auth/` and ignore it in git

## Baseline test coverage

- Smoke
  - Home page loads
  - Header and footer render
  - Primary navigation works
  - Site search returns results (if enabled)
- Content pages
  - Tier 1 pages render
  - Tier 2 pages render
  - Canonicals present
- Forms
  - Contact form submit happy path
  - Required field validation
  - File upload (if enabled)
- Auth (if applicable)
  - Login success
  - Login failure
- CMS/admin (if applicable)
  - Admin login
  - Create content draft
  - Publish and view

## Example commands

```bash
# run all tests
npx playwright test

# open the UI runner
npx playwright test --ui

# run a single test file
npx playwright test tests/smoke.spec.ts

# generate a report
npx playwright show-report
```

## CI notes

- Use headless mode in CI
- Cache `~/.npm` and Playwright browsers
- Record trace on failure for faster debugging
