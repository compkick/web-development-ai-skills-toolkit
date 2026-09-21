# Web Development AI Skills Toolkit publishing kit

## Purpose

Copy-ready descriptions and artwork for the project's WordPress page, LinkedIn announcement, and future plugin listing. Keep technical setup details authoritative in the [README](README.md) and [runtime guide](docs/website-audit-runtime-guide.md).

## Name and positioning

- Full project name: **Web Development AI Skills Toolkit**
- Short artwork title: **Web Dev AI Skills Toolkit**
- Tagline: **Practical checklists, automated audits, and agent skills for building better websites.**
- Author: [Computerkick](https://computerkick.com)
- Repository: [Web Development AI Skills Toolkit on GitHub](https://github.com/compkick/web-development-ai-skills-toolkit)
- Suggested WordPress slug: `web-development-ai-skills-toolkit`
- Suggested SEO title: `Web Dev AI Skills Toolkit | Computerkick`
- Suggested meta description: `Practical web development checklists, automated website audits, and six Codex agent skills for accessibility, security, performance, SEO, and launch reviews.`

Use the full project name in page copy. The shorter title on the artwork does not rename the repository, npm package, or internal `web-dev-checklists` plugin identifier.

## LinkedIn project description

I built Web Development AI Skills Toolkit to make website reviews more useful—and less of a slog.

It brings together practical developer checklists, automated website audits, and six AI agent skills for Codex. Use the checklists yourself, run a report from the command line, or ask Codex to review a site and help prioritize what needs attention.

The toolkit covers accessibility, security, performance, technical SEO, launch readiness, and overall project health. Its shared browser runtime uses Playwright, Chromium, axe, and Lighthouse to collect evidence and produce readable reports, including screenshots of accessibility findings.

The point isn't another score or an endless checklist. It's a clearer picture of what was tested, what needs fixing, and what still needs a human review.

There's also practical guidance for WordPress, Sitefinity, Git, testing, and release workflows. The generic audit tools live outside the website project, so you don't need to add Playwright to a client's application just to run a review.

Built by Computerkick. MIT licensed. Feedback from developers using it on real projects is welcome.

Explore the code and setup instructions: [Web Development AI Skills Toolkit on GitHub](https://github.com/compkick/web-development-ai-skills-toolkit).

## WordPress excerpt

Practical web development checklists, automated website audits, and six AI agent skills for Codex. Review accessibility, security, performance, technical SEO, launch readiness, and overall project health—with readable reports, screenshots, and clear next steps.

## WordPress page copy

### Description

Web Development AI Skills Toolkit helps developers review websites without starting from a blank page—or working through hundreds of tiny checklist items.

It combines human-readable checklists with automated evidence collection and AI-assisted review. Work through a checklist yourself, run a website report from the command line, or ask Codex to inspect the available evidence and recommend practical next steps.

The checklists remain the source of truth. Automation covers the checks it can actually perform, and the agent explains what still needs access, context, or a human decision.

### Target audience

Web developers, engineers, technical project leads, and small teams maintaining websites, inheriting projects, or preparing a release. General reviews work across frameworks and CMS platforms; the documentation also includes WordPress lifecycle checklists and Sitefinity maintenance guidance.

### Features

- **Six Codex review skills:** accessibility, security, performance, technical SEO, launch readiness, and a cross-discipline project audit.
- **Human-runnable reports:** run the same deterministic evidence profiles from the command line, without an AI session.
- **Readable evidence:** HTML reports, JSON results, page screenshots, and bounded screenshots of elements flagged by axe.
- **Shared browser tooling:** Playwright, Chromium, axe, and Lighthouse, with dependencies cached outside the website project.
- **Desktop audit baseline:** repeatable browser settings, with mobile, zoom, and interactive testing kept separate.
- **Practical documentation:** development and launch checklists, WordPress setup/testing/migration guidance, and engineering workflows.
- **Honest coverage:** passes, findings, warnings, and unverified checks are kept distinguishable. Launch recommendations include remaining human checks.
- **Organized output:** timestamped evidence under `.output/<profile>/<host>/<run-id>/` by default.

### Exclusions and limits

- This is not a WordPress plugin, a hosted scanning service, or an automatic website builder.
- Automated accessibility checks do not certify WCAG conformance or replace keyboard and assistive-technology testing.
- Public security checks are not a penetration test. They do not exploit vulnerabilities, enumerate every TLS cipher, or prove that the application is secure.
- A desktop Lighthouse run does not establish mobile performance, real-user Core Web Vitals, or geographic performance.
- Technical SEO checks do not guarantee indexing, rankings, or traffic.
- A public URL cannot verify backups, restore procedures, administrator access, private configuration, or every business workflow. Those checks need additional evidence.
- The deterministic launch report is a bounded preflight, not final approval. The project owner remains responsible for the launch decision.
- Live content, network conditions, scores, and agent judgments can vary even though the collection procedure is repeatable.

### Start here

Start with the [repository and setup instructions](https://github.com/compkick/web-development-ai-skills-toolkit). You can use the human checklists without installing anything.

For command-line reports, clone the repository and open a terminal in its root. Check runtime readiness and, on first use, approve and run the bootstrap:

```bash
npm run runtime:status
npm run runtime:bootstrap
```

Bootstrap downloads the pinned audit dependencies and matching Chromium into a user cache. Once ready, run a profile:

```bash
npm run review:website -- --profile review-web-accessibility --url https://site.example
```

Replace `https://site.example` with a website you are authorized to review. Open `accessibility-report.html` in the resulting `.output` directory. Other profiles create their own report files.

For Codex, install the Codex CLI and register your local repository as a marketplace:

```bash
codex plugin marketplace add "<absolute-path-to-this-repository>"
```

Open the plugin browser, select **Personal**, and install **Web Development AI Skills Toolkit**. In Codex CLI, enter `/plugins` to open that browser. Start a new task/session after installation. See the [repository installation guide](README.md#install-the-codex-plugin) and [official plugin documentation](https://learn.chatgpt.com/docs/plugins).

Try a request such as:

> Review this website's accessibility, save the evidence under .output, and give me the most important fixes first.

For a specific skill, use `$review-web-accessibility` in your request. The other five skill names and CLI profiles are listed in the README.

First-use approvals may cover downloads, browser execution, network access, and evidence files. Choose the permission mode you understand and are comfortable with; full access is not required. Review reports before sharing them, because screenshots and URLs may contain sensitive information.

### Requirements

- **Checklists only:** a browser or Markdown reader. No Codex, Node.js, or Python installation is needed.
- **Automated reports:** Node.js 22.19.0 or newer, npm, an approved Chromium download or a compatible installed Chrome/Edge browser, and network access to the authorized target.
- **AI-assisted reviews:** a working Codex environment with plugin support and the toolkit installed. Codex usage is separate from the toolkit's MIT license.
- **Platform status:** Windows 11 x64 and Ubuntu CI are tested, including all six browser-profile suites. macOS, Claude Code, and Bionic compatibility are unverified. See the [platform matrix](docs/supported-platforms-reference.md) for exact coverage and remaining release tests.
- **Contributors:** repository validation dependencies are installed with `npm ci`. Python and PyYAML are for the official skill/plugin validators, not ordinary website reports.

You do not need to install the audit dependencies into the website being reviewed. The standalone CLI profiles do not require an OpenAI API key.

### Changelog

#### 0.1.3 — unreleased

- Corrected the minimum Node.js version to 22.19.0 across setup guidance, package engines, and bootstrap validation; added version-boundary tests.
- Corrected the OWASP ASVS reference and regenerated packaged references.
- Updated platform/CI evidence and recorded official plugin and skill validation.
- Added private security reporting and standardized support on the Computerkick contact form.

#### 0.1.2 — tagged baseline

- Fixed GitHub Actions runtime-cache setup and verified the Ubuntu browser-test suites.
- Completed Phase 5 validation and separated publishing into Phase 6.
- Prepared publishing materials and standardized test-machine descriptions.

#### 0.1.1 — shared runtime and reporting cleanup

- Consolidated shared report layout, evidence handling, browser collection, and test helpers.
- Separated dependency caching from worker-code revisions, reducing unnecessary reinstalls.
- Added stronger schema, incomplete-run, artifact, and cache validation.
- Consolidated shared skill setup and reporting guidance.
- Renamed the accessibility HTML output to `accessibility-report.html`.

#### 0.1.0 — core toolkit foundation

- Added the six core skills and their deterministic review profiles.
- Added the plugin-owned browser runtime and HTML/JSON evidence reports.
- Established the human checklist library, packaged references, and local plugin installation workflow.

The `v0.1.2` tag identifies the tested baseline. Unreleased changes are not part of that tag. Add the final release link and date when publishing; do not move the existing tag to include later fixes.

### License

The toolkit is MIT licensed. See the [LICENSE](LICENSE) for its terms and warranty disclaimer. Third-party runtime tools and services retain their own licenses and terms.

### Future roadmap

- Finish core distribution checks and publish a tagged release.
- Improve the existing reports based on real-world developer feedback.
- Add focused WordPress skills where repeated use shows a clear benefit, including migration workflows.
- Consider dedicated Playwright setup and specialist Sitefinity workflows when there is enough demand to justify maintaining them.

The [modernization plan](modernization-plan.md) is the source of truth. These are planned directions, not promised dates or features already included.

### Support and feedback

For setup questions, start with the README and runtime guide. For support, update inquiries, bug reports, feature requests, or security questions, use the [Computerkick contact form](https://computerkick.com/contact/).

Include the toolkit version, operating system, Node.js version, profile, command, and a sanitized description of the problem. Share a minimal example rather than private screenshots, tokens, customer data, or a full evidence archive.

Report suspected toolkit vulnerabilities privately through the same form, following [the security reporting guidance](SECURITY.md). Do not post vulnerability details in public Issues or pull requests.

For information about the creator and web development work, visit [Computerkick](https://computerkick.com). No response-time guarantee or managed support service is included.

### Call to action

Start with one checklist or one website report. Use the results to fix the important issues, record what remains unverified, and give the next developer a clearer starting point.

## Presentation assets

Two 1254 × 1254 square PNGs use the same cheerful orange, blocky human-and-robot checklist illustration:

- [Illustration without title](assets/publishing/web-dev-ai-toolkit-square.png): profile tiles, thumbnails, and placements with an adjacent text title.
- [Illustration with title](assets/publishing/web-dev-ai-toolkit-square-title.png): social posts and WordPress feature images where the project name should appear inside the graphic.

These are raster images with a vector-art style, not editable SVGs. Use the untitled version at small sizes; the full scene is too detailed for a tiny favicon. No plugin manifest or live listing is changed by adding these assets.

Suggested alt text, untitled: `A smiling blocky developer and friendly AI robot checking items on a clipboard, in warm orange colors.`

Suggested alt text, titled: `Web Dev AI Skills Toolkit: a smiling developer and AI robot working through a checklist.`

Generated with the built-in image-generation tool. The titled image is an edit of the original; no client screenshots or private evidence were used. Prompts are recorded below for future revisions.

### Illustration prompt

```text
Use case: logo-brand. Create one square 1024x1024 project illustration/icon. Happy warm orange motif. Two friendly blocky Roblox-style vector-art characters, exactly one adult human web developer and one AI robot, stand together looking at a large clipboard checklist and checking off items. The human smiles and holds a pencil marking a check box; the friendly robot helps hold the clipboard and points to a completed check. Chunky geometric limbs, simple expressive faces, crisp flat vector-style shapes, strong dark outlines, restrained minimal shading, warm cream background with orange accents, clear green check marks. Cheerful collaborative mood, polished professional community software-toolkit branding, readable at small sizes. Centered balanced composition with generous safe margins and some quiet space below for a later title variant. No words, no letters, no watermark, no Roblox logo or other brand logos. Deliver only the single square illustration, not a mockup, not multiple panels.
```

### Title-variant prompt

```text
Use case: text-localization / precise-object-edit. Input image is the EDIT TARGET: the existing square orange toolkit illustration. Create its matching titled version, also square. Preserve the same two characters, their identities, faces, poses, clothing, clipboard, check marks, pencil, orange/cream palette, blocky vector-art style and decorative motif. Do not redesign or redraw the scene differently. Uniformly reduce/reposition the existing illustration slightly upward only as needed to add the title BELOW it, with comfortable bottom margin. Exact title text, case-sensitive: "Web Dev AI Skills Toolkit". Set it in large, bold, clean, friendly dark-brown sans-serif typography, centered, on two lines: "Web Dev AI" then "Skills Toolkit". Keep the complete illustration visible above the text, no overlap, no clipping. No other words, logos or watermarks. Deliver one square image.
```

## Before publishing

Confirm public repository/Issues access, the tagged version, and the final page URL. Review the copy and artwork, then publish the WordPress page and social post yourself. This kit does not publish anything or imply endorsement by OpenAI, Roblox, or the websites used for testing.

Replace relative repository-document links with their public GitHub equivalents when copying this page to WordPress. Keep the README as the current installation reference, and update the changelog and platform claims when a release is cut.

Installation copy checked against the local CLI and [official OpenAI plugin documentation](https://learn.chatgpt.com/docs/plugins). Toolkit features and requirements checked against this repository's README, manifest, runtime configuration, and platform matrix.

Last verified against official documentation: 2026-09-05.
