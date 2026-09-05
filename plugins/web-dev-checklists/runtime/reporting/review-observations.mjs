export function buildAxeReviewChecks(runtimeStatus, axeResult, artifacts) {
  const completed = runtimeStatus.status === "completed" && Boolean(axeResult);
  const checks = [{
    id: "automated-axe-scan",
    title: "The automated axe scan completed",
    status: completed ? "pass" : "not-checked",
    method: "axe",
    evidence: completed
      ? { incomplete: axeResult.incomplete.length, passes: axeResult.passes, violations: axeResult.violations.length }
      : { error: runtimeStatus.error ?? null, runtimeStatus: runtimeStatus.status },
    artifacts: completed ? artifacts : ["summary.json"]
  }];

  for (const violation of completed ? axeResult.violations : []) {
    checks.push({
      id: `axe-${violation.id}`,
      title: violation.help,
      status: "fail",
      method: "axe",
      evidence: { affectedNodes: violation.nodes.length, description: violation.description, helpUrl: violation.helpUrl, impact: violation.impact, ruleId: violation.id, tags: violation.tags },
      artifacts
    });
  }

  const rules = completed ? axeResult.incomplete.map((rule) => ({ ruleId: rule.id, title: rule.help, affectedNodes: rule.nodes.length })) : [];
  const affectedNodes = rules.reduce((total, rule) => total + rule.affectedNodes, 0);
  checks.push({
    id: "axe-manual-review",
    title: rules.length ? `Needs manual review: ${rules.length} axe rules (${affectedNodes} node results)` : "Axe has no unresolved manual-review results",
    status: !completed ? "not-checked" : rules.length ? "warning" : "pass",
    method: "axe",
    evidence: { affectedNodes, ruleCount: rules.length, rules, note: "Incomplete results need human review; they are not confirmed violations. Node results can overlap between rules." },
    artifacts: completed ? artifacts : ["summary.json"]
  });
  return checks;
}

export function assessContentSecurityPolicy(policy) {
  const concerns = [];
  // Each comma-separated enforced policy applies independently. Within a policy,
  // the browser uses the first occurrence of a directive and its CSP fallbacks.
  const policies = (policy ?? "").split(",").map((value) => {
    const directives = new Map();
    for (const part of value.split(";")) {
      const [name, ...sources] = part.trim().split(/\s+/);
      if (name && !directives.has(name.toLowerCase())) directives.set(name.toLowerCase(), sources);
    }
    return directives;
  });
  const scriptElementPolicyPresent = policies.some((directives) => ["script-src-elem", "script-src", "default-src"].some((name) => directives.has(name)));
  const scriptAttributePolicyPresent = policies.some((directives) => ["script-src-attr", "script-src", "default-src"].some((name) => directives.has(name)));

  if (policy) {
    if (!scriptElementPolicyPresent) concerns.push("No script-src-elem, script-src, or default-src directive restricts script loading.");
    if (!scriptAttributePolicyPresent) concerns.push("No script-src-attr, script-src, or default-src directive restricts inline event handlers.");
    if (policy.includes("'unsafe-eval'")) concerns.push("unsafe-eval");
    if (policy.includes("'unsafe-inline'") && !/nonce-|sha(256|384|512)-|'strict-dynamic'/.test(policy)) concerns.push("unsafe-inline without a nonce, hash, or strict-dynamic");
  } else concerns.push("No enforced Content Security Policy header was observed.");

  return { status: !policy || concerns.length ? "warning" : "pass", concerns, scriptElementPolicyPresent, scriptAttributePolicyPresent };
}

export function assessPublicCookies(cookies, protocol) {
  const observed = [...(cookies?.issued ?? []), ...(cookies?.accepted ?? [])];
  const concerns = new Set();
  for (const cookie of observed) {
    if (protocol === "https:" && !cookie.secure) concerns.add(`${cookie.name}: missing Secure`);
    if (cookie.sameSite?.toLowerCase() === "none" && !cookie.secure) concerns.add(`${cookie.name}: SameSite=None without Secure`);
  }
  return {
    status: concerns.size ? "warning" : observed.length ? "pass" : "informational",
    concerns: [...concerns],
    reviewNote: "Includes response-issued and browser-observed cookies. Review each cookie's purpose before assigning severity; cookies used by JavaScript do not automatically require HttpOnly."
  };
}
