# Website audit runtime

## Purpose

Use the plugin-owned audit runtime to collect repeatable browser, Lighthouse, screenshot, console-error, and automated accessibility evidence from an authorized website without adding dependencies to the website project.

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

Choose a new or empty output directory and run:

```bash
node runtime/scripts/audit.mjs --url https://site.example --output ./website-audit
```

Automatic selection prefers the downloaded Playwright Chromium build and falls back to Chrome or Edge when a browser fails to launch. Use `--browser chrome`, `--browser edge`, or `--browser chromium` only when automatic selection is unsuitable. Use `--skip-accessibility` or `--skip-lighthouse` when the current review does not need that evidence.

The runner navigates to the supplied URL without signing in, clicking controls, submitting forms, creating content, or modifying the target website. The page and Lighthouse can reload the URL, request page subresources and third-party services, generate traffic, and affect analytics. Prefer a staging environment when representative results do not require production.

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

Treat Lighthouse accessibility results and axe findings as automated evidence only. Manual accessibility review is still required. A single-URL audit does not prove that every template, route, state, breakpoint, or authenticated journey works.

## References

- [Playwright browser installation](https://playwright.dev/docs/browsers)
- [Playwright Docker and sandbox guidance](https://playwright.dev/docs/docker)
- [Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview)
- [Codex Browser](https://learn.chatgpt.com/docs/browser)

Last verified against official documentation: 2026-08-19.
