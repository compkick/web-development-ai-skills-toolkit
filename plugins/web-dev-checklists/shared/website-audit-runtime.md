# Website audit runtime

## Purpose

Use the plugin-owned audit runtime to collect repeatable browser, Lighthouse, screenshot, console-error, automated accessibility, and public security evidence from an authorized website without adding dependencies to the website project.

## Requirements

- Node.js 22 or newer and npm must be available to Codex.
- The approved bootstrap must be able to download Playwright Chromium, or Chrome or Edge must already be available.
- Codex must be able to reach the target URL.
- The user must authorize the target and any dependency or browser download.

## Install the runtime

The audit command does not install anything automatically. Before requesting installation permission, check the versioned user cache from the plugin root:

```bash
node runtime/scripts/status.mjs --json
```

This command is read-only and prints the resolved runtime and browser-cache paths. If it reports `"ready": true`, do not run bootstrap; run the audit or review profile directly. Do not infer readiness by looking for `runtime/node_modules` under the plugin because dependencies are deliberately stored outside the plugin and target project.

If status reports that the current runtime is not ready, get permission and run this command from the plugin root:

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

Each profile maps every item in its canonical checklist to automated, partially automated, or manual coverage. A machine `pass` proves only the named automated check; it does not prove that the corresponding human checklist item or the whole website passes.

The security profile loads the supplied page and its normal subresources. When the rendered page uses HTTPS, it also makes five bounded TLS handshakes to the same hostname and port: one normal negotiation plus one attempt each for TLS 1.3, TLS 1.2, TLS 1.1, and TLS 1.0. These handshakes record the normally negotiated cipher and ephemeral key, check modern protocol support, and check rejection of deprecated protocols without enumerating every cipher suite or sending an HTTP request. The profile also makes one bounded plain-HTTP redirect probe on the supplied hostname and requests `/.well-known/security.txt` on the same HTTPS origin. It does not submit forms, enumerate endpoints, send attack payloads, scan ports, sign in, or exploit vulnerabilities. The profile skips axe and Lighthouse because they do not add evidence to this focused public security baseline.

## Browser sandbox

Chromium sandboxing is enabled by default. The runtime refuses to run as root because root Chromium commonly requires disabling that sandbox.

Run as a non-root user whenever possible. Use `--allow-no-sandbox` only after explicit approval and only inside an isolated disposable environment whose other controls provide the required protection.

## Sensitive artifacts

The summary records console-error and page-error counts without their message text. If the details are necessary, get permission and add `--include-error-details`; the runtime then writes up to 20 truncated messages of each type to `browser-errors.json`.

Screenshots, including axe element screenshots, Lighthouse reports, URLs, and optional browser-error details can contain rendered content, personal data, query strings, private endpoints, or secrets exposed by the page. Store and share audit artifacts accordingly.

## Outputs

- `summary.json` contains the page result, browser used, Lighthouse scores, and automated accessibility counts.
- `page.png` is a full-page screenshot of the rendered page.
- `axe-results.json` contains reduced axe findings without copied HTML snippets.
- `axe-report.html` presents confirmed violations and incomplete checks in a human-readable format and links to bounded screenshots under `axe-elements/`.
- `lighthouse-report.json` and `lighthouse-report.html` contain the Lighthouse results.
- `browser-errors.json` is created only when `--include-error-details` is explicitly requested.
- `security-results.json` contains reduced TLS, transport, selected response-header, public-cookie-attribute, disclosure, redirect, and `security.txt` observations when security collection is enabled. Cookie values are not stored.
- `evidence.json` is created by the deterministic profile runner and contains normalized machine observations with stable check identifiers.
- `coverage.json` is created by the deterministic profile runner and shows which canonical checklist items remain partially automated or manual.
- `security-report.html` is created by the security profile and presents normalized pass, fail, warning, informational, and not-checked results with checklist coverage and limitations.

The runtime prioritizes confirmed violations and then incomplete checks for element screenshots, with a default limit of 50 candidates per page. The report records elements that were skipped by the limit, could not be found after the scan, used unsupported nested targets, or failed during capture.

Treat Lighthouse accessibility results and axe findings as automated evidence only. Manual accessibility review is still required. Treat security headers, cookie attributes, and the bounded TLS checks as configuration observations rather than proof that the application is secure. The TLS baseline does not enumerate every accepted cipher suite, test server cipher preference, or replace a specialized TLS scanner. A single-URL audit does not prove that every template, route, state, breakpoint, authenticated journey, source-code control, or operational control works.

## References

- [Playwright browser installation](https://playwright.dev/docs/browsers)
- [Playwright Docker and sandbox guidance](https://playwright.dev/docs/docker)
- [Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview)
- [Codex Browser](https://learn.chatgpt.com/docs/browser)
- [Node.js TLS](https://nodejs.org/api/tls.html)
- [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)
- [RFC 9325 Recommendations for Secure Use of TLS](https://www.rfc-editor.org/rfc/rfc9325.html)

Last verified against official documentation: 2026-08-22.
