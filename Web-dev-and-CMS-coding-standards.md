# Web development and CMS coding standards

## Purpose

Use these standards for public websites, web applications, themes, templates, widgets, and CMS-rendered content. They define a general baseline; project requirements, laws, contracts, platform constraints, or threat models may require stricter controls.

Target WCAG 2.2 Level AA unless the project has a documented requirement for a different standard. Accessibility conformance requires human evaluation as well as automated testing.

In this document:

- **Required** means the rule applies unless a documented exception is approved.
- **Recommended** means the rule is the preferred default, but context may justify another implementation.
- **Project-specific** means the team must make and document a choice.

## General principles

- Prefer simple, maintainable solutions over unnecessary abstraction or markup.
- Use platform features and semantic HTML before custom JavaScript or ARIA.
- Keep content, presentation, and behavior appropriately separated.
- Build for progressive enhancement: essential content and core workflows should remain understandable when optional enhancements fail.
- Do not depend on color, position, shape, motion, hover, or a single input method to communicate essential information.
- Meet the applicable WCAG contrast requirements for text, controls, focus indicators, and meaningful visual states.
- Use automated formatting, linting, testing, and review to enforce mechanical rules. Do not rely on manual consistency alone.
- Record exceptions with their scope, reason, owner, and review date.

## Browser support and responsive design

- Define the supported browser and device policy for each project.
- Base the policy on user analytics, contractual requirements, assistive technology needs, and the risk of excluding users.
- Prefer Baseline Widely available web features when no project-specific browser policy exists. Assess fallbacks or progressive enhancement for features with more limited availability.
- Test representative viewport sizes and content states instead of targeting only named devices or a few fixed pixel widths.
- Support zoom, text resizing, reflow, portrait and landscape orientation, touch, keyboard, mouse, and other applicable input methods.
- Do not disable user scaling.

## HTML structure

- Use lowercase HTML element and attribute names.
- Include a valid document language with the `lang` attribute.
- Use semantic elements that match the content or behavior, including headings, paragraphs, lists, landmarks, tables, links, buttons, and form controls.
- Use `<section>` and `<article>` only when their semantics fit the content; do not use them as generic styling wrappers.
- Keep markup no more complex than required for the content, layout, and behavior.
- Keep every `id` value unique within the document. Prefer classes or attributes for reusable styling and behavior.
- Follow the project's formatter and EditorConfig settings. Do not prescribe tabs or spaces independently of the project configuration.
- Validate generated HTML, including CMS output and component combinations.

## Headings and landmarks

- Provide one clear primary heading that describes the page's main purpose. A single `<h1>` is the recommended convention.
- Nest headings according to the content hierarchy. Do not choose a heading level for its visual size.
- Provide appropriate landmarks such as `<header>`, `<nav>`, `<main>`, and `<footer>` without creating excessive or unlabeled duplicate regions.
- Provide a mechanism to bypass repeated content, such as a visible-on-focus skip link to the main content.

## Links, buttons, and interactive controls

- Use links for navigation to a URL or document location.
- Use buttons for actions such as submitting, opening, dismissing, toggling, or changing application state.
- Give links and controls descriptive visible text. Avoid ambiguous text such as "click here" when the surrounding context does not identify the destination.
- Do not add redundant `title` or `aria-label` attributes when visible text already provides the correct accessible name.
- Ensure all functionality is available by keyboard without a keyboard trap.
- Preserve a logical focus order. Do not use positive `tabindex` values unless necessary.
- Keep focus visible and ensure sticky headers, dialogs, cookie banners, and other overlays do not obscure the focused element.
- Provide a non-dragging alternative for functionality that uses dragging.
- Size and space pointer targets to meet the project's WCAG 2.2 target-size requirements.
- Do not open a new window or tab unless the behavior is necessary and clearly communicated.

## Forms

- Use native `<form>`, `<button>`, `<input>`, `<label>`, `<select>`, and `<textarea>` elements whenever they meet the requirement.
- Give every form control an accessible name, normally through a visible `<label>` associated with the control.
- Use `aria-describedby` to associate supplementary instructions or error details with a control when its accessible name alone is insufficient.
- Use `<fieldset>` and `<legend>` for related groups such as radio buttons and checkboxes when a group label is needed.
- Use the most appropriate input type and provide `autocomplete`, `inputmode`, and other applicable attributes.
- Give `<option>` elements meaningful text that clearly identifies each available choice.
- Do not block paste or password managers. Do not require a cognitive-function test for authentication without an accessible alternative that meets WCAG 2.2.
- Identify required fields and formatting expectations in text before submission.
- Validate on the server even when client-side validation is provided.
- Identify errors in text, associate messages with affected controls, preserve valid input where safe, and provide specific correction guidance.
- Announce validation results and asynchronous status changes to assistive technology without moving focus unnecessarily.
- Before final submission, allow users to review, confirm, and correct information for transactions that create legal or financial commitments.
- Avoid asking for information already provided during the same process unless re-entry is essential or required for security.

## ARIA

- Prefer native HTML semantics. No ARIA is better than incorrect ARIA.
- Add ARIA only when native HTML cannot express the required name, role, state, property, or relationship.
- Do not add a role that duplicates or conflicts with an element's native role.
- When implementing a custom widget, provide the keyboard behavior, focus management, states, and properties promised by its ARIA pattern.
- Test ARIA-based components with keyboard navigation and representative assistive technologies; markup inspection alone is insufficient.

## Images, icons, and media

