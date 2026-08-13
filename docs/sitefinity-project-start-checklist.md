# Sitefinity project-start checklist

## Purpose

Use this checklist to start a new Sitefinity project with enough structure to develop, test, secure, and deploy it reliably.

> **Version-specific:** Confirm the current Sitefinity installation paths, system requirements, renderer compatibility, and supported package versions before creating the solution. **Organization-specific example:** References to Azure DevOps (ADO), Azure App Service, `develop` and `main`, and the sample folder names describe one workable delivery model. Replace them with the project's approved source-control, hosting, environment, and naming conventions.

## Define the project

- [ ] Record the Sitefinity version, support status, license owner, and Progress account owner.
- [ ] Choose the renderer architecture. Consider ASP.NET Core Renderer first for a new project.
- [ ] Document the environments, hosting, database, media storage, search, authentication, email, and integrations.
- [ ] Assign owners for infrastructure, DNS, certificates, secrets, backups, monitoring, content, security, and launch.

## Create source control and delivery foundations

- [ ] Create the repository in the approved source-control platform.
- [ ] Create a practical folder structure, such as `/Docs`, `/Sitebuild`, and `/Web`.
- [ ] Initialize Git locally, connect the remote, and add the correct `.gitignore` before the first commit.
- [ ] Protect the primary branch and require review and successful checks before merging.
- [ ] Add a pipeline that restores, builds, tests, and creates a deployable artifact.
- [ ] Configure development, test, UAT, and production environments as needed.
- [ ] Keep environment settings and secrets outside source control.

## Create the Sitefinity applications

- [ ] Verify the workstation against the [Sitefinity development prerequisites](sitefinity-development-prerequisites.md).
- [ ] Install Sitefinity from the approved package feeds.
- [ ] Create and connect the renderer application when the selected architecture requires one.
- [ ] Create a local database and confirm the connection string points to it.
- [ ] Activate the correct development license without committing the license file.
- [ ] Build and start the CMS and renderer.
- [ ] Sign in at `/Sitefinity` and load a frontend page.
- [ ] Install only the IDE extensions the project needs.

## Establish access and security

- [ ] Create individual developer and administrator accounts with least-privilege roles.
- [ ] Protect the emergency administrator account and limit who can use it.
- [ ] Create a dedicated SiteSync or service account only when needed.
- [ ] Use named developer accounts instead of shared accounts.
- [ ] Keep connection strings, credentials, API keys, and certificates outside source control.
- [ ] Configure local and non-production access controls so public users cannot reach unfinished or sensitive environments.

## Build the frontend foundation

- [ ] Create the base page template or layout and the approved grid/container system.
- [ ] Add the project resource package and only the CSS framework or design system chosen for the project.
- [ ] Add the site styles, responsive CSS, and custom JavaScript.
- [ ] Set up the required default widgets and create the first custom widget.
- [ ] Create a style-guide page and a widget-guide page that editors and testers can use.
- [ ] Test the base layout, header, footer, navigation, content, and responsive behavior.

## Prepare hosted environments

- [ ] Provision the hosting, database, storage, search, email, identity, logging, and monitoring resources the project needs.
- [ ] Configure settings, licenses, domains, HTTPS, health checks, and service connections.
- [ ] Confirm persistent media and required Sitefinity data are stored in the documented provider rather than an ephemeral deployment location.
- [ ] Deploy through the pipeline to development and run the [Sitefinity testing checklist](sitefinity-testing-checklist.md).
- [ ] Document backups, restores, deployments, rollbacks, content synchronization, and incident response.

## References

- [Sitefinity development prerequisites](sitefinity-development-prerequisites.md)
- [Sitefinity testing checklist](sitefinity-testing-checklist.md)
- [Install Sitefinity CMS](https://www.progress.com/documentation/sitefinity-cms/install-sitefinity)

Last verified against official documentation: 2026-07-24.
