# Sitefinity project-start checklist

Use this checklist to start a new Sitefinity project with enough structure to develop, test, secure, and deploy it reliably.

> **Version-specific:** Confirm the current Sitefinity installation paths, system requirements, renderer compatibility, and supported package versions before creating the solution. **Organization-specific example:** References to Azure DevOps (ADO), Azure App Service, `develop` and `main`, and the sample folder names describe one workable delivery model. Replace them with the project's approved source-control, hosting, environment, and naming conventions.

## Define the project

- [ ] Record the target Sitefinity release, support lifecycle, license owner, and Progress/Telerik account owners.
- [ ] Choose the supported renderer architecture; for a new project, prefer ASP.NET Core Renderer unless a documented constraint requires hybrid, MVC-only, or Next.js.
- [ ] Document the planned environments, hosting model, database platform, media storage, search provider, authentication, email delivery, and external integrations.
- [ ] Define who owns infrastructure, DNS, certificates, secrets, backups, monitoring, content migration, accessibility, security review, and launch approval.

## Create source control and delivery foundations

- [ ] Create the repository and project in the approved source-control platform; for ADO, initialize the ADO project and repository.
- [ ] Create a practical local structure, such as `/Docs`, `/Sitebuild`, and `/Web`, or document the structure selected for the CMS and renderer repositories.
- [ ] Initialize Git locally, connect the remote, and add the correct `.gitignore` before the first commit.
- [ ] Protect the primary branch and require pull-request review and successful validation; create `develop` or feature branches only when the team's workflow uses them.
- [ ] Add a CI pipeline that restores dependencies, builds all applications, runs the available automated tests, and produces a deployable artifact.
- [ ] Configure environments and deployment approvals for development, test, UAT, and production as applicable.
- [ ] Keep environment-specific settings in the approved configuration and secret stores; use transforms such as SlowCheetah only when the project deliberately adopts them.

## Create the Sitefinity applications

- [ ] Verify the workstation against the [Sitefinity development prerequisites](Sitefinity-dev-prerequisites.md).
- [ ] Install the selected Sitefinity packages from authenticated feeds, following the current [Sitefinity installation guidance](https://www.progress.com/documentation/sitefinity-cms/install-sitefinity).
- [ ] Create and connect the renderer application when the selected architecture requires one.
- [ ] Create a local development database and verify the connection string cannot point to another environment by mistake.
- [ ] Activate the correct development license without committing the license file.
- [ ] Build and start the CMS and renderer, sign in at `/Sitefinity`, and load a frontend page.
- [ ] Add any Sitefinity Visual Studio extension or other IDE extension only when it supports the selected release and team workflow.

## Establish access and security

- [ ] Create individual developer and administrator accounts with least-privilege roles.
- [ ] Keep an emergency administrative account protected, monitored, and accessible only through the approved break-glass process.
- [ ] Create a dedicated SiteSync or service account only if the feature is used, and scope and rotate its credentials.
- [ ] Avoid shared generic developer accounts; if temporary onboarding access is unavoidable, time-limit it and replace it with an individual account promptly.
- [ ] Store connection strings, credentials, API keys, and certificates outside source control and verify secret scanning is enabled where available.
- [ ] Configure local and non-production access controls so public users cannot reach unfinished or sensitive environments.

## Build the frontend foundation

- [ ] Create the base page template or layout and the approved grid/container system.
- [ ] Add the project resource package and only the CSS framework or design system chosen for the project.
- [ ] Add the site styles, responsive behavior, media queries, and custom JavaScript through the project's build pipeline.
- [ ] Set up the Sitefinity default widgets the design requires and create the first custom widget using the selected renderer pattern.
- [ ] Create a style-guide page and a widget-guide page that editors and testers can use.
- [ ] Verify the base layout, header, footer, navigation, representative content, and responsive behavior before expanding the component set.

## Prepare hosted environments

- [ ] Provision the approved application, database, storage, search, email, identity, logging, and monitoring resources; for the example Azure model, configure App Service and Azure SQL.
- [ ] Configure environment settings, licenses, domains, HTTPS, health checks, and least-privilege service connections.
- [ ] Confirm persistent media and required Sitefinity data are stored in the documented provider rather than an ephemeral deployment location.
- [ ] Deploy through the pipeline to development and run the [Sitefinity test plan](Sitefinity-test-plan.md).
- [ ] Document backup, restore, deployment, rollback, content synchronization, and incident-response procedures before production work begins.
