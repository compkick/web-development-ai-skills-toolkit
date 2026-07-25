# Sitefinity editor training plan

## Purpose

Use this plan to deliver a focused one-hour session for Sitefinity content editors and authors. It combines a guided backend tour with a hands-on publish exercise.

> **Project-specific:** Adapt every demonstration to the site's enabled content types, renderer, templates, workflow, permissions, terminology, and integrations. Do not teach features the audience cannot or should not use.

## Audience and outcomes

The core session is for site editors and content authors. Familiarity with websites, HTML, or WordPress can help but is not required.

By the end of the session, participants should be able to:

- Sign in securely and find the Sitefinity administration areas used in their role
- Explain how pages, templates, layouts, widgets, content, and media relate
- Create or edit a page without disrupting shared templates or global content
- Add accessible content and media, preview changes, and use the publishing workflow
- Find help, report a problem, and avoid actions reserved for administrators

## Trainer preparation

- [ ] Confirm the training environment, Sitefinity version, site, renderer, enabled modules, and terminology.
- [ ] Give each participant an individual account with the same role they will use in production; never distribute a shared password.
- [ ] Prepare a safe training section, sample copy, an optimized image with meaningful alternative text, a document, and a simple page-editing exercise.
- [ ] Confirm login, SSO or Microsoft Entra ID behavior, password or MFA requirements, publishing workflow, and support contacts.
- [ ] Identify which templates, layouts, widgets, libraries, forms, blogs, news, events, and SiteSync features are approved for this audience.
- [ ] Record the session or prepare a short project-specific job aid when organizational policy allows it.

## One-hour agenda

### 0–5 minutes: Orientation

- Explain the session outcomes, the training environment, and the difference between the public website and the Sitefinity backend.
- Briefly compare Sitefinity with WordPress if that helps the audience: both manage pages and reusable content, but names, permissions, templates, workflows, and publishing behavior differ.

### 5–10 minutes: Sign in and navigate

- Demonstrate the normal username/password or SSO sign-in flow and the `/Sitefinity` backend.
- Tour the dashboard, page tree, content and media areas, site selector when applicable, profile controls, and help or support path.
- Explain account security, session timeouts, and why users must not share accounts.

### 10–20 minutes: Understand the site

- Explain the site architecture at an editor's level: pages organize URLs, templates provide shared structure, layouts or sections place components, widgets render content, and libraries store reusable content and files.
- Review page organization and naming conventions, base or parent pages, navigation behavior, and the difference between local and shared content.
- Show the project-approved page templates and layouts; do not assume Bootstrap or another framework unless the project uses it.

### 20–35 minutes: Create and edit a page

- Demonstrate creating or editing a page, choosing the correct template, setting the title and URL, and using widgets.
- Show the content block and the other high-use widgets approved for the role, such as navigation, links, lists, cards, blogs, news, or events.
- Explain locking, draft state, preview, approval, publishing, scheduling, revision history, and unpublishing as configured for the site.
- Point out changes that affect global content, shared templates, navigation, SEO, or accessibility and require extra review.

### 35–45 minutes: Media, documents, forms, and other content

- Demonstrate uploading, organizing, replacing, and reusing images and documents in the correct library.
- Cover descriptive filenames, image sizing, meaningful alternative text, document titles, link purpose, copyright, and removal of sensitive metadata or content.
- Demonstrate forms or search only if participants manage them, including where submissions go and how sensitive data must be handled.

### 45–55 minutes: Participant exercise

Ask each participant to:

1. Open the assigned training page and create or edit a draft.
2. Add or update a widget using the approved layout.
3. Insert the prepared image with suitable alternative text and add the prepared document with a descriptive link.
4. Preview at desktop and mobile widths.
5. Submit for approval or publish, according to the configured workflow.
6. View the frontend result and correct one intentional issue.

The trainer verifies that the participant used the correct template, preserved navigation and shared content, supplied accessible content, and completed the publishing workflow.

### 55–60 minutes: Wrap-up

- Review the most common mistakes, rollback or revision-history options available to editors, and the support/escalation path.
- Answer questions and point participants to the project's style guide, widget guide, content standards, and job aids.
- Confirm who needs follow-up coaching or a different permission level.

## Optional follow-up modules

Schedule separate role-based sessions for topics that do not fit responsibly into the core hour:

- Advanced page templates, layouts, and widget configuration
- Blogs, news, events, dynamic content, taxonomies, localization, or multisite work
- Form building, submission access, retention, and privacy handling
- User accounts, roles, groups, permissions, and authentication administration
- Site architecture, navigation governance, and global/shared content ownership
- SiteSync, environment promotion, content migration, and release coordination
- Advanced settings, integrations, analytics, personalization, or troubleshooting

## Completion record

- [ ] Participants completed the exercise or received documented follow-up.
- [ ] Questions, confusing labels, permission gaps, and documentation needs were captured.
- [ ] Training artifacts contain no real credentials, personal data, or production-only information.
- [ ] The trainer recorded the date, environment, Sitefinity version, audience, materials, and owner for the next review.

## References

- [Sitefinity content management documentation](https://www.progress.com/documentation/sitefinity-cms/content-management)
- [Sitefinity documentation](https://www.progress.com/documentation/sitefinity-cms)

Last verified against official documentation: 2026-07-24.
