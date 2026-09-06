

export function summarizeAxe(result) {
  return {
    incomplete: result.incomplete.map(summarizeAxeRule),
    passes: result.passes.length,
    testEngine: result.testEngine,
    testEnvironment: result.testEnvironment,
    testRunner: result.testRunner,
    timestamp: result.timestamp,
    url: result.url,
    violations: result.violations.map(summarizeAxeRule)
  };
}

function summarizeAxeRule(rule) {
  return {
    description: rule.description,
    help: rule.help,
    helpUrl: rule.helpUrl,
    id: rule.id,
    impact: rule.impact,
    nodes: rule.nodes.map((node) => ({ failureSummary: node.failureSummary, impact: node.impact, target: node.target })),
    tags: rule.tags
  };
}
