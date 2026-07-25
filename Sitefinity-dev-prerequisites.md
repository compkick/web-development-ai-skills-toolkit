# Sitefinity development prerequisites

Use this guide to prepare a local development environment and understand the main parts of a Sitefinity project.

> **Version-specific:** Sitefinity requirements change between releases. Before installing or upgrading, confirm the target release against the current [Sitefinity system requirements](https://www.progress.com/documentation/sitefinity-cms/system-requirements) and release-specific installation or upgrade instructions. Do not select a framework, SDK, database, or renderer version from this document alone.

## Choose the project architecture

- For a new project, prefer the decoupled ASP.NET Core Renderer architecture recommended by Progress unless project constraints require another supported renderer.
- Use hybrid ASP.NET Core and classic MVC when an existing MVC implementation needs a gradual migration.
- Treat MVC-only projects as legacy maintenance work, not the default for new development.
- Identify the CMS, renderer, custom modules, integrations, search provider, media storage provider, and hosting model before setting up a workstation.

See [Install Sitefinity CMS](https://www.progress.com/documentation/sitefinity-cms/install-sitefinity) for the currently supported installation paths.

## Required access

- Progress/Telerik account with access to the correct Sitefinity packages, license, documentation, and support resources
- Source-control repository and the project's branching and review workflow
- Development database and individual database credentials
- Development Sitefinity license with the required CMS and renderer domains
- Project secrets through the approved secret-management system
- Access to non-production hosting, logs, pipelines, and external services when required by the role

Do not commit credentials, connection strings, license files, database backups, or production data to source control.

## Local software

- A supported 64-bit Windows development environment
- A Visual Studio edition supported by the target Sitefinity release, with the ASP.NET and web development workload
- The .NET Framework SDK and targeting pack required by the Sitefinity CMS application
- For an ASP.NET Core Renderer, the .NET SDK required by the target Sitefinity release
- For a Next.js Renderer, a supported Node.js release and the package manager adopted by the project
- A supported SQL Server or SQL Server Express release, plus SQL Server Management Studio or another supported database client
- Git for Windows
- Internet Information Services (IIS), IIS Express, or the project-approved development server
- Sitefinity CLI when upgrading a NuGet-based Sitefinity project
- The project-specific frontend toolchain, browser-testing tools, and IDE extensions

Install only the frontend framework, resource package, extensions, and build tools deliberately adopted by the project. Do not add Bootstrap, SlowCheetah, or another package solely because an older Sitefinity project used it.

## Internet Information Services

IIS is useful for intensive development and for reproducing Windows hosting behavior more closely than an IDE-hosted development server. Enable it as a Windows feature when the project requires it, configure the application pool and bindings for the target release, and use HTTPS locally when authentication, secure cookies, or integration behavior depends on it.

Running Visual Studio as administrator may be necessary for IIS configuration, protected ports, or local certificates. Do not use elevated privileges for routine editing or builds when they are unnecessary.

## Verify the setup

- Restore packages from the project's configured and authenticated feeds.
- Build every application in the solution, including the renderer.
- Start the CMS and renderer using documented local configuration.
- Connect only to the intended development database.
- Sign in at `/Sitefinity` with an individual development account.
- Load a representative frontend page and confirm its styles, scripts, media, and widgets render.
- Confirm secrets and local-only files are ignored by Git.
- Run the project's automated smoke tests or documented manual smoke test.

## Sitefinity architecture basics

A typical modern implementation has a Sitefinity CMS application and database plus a separate frontend renderer. The CMS remains on the .NET Framework, while an ASP.NET Core or Next.js renderer requests content and page data from the CMS. Existing projects may instead use classic Sitefinity MVC or a hybrid architecture.

The Sitefinity administration backend is normally available at:

```text
https://site.example/Sitefinity
```

Sitefinity page building is organized around:

- Pages, which provide the content hierarchy and URLs
- Templates, which provide shared page structure
- Sections or layout containers, which control placement
- Widgets, which render content or functionality
- Content types and libraries, which store reusable structured content and media

In classic Sitefinity MVC development, models represent data, views use Razor to control frontend rendering, and C# controllers contain server-side request logic. In the ASP.NET Core Renderer, use the renderer's current widget and application patterns instead of assuming classic MVC conventions apply.

## References

- [Sitefinity documentation](https://www.progress.com/documentation/sitefinity-cms)
- [System requirements](https://www.progress.com/documentation/sitefinity-cms/system-requirements)
- [Install Sitefinity CMS](https://www.progress.com/documentation/sitefinity-cms/install-sitefinity)
- [Sitefinity tutorials](https://www.progress.com/documentation/sitefinity-cms/tutorials-hub)
- [Progress Sitefinity support resources](https://www.progress.com/support/sitefinity-support-plans)
- [Sitefinity lifecycle policy](https://www.progress.com/support/sitefinity-lifecycle-policy)
- [Visual Studio downloads](https://visualstudio.microsoft.com/)
- [SQL Server downloads](https://www.microsoft.com/sql-server/sql-server-downloads)
