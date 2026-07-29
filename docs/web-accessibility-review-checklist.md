# Web accessibility review checklist

## Purpose

Use this checklist to evaluate representative website or web-application content and workflows against the project's accessibility requirements. WCAG 2.2 Level AA is the general baseline when no stricter approved requirement applies.

This is a practical review, not an automatic conformance claim. Accessibility evaluation requires automated and manual testing, representative assistive technologies, complete processes, and an appropriately qualified reviewer.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Scope and test plan

- [ ] **Baseline requirement:** Record the target accessibility standard and level, applicable laws or contracts, review environment, release, reviewer, and accountable owner.
- [ ] **Baseline requirement:** Select representative pages, templates, components, content types, states, roles, locales, and complete user processes, including error and success states.
- [ ] **Baseline requirement:** Record supported browsers, viewport sizes, input methods, and assistive technologies and identify any material testing limitations.
- [ ] **Conditional requirement:** Include third-party content, embedded services, documents, authentication, consent tools, and administrative workflows when they are part of the user experience or required process.

## Automated and structural checks

- [ ] **Baseline requirement:** Run one or more current automated accessibility tools against the representative sample and manually triage every material result.
- [ ] **Baseline requirement:** Verify valid page language, meaningful page titles, logical headings, appropriate landmarks, unique IDs where required, and semantic HTML before ARIA.
- [ ] **Baseline requirement:** Verify every control exposes the correct accessible name, role, value, state, and relationship and that status messages are announced appropriately.
- [ ] **Baseline requirement:** Verify text, controls, focus indicators, and meaningful graphics meet applicable contrast requirements in default, hover, focus, active, disabled, and error states.
- [ ] **Baseline requirement:** Verify meaningful images and icons have appropriate alternatives, decorative images are ignored, and complex visuals have sufficient descriptions.
- [ ] **Conditional requirement:** Verify prerecorded and live media provides the required captions, transcripts, audio descriptions, controls, and alternatives.

## Keyboard, focus, and interaction

- [ ] **Baseline requirement:** Complete every critical journey with a keyboard alone without traps, inaccessible controls, unexpected context changes, or reliance on pointer gestures.
- [ ] **Baseline requirement:** Verify focus order follows the intended reading and interaction sequence; positive `tabindex` use, when present, is necessary, deliberate, and tested across supported browsers.
- [ ] **Baseline requirement:** Verify focus is visible, is not obscured by sticky or overlay content, moves predictably when views change, and returns appropriately when dialogs or menus close.
- [ ] **Baseline requirement:** Verify links, buttons, menus, disclosures, tabs, dialogs, carousels, drag interactions, and custom widgets follow their expected keyboard and focus behavior.
- [ ] **Baseline requirement:** Verify pointer targets meet the applicable size and spacing requirement and that multipoint, path-based, or dragging gestures have an accessible alternative where required.
- [ ] **Baseline requirement:** Verify time limits, moving content, animation, flashing, auto-updates, and session expiry provide required controls and respect reduced-motion preferences.

## Visual, responsive, and content checks

- [ ] **Baseline requirement:** Verify content and functionality remain available at 200% zoom and text-only resizing and reflow without two-dimensional scrolling at the applicable viewport.
- [ ] **Baseline requirement:** Verify content works in portrait and landscape unless one orientation is essential, and test high-contrast or forced-colors behavior where supported.
- [ ] **Baseline requirement:** Verify information is not conveyed only by color, shape, location, sound, hover, motion, or a single sensory characteristic.
- [ ] **Baseline requirement:** Verify reading order, labels, instructions, link purpose, headings, plain-language content, and repeated navigation are understandable and consistent.
- [ ] **Conditional requirement:** Verify localization, right-to-left presentation, user-generated content, data tables, charts, maps, downloads, and print views when they are in scope.

## Forms, authentication, and errors

- [ ] **Baseline requirement:** Verify every form control has a persistent accessible label and any required format, required state, help, and grouping are communicated programmatically and visually.
- [ ] **Baseline requirement:** Submit forms with missing, invalid, duplicate, and valid data; verify errors are identified in text, associated with controls, announced, and accompanied by specific correction guidance.
- [ ] **Baseline requirement:** Verify valid input is preserved when safe, repeated information is not requested unnecessarily, and users can review and correct submissions that create legal, financial, or destructive commitments.
- [ ] **Baseline requirement:** Verify authentication does not require a cognitive-function test without an accessible alternative and supports paste and password managers.
- [ ] **Conditional requirement:** Verify account recovery, multifactor authentication, CAPTCHA, identity proofing, and timeout extensions are accessible when provided.

## Assistive technology and user validation

- [ ] **Baseline requirement:** Test critical journeys with a representative screen reader and browser combination, verifying reading order, control operation, names, states, errors, and live updates.
- [ ] **Conditional requirement:** Test with additional assistive technologies or users with disabilities when project risk, audience evidence, procurement, or contractual requirements justify it.
- [ ] **Baseline requirement:** Retest shared components and representative affected workflows after remediation instead of closing findings from code inspection alone.
- [ ] **Baseline requirement:** Record all failures by affected success criterion and scope, without claiming conformance when known failures, excluded complete processes, or untested material content remain.

## References

- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C Evaluating Web Accessibility Overview](https://www.w3.org/WAI/test-evaluate/)
- [W3C accessibility evaluation report template](https://www.w3.org/WAI/test-evaluate/report-template/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

Last verified against official documentation: 2026-07-25.
