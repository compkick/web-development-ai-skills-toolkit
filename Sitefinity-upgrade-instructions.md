# Upgrading Sitefinity to new version in CI/CD environment

Instructions for upgrading a single Sitefinity instance with an Azure DevOps / App Service setup. Assumes Azure app service deployment, with develop and main branches in repository. Assumes you have permissions to all necessary servers and resources.

## Notes

A Sitefinity upgrade happens once to the code, on a single branch. Then the new code mutates (upgrades) the database separately for each environment when it first runs.

The upgraded code and upgraded database must move together. Do not point old code at an upgraded database unless you have verified that the version combination is supported.

**Start Visual Studio in "admin" mode**

For file system and Sitefinity libraries, ensure no files are stored directly on app service file system. These could be lost as part of the upgrade.

Production upgrades should be scheduled during a maintenance window or other approved low-traffic window. Make sure the client, project owner, and QA contact know when the database upgrade will happen.

## Database recommendations

For fast exports on large databases, you can temporarily increase the database performance tier. Before you start the backup, increase DTUs or the service level, run export, then set it back to the typical level for that client / project.

Keep the database backup for at least one to two months after the production upgrade, depending on client risk tolerance.

## Security and data handling

- Treat production database exports as sensitive data
- Do not commit `.bacpac` files, database backups, connection strings, credentials, or license files to git
- Store downloaded backups and licenses only in approved secure locations

## Upgrade steps

### Preflight checklist

Before changing code or data, confirm the following:

- Current Sitefinity version
- Target Sitefinity version
- Supported .NET Framework version for the target Sitefinity version
- Project uses NuGet packages and can be upgraded with the Sitefinity CLI
- Visual Studio version supports the target framework and project type
- NuGet package sources are reachable, including Sitefinity/Telerik/Progress feeds
- Progress/Telerik account access is available for package feeds and license download
- Custom widgets, custom modules, scheduled tasks, search, forms, and integrations are known
- Frontend renderer type is known, if the site uses ASP.NET Core or Next.js renderer
- Media/file storage provider is known, such as database, Azure Blob Storage, or file system
- Search provider and index names are known
- App Service app settings and connection strings have been exported or documented
- Current build artifact or release package is available for rollback
- Database backup/export has been completed and restore-tested

### Sitefinity CLI

- Install and/or update the Sitefinity CLI
- You can add this on path, or just run directly via terminal from the containing folder

### Export and restore database

- Export the production database, download and restore on your local
- Easiest path: Use Azure SQL server "export" tool, to copy .bacpac to client storage account
- Confirm the restored local database opens in SQL Server Management Studio or Azure Data Studio

### Code prep

- Checkout to develop branch
- Make sure your local git is current (fetch and pull, for develop and main)
- Optional - Create backup branch, name like pre-upgrade "version 14.x"
- **Important:** Verify that the database connection string points to your restored local dev database
- From develop, checkout to a new upgrade branch, recommended naming - "upgrade Sitefinity to version 15.x"
- Close Visual Studio (if open)
- Confirm no secrets, licenses, `.bacpac` files, or database backups are staged in git

### Run upgrade in Sitefinity CLI

- Run the Sitefinity CLI (sf.exe), from folder where you unzipped or copied it
- Example command:

```powershell
sf upgrade "{path to solution file to upgrade}" "{specific version to upgrade to}"
```

- Or, for automatic upgrade to latest version:

```powershell
sf upgrade "{path to solution file to upgrade}"
```

- If the project uses a custom NuGet config, provide it explicitly:

```powershell
sf upgrade "{path to solution file to upgrade}" "{specific version to upgrade to}" --nugetConfigPath "{path to NuGet.Config}"
```

- For more information, see link - <https://www.progress.com/documentation/sitefinity-cms/upgrade-using-sitefinity-cli>
- sf.exe will run, follow the prompts, and it will open Visual Studio to perform package upgrades
- Do not close the Visual Studio instance opened by the CLI while the upgrade is running
- Consider `--removeDeprecatedPackages` when you want the CLI to remove deprecated Sitefinity packages during the upgrade

### Replace license file

- Each version of Sitefinity requires a unique license file
- Download the .lic file from your Telerik account and save to:
  - SOLUTION_DIR/App_Data/Sitefinity/Sitefinity.lic

### Rebuild solution

- Clean solution
- Rebuild solution

### Run solution

- Run from VS, and Sitefinity will start the database upgrade process
- Watch the browser startup page and Visual Studio output, during the database upgrade
- Review upgrade logs in `SOLUTION_DIR/App_Data/Sitefinity/Logs`, especially `UpgradeTrace.log`
- If the site is monolingual and search is enabled, reindex frontend search indexes after the upgrade

### Sync branches

After you run and test on local, the recommended steps are:

- Merge or PR your upgrade branch to develop, run again and check for errors
- Push the updated develop to git / DevOps, the pipeline will run and Sitefinity will upgrade its database on dev
- Perform the same operation on main/master/prod, once testing, UAT and verification are complete on dev

## Upgrade validation checklist

Use the Sitefinity test plan as the broad QA checklist, then add these upgrade-specific checks:

- Sitefinity admin login works
- Dashboard loads without startup or licensing errors
- Frontend homepage loads
- Several high-value content pages load
- Page templates and layouts render correctly
- Custom widgets render and their designers/properties open in the backend
- Default widgets used by the site still work
- Forms submit and notifications still send
- Media libraries load and files resolve from the expected storage provider
- Search indexes rebuild and search returns expected results
- Scheduled tasks and background jobs run
- Navigation, redirects, canonical tags, and important 404 behavior still work
- Authentication, roles, and permissions still work for admins and editors
- Any third-party integrations still connect
- Azure DevOps pipeline succeeds
- App Service logs do not show repeated startup, binding, package, or database errors
- `UpgradeTrace.log` does not show unresolved upgrade failures
- QA or the project owner signs off before promoting to the next environment

## Rollback plan

Rollback must use the old code and old database together.

- Stop the App Service
- Redeploy the last known good code artifact, or swap back to the previous slot
- Point the connection string back to the pre-upgrade database
- Start the App Service
- Run smoke tests and confirm admin login
- Document why rollback happened before attempting another upgrade

## Testing and troubleshooting

After an upgrade (especially during major version upgrades), you might run into errors, if your Sitefinity project has custom code, and that custom code is referencing methods or classes that don't exist or have been changed in the new version. You'll need to trace any build errors and fix manually.

If you run into build errors after an upgrade, a common fix is to run Clean Solution again, then delete everything from SOLUTION_DIR/bin. Then rebuild the project from scratch

### Common troubleshooting checks

- Review `SOLUTION_DIR/App_Data/Sitefinity/Logs`
- Review `UpgradeTrace.log`
- Review Visual Studio build output
- Review Azure DevOps pipeline logs
- Review Azure App Service application and event logs
- Check browser console errors on affected frontend/admin pages
- Confirm the active connection string points to the expected database
- Confirm the deployed license file matches the upgraded Sitefinity version
- Confirm NuGet package versions are consistent across Sitefinity projects in the solution
- Rebuild search indexes after successful startup
