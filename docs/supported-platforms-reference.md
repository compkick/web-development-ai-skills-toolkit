# Supported platforms reference

## Purpose

Use this reference to understand which environments are directly exercised and where additional testing is still needed before the first public release.

## Runtime requirements

- Node.js 22.19.0 or newer
- npm
- Playwright Chromium downloaded by the approved runtime bootstrap, or a compatible installed Chrome or Edge browser
- Network access to any authorized website being reviewed

Contributors who run the official skill and plugin validators also need Python 3.8 or newer and the pinned PyYAML dependency from `requirements-dev.txt`.

## Platform matrix

| Platform | Repository checks | Browser review runtime | Current status |
| --- | --- | --- | --- |
| Windows 11 x64 with PowerShell | Tested | Tested with Playwright Chromium against local fixtures and real websites | Primary supported development environment |
| Ubuntu with Node.js 24 | Current candidate passed Markdown lint and internal links; private repository URLs blocked external links and later checks | Ubuntu 22.04 bootstrap, Chromium, runtime/screenshot tests, and all six review-profile suites passed in Actions run `34392195263` on 2026-09-09 | Browser runtime tested; full release-candidate validation remains a Phase 6 gate |
| Current macOS | Not tested | Not tested | Unverified; not a release gate |

The runtime prefers its matching Playwright Chromium build. Chrome and Edge are launch-tested fallbacks, not a promise that every browser version or managed-device policy will work.

## Release testing

Before a public release:

- Run `npm run repo:check` on Windows and through the Ubuntu GitHub Actions job.
- Run `npm run runtime:test` and `npm run reviews:test` on Windows.
- Record at least one runtime and review-runner test on Ubuntu or another supported Linux environment.
- Record a macOS result before describing macOS as fully tested.
- Test plugin installation and explicit skill invocation in a new Codex task.

Record the operating system, architecture, Node.js version, browser source, plugin version, and result. Treat an untested platform as unverified rather than failed.
