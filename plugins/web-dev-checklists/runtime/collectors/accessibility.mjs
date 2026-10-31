import AxeBuilder from "@axe-core/playwright";
import { AXE_REVIEW } from "../config/runtime-config.mjs";

export async function collectAccessibility(page) {
  // Tag selection also includes non-default, non-experimental rules such as target-size.
  const result = await new AxeBuilder({ page }).withTags([...AXE_REVIEW.tags]).analyze();
  const inventory = new Map();
  // One rule can pass for some nodes and fail for others; count each rule once.
  for (const outcome of ["violations", "incomplete", "passes", "inapplicable"]) {
    for (const rule of result[outcome]) {
      const entry = inventory.get(rule.id) ?? { id: rule.id, tags: rule.tags, outcomes: [] };
      entry.outcomes.push(outcome);
      inventory.set(rule.id, entry);
    }
  }
  const rules = [...inventory.values()].sort((left, right) => left.id.localeCompare(right.id));
  if (!rules.some((rule) => rule.tags.includes("wcag22aa"))) throw new Error("axe did not return any WCAG 2.2 AA rules.");
  return {
    ruleSelection: { standard: AXE_REVIEW.standard, tags: [...AXE_REVIEW.tags], rules },
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
