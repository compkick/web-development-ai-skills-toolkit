# Web review skill contract

## Purpose

Use this contract in every website review skill so results are evidence-based, safe, consistent, and honest about what the agent could not verify.

## Operating rules

- Start with a read-only review unless the user explicitly asks for changes.
- Confirm the target, environments, important user journeys, and any areas that are out of scope.
- Use the least intrusive evidence that can answer the question.
- Separate automated checks from manual review.
- Do not treat missing evidence, unavailable tools, blocked pages, or inaccessible accounts as a pass.
- Use `Not checked` when a check could not be performed and explain what is needed to complete it.
- Use `Not applicable` only when the check genuinely does not apply to the reviewed project.
- Do not claim certification, compliance, complete security, or guaranteed search-engine behavior.

## Evidence and tools

Use the evidence that is available and relevant:

1. Inspect the target repository, configuration, dependencies, tests, and documentation when source access is available.
2. Use an available browser or browser-automation tool to inspect rendered pages, responsive behavior, user journeys, browser console output, and network behavior.
3. Use the [plugin-owned website audit runtime](website-audit-runtime.md) for repeatable Playwright, axe, screenshot, console-error, and Lighthouse evidence when a URL is authorized and the runtime is suitable.
4. Run existing project tools such as Playwright tests, accessibility checks, linters, test suites, crawlers, or performance tools when they are already configured and safe to run.
5. Review supplied reports and authorized systems such as analytics, search tools, CMS administration, monitoring, or deployment dashboards when access is available.
6. Ask for the smallest missing input that would materially improve the review.

Do not bootstrap the plugin-owned runtime, download a browser, install dependencies, capture browser-error details, or add testing tools unless the user authorizes the download, sensitive artifact, or project change. The plugin runtime is installed in the user's cache and must not modify the target project. Keep Chromium sandboxing enabled; permit an unsandboxed root run only with explicit approval inside an isolated disposable environment. An interactive browser review, the generic audit runtime, and a project-specific Playwright test suite provide different evidence; use the appropriate combination and describe what each actually verified.

## Safety boundaries

- Do not submit production forms, create accounts or content, place orders, send messages, change settings, publish content, or trigger deployments without explicit authorization.
- Do not run intrusive security scans, exploit vulnerabilities, bypass access controls, or test systems outside the authorized scope.
- Avoid exposing secrets, personal data, private endpoints, or sensitive response content in the report.
- Stop and ask before an action could modify production data, incur charges, notify real people, or interrupt service.

## Findings

For each material finding, record:

- Status: `Pass`, `Finding`, `Warning`, `Not checked`, or `Not applicable`.
- Area and affected page, component, file, or journey.
- Evidence: what was observed and how it was checked.
- Impact: why the issue matters.
- Recommendation: the smallest practical next action.
- Priority: `Critical`, `High`, `Medium`, or `Low` when remediation needs prioritization.

Keep minor observations grouped. Do not create a finding for every successful checklist item unless the user asks for a complete control-by-control record.

## Report structure

Use this default structure unless the skill needs a more specific format:

1. Summary and overall assessment
2. Scope, environment, tools, and evidence reviewed
3. Critical and high-priority findings
4. Other findings and recommendations
5. Checks that passed or need no action
6. Items not checked, limitations, and requested follow-up evidence
7. Go/no-go recommendation when the task concerns launch or release readiness
