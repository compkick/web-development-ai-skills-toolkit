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
| Ubuntu with Node.js 24 | Passed `repo:check` on the validation job's `ubuntu-latest` runner | Ubuntu 22.04 bootstrap, Chromium, runtime/screenshot tests, and all six review-profile suites passed | Tested in CI; rerun against the final release candidate |
| Current macOS | Not tested | Not tested | Unverified; not a release gate |

The runtime prefers its matching Playwright Chromium build. Chrome and Edge are launch-tested fallbacks, not a promise that every browser version or managed-device policy will work.

## Recorded validation

- GitHub Actions run `34416716606` passed repository validation and browser fixtures for commit `10f02be`, which was tagged `v0.1.2` at the time. That tag was later deleted during the privacy cleanup.
- GitHub Actions run `35559645407` passed both jobs for commit `bbad993`, including the Node.js minimum correction. GitHub records this run on 2026-09-21 UTC (2026-09-20 in the maintainer's local timezone).
- Windows 11 x64 with Node.js 24.19.0 passed `repo:check`, runtime/screenshot tests, and all six profile suites for the Node-minimum changes on 2026-09-20. This run used an isolated dependency cache and installed Google Chrome; earlier Windows testing also covered Playwright Chromium.
- Official plugin and six skill validators passed locally on 2026-09-20. See [the validator record](../CONTRIBUTING.md#official-validator-record).

External-link CI is informational: a green job does not prove that every public URL is reachable. Recheck anonymous repository and download access after publication. These results do not establish a fresh installation of the final distributable or Claude Code/Bionic compatibility.

## Release testing

Before a public release:

- Run `npm run repo:check` on Windows and through the Ubuntu GitHub Actions job.
- Run `npm run runtime:test` and `npm run reviews:test` on Windows.
- Record at least one runtime and review-runner test on Ubuntu or another supported Linux environment.
- Record a macOS result before describing macOS as fully tested.
- Test plugin installation and explicit skill invocation in a new Codex task.

Record the operating system, architecture, Node.js version, browser source, plugin version, and result. Treat an untested platform as unverified rather than failed.
