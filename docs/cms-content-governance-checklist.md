# CMS content governance checklist

## Purpose

Use this checklist to review whether website content has clear purpose, ownership, quality controls, permissions, lifecycle rules, and recoverable publishing operations. Apply it to a CMS or other managed publishing platform; adapt workflow depth to the site's size, risk, update frequency, and regulatory context.

This checklist covers content governance rather than CMS infrastructure security or general frontend quality. Use the applicable platform setup, testing, migration, and launch checklists for those concerns.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Content purpose and inventory

- [ ] **Baseline requirement:** Record the site's audiences, user needs, content types, languages, channels, business or service goals, governance owner, and applicable accessibility, privacy, records, legal, and brand requirements.
- [ ] **Baseline requirement:** Maintain an inventory of published and material draft content with URL, type, status, owner, approver, review date, audience, and retention or disposition where practical.
- [ ] **Baseline requirement:** Identify duplicate, conflicting, orphaned, expired, inaccurate, unused, test, and ownerless content and assign a decision to update, consolidate, redirect, archive, retain, or delete it.
- [ ] **Baseline requirement:** Verify each material content type and required field supports a defined user need and publishing outcome rather than preserving fields or templates solely from historical habit.

## Roles, permissions, and workflow

- [ ] **Baseline requirement:** Define author, editor, approver, publisher, administrator, translator, legal or subject-matter reviewer, and emergency-publishing responsibilities appropriate to the organization.
- [ ] **Baseline requirement:** Give named users the lowest practical CMS permissions, review access periodically, remove stale accounts, and avoid shared publishing identities.
- [ ] **Baseline requirement:** Define proportionate draft, review, approval, scheduling, publishing, correction, translation, archival, and deletion workflows with visible status and ownership.
- [ ] **Conditional requirement:** Require separation of author and approver, legal or compliance review, embargo handling, or additional evidence for high-risk, regulated, financial, safety, policy, or crisis content.
- [ ] **Baseline requirement:** Document an urgent correction and emergency publishing path that remains auditable and receives retrospective review.

## Content model and author experience

- [ ] **Baseline requirement:** Define content types, taxonomies, relationships, reusable content, URL rules, required metadata, and field purposes consistently and document controlled changes to the model.
- [ ] **Baseline requirement:** Make editorial labels, help text, validation, defaults, ordering, previews, and error messages understandable to the people who maintain content.
- [ ] **Baseline requirement:** Constrain structured fields where consistency matters while preserving a justified escape path for legitimate content rather than forcing authors into inaccessible workarounds.
- [ ] **Baseline requirement:** Define ownership and update behavior for reused, embedded, syndicated, translated, personalized, and externally sourced content.
- [ ] **Conditional requirement:** Define moderation, abuse response, consent, licensing, retention, and removal rules for comments, submissions, profiles, reviews, or other user-generated content.

## Quality and accessibility

- [ ] **Baseline requirement:** Define concise editorial standards for plain language, headings, links, calls to action, dates, contact information, media, downloads, sources, and brand voice.
- [ ] **Baseline requirement:** Verify templates and editorial controls support accessible headings, link text, image alternatives, tables, language, captions, transcripts, and document alternatives.
- [ ] **Baseline requirement:** Review representative content in rendered context across supported layouts, not only in the editor or raw-field view.
- [ ] **Baseline requirement:** Check factual accuracy, completeness, spelling, broken links, ownership, metadata, search presentation, permissions, and accessibility before publication.
- [ ] **Conditional requirement:** Define translation source, reviewer qualifications, synchronization, locale-specific legal or cultural changes, fallback behavior, and stale-translation handling for multilingual content.

## Lifecycle, records, and measurement

- [ ] **Baseline requirement:** Assign review dates or event-based review triggers to time-sensitive and high-value content and route overdue items to an accountable owner.
- [ ] **Baseline requirement:** Define when content is corrected, versioned, unpublished, archived, redirected, retained as a record, or deleted and preserve required approvals and history.
- [ ] **Baseline requirement:** Preserve durable URLs where practical and use relevant direct redirects when content moves or consolidates; do not redirect unrelated retired content to the homepage.
- [ ] **Baseline requirement:** Use search, analytics, feedback, support, user research, and task outcomes to improve or retire content without treating traffic alone as proof of value.
- [ ] **Conditional requirement:** Verify records holds, statutory retention, public records, copyright, licensing, privacy deletion, and audit-history requirements with qualified owners.

## Publishing resilience and maintenance

- [ ] **Baseline requirement:** Verify content exports, database and media backups, revisions, approvals, redirects, taxonomies, and configuration needed for recovery are backed up and restorable.
- [ ] **Baseline requirement:** Test representative authoring, preview, scheduling, publishing, correction, rollback or revision restore, unpublishing, and cache or search-index update workflows.
- [ ] **Baseline requirement:** Define how content changes move between environments without overwriting newer production content or exposing private drafts and production data.
- [ ] **Baseline requirement:** Assign ownership for CMS training, documentation, platform updates, permission reviews, content audits, broken-link reviews, and governance changes.
- [ ] **Baseline requirement:** Review governance after organizational, platform, content-model, legal, audience, or publishing-risk changes and record accepted exceptions with review dates.

## References

- [GOV.UK content design guidance](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/understand-content-design/)
- [GOV.UK content maintenance guidance](https://www.gov.uk/guidance/content-design/content-maintenance)
- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)

Last verified against official documentation: 2026-07-25.
