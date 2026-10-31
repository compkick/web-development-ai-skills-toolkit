import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// No patched braces release exists. See CONTRIBUTING.md for the usage assessment.
export const globException = Object.freeze({
  url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
  package: "braces",
  version: "3.0.3",
  expires: "2027-01-17",
  reason: "Development-only Markdown linting uses repository-controlled glob patterns, not input from audited websites."
});

export function assessAudit(report, lock, { allowDevelopmentException = false, now = Date.now() } = {}) {
  if (report?.auditReportVersion !== 2 || report.error || !report.vulnerabilities || !lock?.packages) throw new Error("Missing or unsupported npm audit/lockfile data.");
  const accepted = new Map();
  const blocking = new Map();
  const observations = new Map();
  const visit = (name, parents = []) => {
    const entry = report.vulnerabilities[name];
    if (!entry?.via?.length || parents.includes(name)) throw new Error(`Unresolved npm audit dependency: ${name}`);
    for (const advisory of entry.via) {
      if (typeof advisory === "string") { visit(advisory, [...parents, name]); continue; }
      if (!advisory?.url || !["info", "low", "moderate", "high", "critical"].includes(advisory.severity)) throw new Error("Unsupported npm advisory data.");
      const key = `${name}:${advisory.url}`;
      const excepted = allowDevelopmentException && name === globException.package && advisory.url === globException.url && advisory.severity === "high"
        && now < Date.parse(`${globException.expires}T00:00:00Z`)
        && entry.nodes?.length > 0 && entry.nodes.every((node) => lock.packages[node]?.version === globException.version && lock.packages[node]?.dev === true);
      const finding = { package: name, url: advisory.url, severity: advisory.severity };
      if (excepted) accepted.set(key, finding);
      else if (["high", "critical"].includes(advisory.severity)) blocking.set(key, finding);
      else observations.set(key, finding);
    }
  };
  for (const name of Object.keys(report.vulnerabilities)) visit(name);
  return { accepted: [...accepted.values()], blocking: [...blocking.values()], observations: [...observations.values()] };
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  let failed = false;
  for (const [label, directory, allowDevelopmentException] of [
    ["Repository development tools", root, true],
    ["Website audit runtime", path.join(root, "plugins/web-dev-checklists/runtime"), false]
  ]) {
    try {
      const invocation = process.env.npm_execpath
        ? [process.execPath, [process.env.npm_execpath, "audit", "--json"]]
        : process.platform === "win32" ? [process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm.cmd audit --json"]] : ["npm", ["audit", "--json"]];
      const command = spawnSync(invocation[0], invocation[1], { cwd: directory, encoding: "utf8", timeout: 60000, maxBuffer: 8 * 1024 * 1024, windowsHide: true });
      if (command.error || ![0, 1].includes(command.status)) throw new Error("npm audit could not complete.");
      const report = JSON.parse(command.stdout);
      const lock = JSON.parse(await readFile(path.join(directory, "package-lock.json"), "utf8"));
      const result = assessAudit(report, lock, { allowDevelopmentException });
      console.log(`${label}: ${result.blocking.length} blocking advisories; ${result.accepted.length} accepted advisory; ${result.observations.length} lower-severity advisories.`);
      for (const finding of result.accepted) console.warn(`ACCEPTED until ${globException.expires}: ${finding.url} (${globException.package}@${globException.version}, development only). ${globException.reason}`);
      for (const finding of [...result.blocking, ...result.observations]) console.log(`${finding.severity}: ${finding.package} — ${finding.url}`);
      failed ||= result.blocking.length > 0;
    } catch (error) { console.error(`${label}: ${error.message}`); failed = true; }
  }
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
