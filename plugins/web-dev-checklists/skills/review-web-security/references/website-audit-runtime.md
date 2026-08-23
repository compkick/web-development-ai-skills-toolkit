<!-- Generated from plugins/web-dev-checklists/shared/website-audit-runtime.md by scripts/sync-skill-references.mjs. Do not edit this copy. -->

# Website audit runtime

## Purpose

Use the plugin-owned audit runtime to collect repeatable browser, Lighthouse, screenshot, console-error, automated accessibility, and public security evidence from an authorized website without adding dependencies to the website project.

## Requirements

- Node.js 22 or newer and npm must be available to Codex.
- The approved bootstrap must be able to download Playwright Chromium, or Chrome or Edge must already be available.
- Codex must be able to reach the target URL.
- The user must authorize the target and any dependency or browser download.

## Install the runtime

The audit command does not install anything automatically. If the runtime is missing, get permission and run this command from the plugin root:

```bash
node runtime/scripts/bootstrap.mjs
```

The bootstrap installs the pinned dependencies and matching Playwright Chromium build into the user's cache. The browser download is sizeable, but later runtime versions can reuse compatible browser files from the shared cache. It does not change the website project. If an organization does not permit the browser download, reuse an installed Chrome or Edge browser instead:

```bash
node runtime/scripts/bootstrap.mjs --skip-browser-download
```

Set `WEB_DEV_CHECKLISTS_CACHE` when an organization requires a different cache location.

## Run an audit

Run the raw collector:

```bash
node runtime/scripts/audit.mjs --url https://site.example
```

By default, the raw collector creates `.output/runtime-audit/<host>/<run-id>/` under the current working directory. Pass `--output <new-or-empty-directory>` to override the location.

Automatic selection prefers the downloaded Playwright Chromium build and falls back to Chrome or Edge when a browser fails to launch. Use `--browser chrome`, `--browser edge`, or `--browser chromium` only when automatic selection is unsuitable. Use `--skip-accessibility` or `--skip-lighthouse` when the current review does not need that evidence.

The runner navigates to the supplied URL without signing in, clicking controls, submitting forms, creating content, or modifying the target website. The page and Lighthouse can reload the URL, request page subresources and third-party services, generate traffic, and affect analytics. Prefer a staging environment when representative results do not require production.

## Run a deterministic review profile

Use the profile runner when a skill needs normalized, repeatable evidence rather than only raw collector output:

```bash
node runtime/scripts/review.mjs --profile review-web-accessibility --url https://site.example
node runtime/scripts/review.mjs --profile review-web-security --url https://site.example
```

By default, the runner creates `.output/<profile>/<host>/<run-id>/` under the current working directory. Use `--output <directory>` to choose another new or empty directory. The procedure, browser configuration, profile version, check identifiers, and JSON shape are controlled, but live website content, network conditions, and Lighthouse measurements can still vary between runs.

Each profile maps every item in its canonical checklist to automated, partial, or manual coverage. A machine `pass` proves only the named automated check; it does not prove that the corresponding human checklist item or the whole website passes.

The security profile loads the supplied page and its normal subresources. When the supplied URL uses HTTPS, it also makes one bounded plain-HTTP redirect probe on the same hostname and requests `/.well-known/security.txt` on the same HTTPS origin. It does not submit forms, enumerate endpoints, send attack payloads, scan ports, sign in, or exploit vulnerabilities. The profile skips axe and Lighthouse because they do not add evidence to this focused public security baseline.

## Browser sandbox

Chromium sandboxing is enabled by default. The runtime refuses to run as root because root Chromium commonly requires disabling that sandbox.

Run as a non-root user whenever possible. Use `--allow-no-sandbox` only after explicit approval and only inside an isolated disposable environment whose other controls provide the required protection.

## Sensitive artifacts

The summary records console-error and page-error counts without their message text. If the details are necessary, get permission and add `--include-error-details`; the runtime then writes up to 20 truncated messages of each type to `browser-errors.json`.

Screenshots, Lighthouse reports, URLs, and optional browser-error details can contain rendered content, personal data, query strings, private endpoints, or secrets exposed by the page. Store and share audit artifacts accordingly.

## Outputs

- `summary.json` contains the page result, browser used, Lighthouse scores, and automated accessibility counts.
- `page.png` is a full-page screenshot of the rendered page.
- `axe-results.json` contains reduced axe findings without copied HTML snippets.
- `lighthouse-report.json` and `lighthouse-report.html` contain the Lighthouse results.
- `browser-errors.json` is created only when `--include-error-details` is explicitly requested.
- `security-results.json` contains reduced transport, selected response-header, public-cookie-attribute, disclosure, redirect, and `security.txt` observations when security collection is enabled. Cookie values are not stored.
- `evidence.json` is created by the deterministic profile runner and contains normalized machine observations with stable check identifiers.
- `coverage.json` is created by the deterministic profile runner and shows which canonical checklist items remain partial or manual.

Treat Lighthouse accessibility results and axe findings as automated evidence only. Manual accessibility review is still required. Treat security headers, cookie attributes, and the negotiated TLS connection as bounded configuration observations rather than proof that the application is secure. A single-URL audit does not prove that every template, route, state, breakpoint, authenticated journey, source-code control, or operational control works.

## References

- [Playwright browser installation](https://playwright.dev/docs/browsers)
- [Playwright Docker and sandbox guidance](https://playwright.dev/docs/docker)
- [Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview)
- [Codex Browser](https://learn.chatgpt.com/docs/browser)

Last verified against official documentation: 2026-08-21.