- Include an `alt` attribute on every `<img>`.
- Write concise alt text that conveys the image's purpose in context. Use `alt=""` for decorative images that should be ignored by assistive technology.
- Do not repeat nearby text in alt text. Provide a nearby extended description for complex images when a short alternative is insufficient.
- Give informative icons an accessible name. Hide decorative icons from assistive technology.
- Set intrinsic `width` and `height` on images when the dimensions are known to reserve layout space and reduce layout shifts.
- Use responsive image formats and `srcset`/`sizes` where they materially reduce transferred bytes without harming quality.
- Ensure images resize within their containers without overflow, distortion, or unintended cropping.
- Use `loading="lazy"` for appropriate offscreen images and iframes. Do not lazy-load an image likely to be visible on initial load, especially the Largest Contentful Paint image.
- Provide captions, transcripts, audio descriptions, and controls for audio or video as required by the content and accessibility target.
- Do not autoplay audio.
- Do not autoplay video.
- Respect user preferences for reduced motion.

## CSS

- Use the project's selected framework and design system consistently.
- Do not introduce competing frameworks, component libraries, or overlapping utility systems without a documented architectural decision.
- Use the cascade, inheritance, custom properties, logical properties, and layout primitives consistently; avoid unnecessary specificity and `!important`.
- Prefer reusable component or utility patterns over selectors tied to fragile DOM depth.
- Do not use IDs as general styling hooks.
- Ensure layouts reflow without loss of information or functionality.
- Keep media queries and container queries intentional; avoid overlapping or contradictory responsive rules that make the cascade difficult to predict.
- Preserve visible focus styles and support forced colors or high-contrast modes where applicable.
- Use `prefers-reduced-motion` to remove non-essential motion for users who request it.
- Test text spacing, zoom, long content, localization, validation messages, and user-generated content.

## JavaScript

- Use JavaScript to enhance behavior, not to recreate native controls without a demonstrated need.
- Keep event handling compatible with keyboard, pointer, touch, and assistive technology behavior.
- Avoid injecting unsanitized strings into HTML or script execution contexts.
- Treat all client input and client state as untrusted; enforce authorization and validation on the server.
- Do not expose credentials, private keys, or privileged configuration in client bundles.
- Provide loading, empty, error, offline, and retry states for asynchronous workflows where applicable.
- Clean up timers, observers, listeners, and component resources when they are no longer needed.

## Performance

- Define performance budgets appropriate to the project's users and content.
- Measure both controlled lab results and real-user field data when available.
- Use the current Core Web Vitals "good" thresholds (the 75th percentile) as a general target unless the project defines stricter goals:
  - Largest Contentful Paint (LCP): 2.5 seconds or less
  - Interaction to Next Paint (INP): 200 milliseconds or less
  - Cumulative Layout Shift (CLS): 0.1 or less
- Optimize critical rendering resources before adding speculative preloads.
- Minimize shipped JavaScript, CSS, fonts, images, and third-party code.
- Use caching and cache busting deliberately, and test invalidation during releases.
- Test on representative mobile hardware and constrained network conditions.

## Security and privacy

- Serve production and web-accessible dev sites over HTTPS and redirect HTTP consistently.
- Configure security headers appropriate to the application, including a tested Content Security Policy. Enable HSTS only after HTTPS behavior and subdomain implications are understood and verified.
- Apply contextual output encoding, parameterized queries, server-side input validation, authorization checks, and CSRF protections where applicable.
- Configure cookies with the narrowest practical scope and appropriate `Secure`, `HttpOnly`, and `SameSite` attributes.
- Keep dependencies, runtimes, frameworks, plugins, and CMS versions supported and patched. Remove unused components.
- Store secrets in approved secret-management systems, not source control or client-delivered code.
- Log security-relevant events without recording secrets or unnecessary personal data.
- Use the current OWASP Top 10 for awareness and a risk-appropriate, explicitly recorded version of OWASP ASVS for verifiable application-security requirements.
- Minimize personal data collection and retention. Load analytics, advertising, session replay, and other non-essential tracking only under the project's approved privacy and consent requirements.
- Obtain qualified legal or privacy review when laws, contracts, or jurisdictions determine the requirements; this document is not legal advice.

## Search and sharing metadata

- Give every indexable page a descriptive, unique `<title>` and a useful primary heading.
- Add meta descriptions when the project manages search-result summaries.
- Use crawlable links for important navigation.
- Use self-referential canonical URLs where duplicate URL variants are possible, and keep canonicals consistent with redirects and sitemaps.
- Add Open Graph or other sharing metadata when sharing previews are required.
- Use structured data only when it accurately represents visible page content and follows the search provider's requirements.
- Do not use `robots.txt` as a substitute for access control, `noindex`, or canonicalization.

## Testing and enforcement

- Run formatters, linters, type checks, unit tests, integration tests, and end-to-end tests appropriate to the project in CI.
- Include automated accessibility checks, then perform manual keyboard, zoom, reflow, focus, content, and assistive-technology testing appropriate to risk.
- Test security controls, privacy behavior, performance budgets, structured data, redirects, canonical URLs, error pages, and caching before release.
- Prefer tests based on user-visible behavior and accessible names over CSS selectors or internal implementation details.
- Record evidence for high-risk or contractually required checks.

## References

Security references last verified 2026-07-21 against OWASP Top 10:2025 and OWASP ASVS 5.0.0.

- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [ARIA Authoring Practices: Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
- [ARIA in HTML](https://www.w3.org/TR/html-aria/)
- [Web Platform Baseline](https://web.dev/baseline/)
- [Web Vitals](https://web.dev/articles/vitals)
- [Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp)
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [Google Search technical SEO guidance](https://developers.google.com/search/docs/fundamentals/get-started)
- [Google canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
