# Playwright testing

Use Playwright for a small set of browser-level tests that protect important user journeys and integration points. Do not reproduce every unit test or turn every page variation into an end-to-end test.

## Setup

- Install the current Node.js LTS release unless the project documents a different supported release, then confirm it with `node --version`.
- From the project repository, initialize Playwright with the project's package manager (`npm init playwright@latest` for npm), then review and commit the generated configuration, example test, dependency manifest, and lockfile changes.
- Choose TypeScript unless the project intentionally uses JavaScript only.
- Install the browser projects required by the project's support policy rather than every available browser by habit.
- Run tests against an isolated test environment or controlled local application. Do not run destructive tests against production.

## Project structure

- Keep tests in `tests/` or another single documented test root.
- Keep reusable fixtures and setup in `tests/fixtures/`, and simple shared utilities in `tests/helpers/`.
- Store authentication state in a gitignored directory such as `tests/.auth/`. Treat saved browser state as sensitive because it may contain cookies or headers that grant access.
- Supply credentials and environment values through local environment configuration and the CI secret store, never the repository.
- Group tests by user journey or product area so failures point to behavior the team recognizes.

## Baseline test coverage

Start with the smallest test set that can detect a broken release:

- Smoke
  - The home page or primary application entry point loads successfully.
  - Shared layout elements render and primary navigation works.
  - Site search returns useful results when search is enabled.
- Content
  - Representative high-priority pages and each material template render expected content.
  - Page titles and canonical URLs are present where the site requires them.
  - Error pages and important empty or unavailable states behave as intended.
- Forms and critical transactions
  - The primary happy path completes and produces the expected result.
  - Required-field and meaningful server-error states are understandable and preserve valid input where appropriate.
  - Uploads, payments, or other high-risk steps work when applicable, using safe test data and environments.
- Authentication and authorization
  - Valid users can sign in and invalid credentials are rejected without exposing sensitive details.
  - Protected functions reject unauthenticated users and users without the required role.
  - Sign-out, session expiry, or account recovery is covered when its failure would create material risk.
- CMS or administration
  - An authorized administrator or editor can sign in.
  - A representative content item can be created or edited, saved as a draft, published, and viewed.
  - Role restrictions prevent a lower-privileged user from performing a protected action.
- Regression and integration
  - Critical integrations or publishing workflows are covered when lower-level tests cannot provide enough confidence.
  - A regression test is added when recurrence of a defect would be costly and the test can remain stable.

Choose browser and device projects from the product's support policy and real usage, not from a desire to test every possible combination. Do not automate third-party sites you do not control; mock or isolate the boundary and test your own integration behavior.

## Write stable tests

- Test user-visible behavior rather than CSS classes, DOM structure, or internal implementation details.
- Keep tests independent. Each test must establish or receive the state and data it needs and must be able to run alone.
- Prefer locators based on roles, accessible names, labels, text, or explicit test IDs. Use brittle CSS or XPath selectors only when no stable contract exists.
- Use Playwright's web-first assertions and automatic waiting. Do not add fixed sleeps to make a race condition appear stable.
- Control test data and clean up state that could affect later runs. Use unique data when tests may run in parallel.
- Keep assertions focused on the behavior being protected so unrelated content changes do not create noise.
- Treat retries as diagnostic evidence, not a way to declare an unreliable test healthy.

## Example commands

```bash
# Install locked project dependencies and required browsers
npm ci
npx playwright install --with-deps

# Run all tests
npx playwright test

# Open the UI runner
npx playwright test --ui

# Run or debug one test file
npx playwright test tests/smoke.spec.ts
npx playwright test tests/smoke.spec.ts --debug

# Open the HTML report
npx playwright show-report
```

## CI and evidence

- Run the high-value suite on pull requests and before release. Add broader scheduled coverage only when it finds risks worth the runtime and maintenance cost.
- Use Playwright's default headless mode in CI. Use headed execution only when the environment and test purpose require it.
- Start with one worker in CI for reproducibility. Use parallelism or sharding after tests and infrastructure are proven isolated.
- Record traces on the first retry rather than on every test, and retain the HTML report and failure artifacts long enough for the team to investigate.
- Cache the package manager's download store when it materially improves CI time. Do not cache Playwright browser binaries by default; installation is often comparable to cache restoration and Linux system dependencies still need installation.
- Fail the required check for a real test failure. Quarantine a demonstrably flaky test only with an owner and follow-up issue; do not silently skip it.
- Keep the Playwright package, browser binaries, and lockfile in sync when updating.

## Readiness check

- [ ] The suite covers the release's critical user journeys and known high-risk boundaries.
- [ ] Tests pass independently and use controlled, non-production data.
- [ ] Locators and assertions describe user-visible behavior and do not rely on arbitrary waits.
- [ ] The configured browser projects match the documented support policy.
- [ ] CI installs from the lockfile, runs the required suite, and blocks merging on genuine failures.
- [ ] Reports and traces provide enough evidence to reproduce and diagnose failures.
- [ ] Skipped or flaky tests have a documented reason, owner, and follow-up decision.

## References

- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [Playwright continuous integration](https://playwright.dev/docs/ci)
- [Playwright trace viewer](https://playwright.dev/docs/trace-viewer-intro)
