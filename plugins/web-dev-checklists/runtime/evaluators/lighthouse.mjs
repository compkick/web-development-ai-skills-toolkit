export function lighthouseAuditStatus(audits) {
  if (!audits.some(Boolean)) return "not-checked";
  const scoredAudits = audits.filter((audit) => typeof audit?.score === "number" && !new Set(["informative", "manual", "notApplicable"]).has(audit.scoreDisplayMode));
  if (scoredAudits.some((audit) => audit.score < 0.9)) return "warning";
  return scoredAudits.length > 0 ? "pass" : "informational";
}

export function summarizeLighthouseAudit(audit) {
  if (!audit) return null;
  return {
    displayValue: audit.displayValue ?? null,
    id: audit.id,
    numericUnit: audit.numericUnit ?? null,
    numericValue: typeof audit.numericValue === "number" ? audit.numericValue : null,
    score: typeof audit.score === "number" ? audit.score : null,
    scoreDisplayMode: audit.scoreDisplayMode,
    title: audit.title
  };
}
