export function browserErrorsCheck(summary, title) {
  const errors = summary.page.browserErrors;
  return {
    id: "browser-errors", title,
    status: errors.consoleErrorCount + errors.pageErrorCount === 0 ? "pass" : "warning",
    method: "browser",
    evidence: { consoleErrorCount: errors.consoleErrorCount, detailsIncluded: errors.detailsFile !== null, pageErrorCount: errors.pageErrorCount },
    artifacts: errors.detailsFile ? ["summary.json", errors.detailsFile] : ["summary.json"]
  };
}
