<!-- Generated from docs/web-accessibility-review-checklist.md by scripts/sync-skill-references.mjs. Do not edit this copy. -->

# Web accessibility review checklist

## Purpose

Use this checklist to review representative pages and complete user journeys. WCAG 2.2 Level AA is the usual target unless the project has another approved requirement.

Automated tools help find problems, but they do not replace keyboard, screen-reader, zoom, and human review.

## Prepare

- [ ] Record the accessibility target and choose representative pages, workflows, states, browsers, and assistive technologies.
- [ ] Record anything that could not be tested.
- [ ] Involve a qualified accessibility reviewer when the risk or required conformance claim calls for one.

## Page structure and content

- [ ] Confirm every page has a useful title and language.
- [ ] Check headings, landmarks, reading order, and the name and role of controls.
- [ ] Write meaningful alternative text and mark decorative images appropriately.
- [ ] Provide captions, transcripts, or audio description for media when required.

## Keyboard and interaction

- [ ] Complete important tasks using only the keyboard.
- [ ] Confirm focus is visible, sensible, and not hidden by other content.
- [ ] Test the site's menus, dialogs, and other custom controls.
- [ ] Provide alternatives for dragging, complex gestures, and motion controls.

## Visual presentation

- [ ] Check text, control, and focus-indicator contrast.
- [ ] Test browser zoom to 200 percent and text spacing overrides.
- [ ] Confirm content reflows without losing information or functionality at the WCAG zoom-equivalent width of 320 CSS pixels, which represents a 1280 CSS-pixel desktop viewport at 400 percent zoom; test current mobile viewports separately when they are in scope.
- [ ] Respect reduced-motion preferences and make controls reasonably easy to target.

## Forms and messages

- [ ] Give fields clear labels and connect understandable errors to the affected fields.
- [ ] Preserve valid input and announce important status changes when needed.
- [ ] Let users review or correct submissions that create legal or financial commitments.
- [ ] Do not block paste, password managers, or accessible authentication methods.

## Finish the review

- [ ] Run an automated scan, review the results, and test important workflows with a screen reader.
- [ ] Retest fixes and check shared components for the same problem.
- [ ] Record affected users, evidence, severity, and any testing limitations.

## References

- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C Understanding Success Criterion 1.4.10: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [W3C evaluating web accessibility](https://www.w3.org/WAI/test-evaluate/)
- [W3C accessibility evaluation report template](https://www.w3.org/WAI/test-evaluate/report-template/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

Last verified against official documentation: 2026-07-28.
