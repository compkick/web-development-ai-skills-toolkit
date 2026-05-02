# Upgrading Sitefinity to new version in CI/CD environment

Instructions for upgrading a single Sitefinity instance with an Azure DevOps / App Service setup. Assumes Azure app service deployment, with develop and main branches in repository. Assumes you have permissions to all necessary servers and resources.

## Notes

A Sitefinity upgrade happens once to the code, on a single branch. Then the new code mutates (upgrades) the database separately for each environment when it first runs.

**Start Visual Studio in "admin" mode**

For file system and Sitefinity libraries, ensure no files are stored directly on app service file system. These could be lost as part of the upgrade.

## Database recommendations

For fast exports on large databases, you can temporarily increase the database performance tier. Before you start the backup, increase DTUs or the service level, run export, then set it back to the typical level for that client / project.  

## Upgrade steps

### Sitefinity CLI

- Install and/or update the Sitefinity CLI
- You can add this on path, or just run directly via terminal from the containing folder

### Export and restore database

- Export the production database, download and restore on your local
- Easiest path: Use Azure SQL server "export" tool, to copy .bacpac to client storage account

### Code prep

- Checkout to develop branch
- Make sure your local git is current (fetch and pull, for develop and main)
- Optional - Create backup branch, name like pre-upgrade "version 14.x"
- **Important:** Verify that the database connection string points to your local dev database
- From develop, checkout to a new upgrade branch, recommended naming - "upgrade Sitefinity to version 15.x"
- Close Visual Studio (if open)

### Run sf.exe

- Run the Sitefinity CLI, from folder where you unzipped or copied it
- Example command:

`
sf - upgrade
sf upgrade "{path to solution file to upgrade}" "{specific version to upgrade to}"
`

- Or, for automatic upgrade to latest version:

`
sf upgrade "{path to solution file to upgrade}"
`

- For more information, see link - <https://www.progress.com/documentation/sitefinity-cms/upgrade-using-sitefinity-cli>
- sf.exe will run, follow the prompts, and it will open Visual Studio to perform package upgrades

### Replace license file

- Each version of Sitefinity requires a unique license file
- Download the .lic file from your Telerik account and save to:
  - SOLUTION_DIR/App_Data/Sitefinity/Sitefinity.lic

### Rebuild solution

- Clean solution
- Rebuild solution
- Run from VS, and Sitefinity will start the database upgrade process

### Sync branches

After you run and test on local, the recommended steps are:

- Merge or PR your upgrade branch to develop, run again and check for errors
- Push the updated develop to git / DevOps, the pipeline will run and Sitefinity will upgrade its database on dev
- Perform the same operation on main/master/prod, once testing, UAT and verification are complete on dev

## Testing and troubleshooting

After an upgrade (especially during major version upgrades), you might run into errors, if your Sitefinity project has custom code, and that custom code is referencing methods or classes that don't exist or have been changed in the new version. You'll need to trace any build errors and fix manually.

If you run into build errors after an upgrade, a common fix is to run Clean Solution again, then delete everything from SOLUTION_DIR/bin. Then rebuild the project from scratch
