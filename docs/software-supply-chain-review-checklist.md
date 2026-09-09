# Software supply chain review checklist

## Purpose

Use this checklist to review the third-party code, tools, and services used to build and deliver a website. Scale the review to the project's risk and delivery model.

## Inventory and ownership

- [ ] Inventory application, development, build, container, CMS, plugin, theme, and infrastructure dependencies.
- [ ] Record why each important dependency is used and who maintains it.
- [ ] Identify unsupported, abandoned, duplicated, or unnecessary dependencies.
- [ ] Use an SBOM when the project, customer, or risk level calls for one.

## Sources and updates

- [ ] Get packages, plugins, themes, images, and tools from approved sources.
- [ ] Commit lockfiles and pin dependencies where reproducible builds require it.
- [ ] Review dependency changes before merging them.
- [ ] Define how security updates are found, tested, approved, and deployed.
- [ ] Remove dependencies and access that are no longer needed.

## Build and pipeline security

- [ ] Limit CI jobs, tokens, runners, caches, and service accounts to the access they need.
- [ ] Keep untrusted contributions away from secrets and deployment credentials.
- [ ] Pin or otherwise control third-party workflow actions, images, and build tools.
- [ ] Keep secrets, signing material, and production data out of build output and logs.
- [ ] Build releases from reviewed source and controlled inputs.

## Release integrity

- [ ] Produce a traceable release artifact and record its source revision.
- [ ] Promote the same approved artifact between environments when practical.
- [ ] Restrict who can publish packages, images, plugins, themes, or production releases.
- [ ] Sign or attest artifacts when the project's risk or customer requirements justify it.
- [ ] Keep enough build and release history to investigate a compromised release.

## Vulnerabilities and incidents

- [ ] Scan dependencies and build images for known vulnerabilities.
- [ ] Review findings for reachability, exposure, available fixes, and compensating controls.
- [ ] Assign owners and deadlines to unresolved material vulnerabilities.
- [ ] Document how to revoke credentials, remove a package, rebuild, and redeploy after a supply-chain incident.

## References

- [SLSA specification](https://slsa.dev/spec/v1.2/)
- [GitHub dependency review](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review)
- [CISA software bill of materials guidance](https://www.cisa.gov/sbom)

Last verified against official documentation: 2026-07-28.
