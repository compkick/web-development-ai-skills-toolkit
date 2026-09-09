export function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return new Set(["http:", "https:"]).has(url.protocol) ? escapeHtml(url.href) : "#";
  } catch {
    return "#";
  }
}

export function safeRelativePath(value) {
  const normalized = String(value ?? "").replaceAll("\\", "/");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..") || normalized.includes(":")) return null;
  return normalized.split("/").map(encodeURIComponent).join("/");
}

export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function formatLabel(value) {
  return String(value).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("-", " ");
}

export function coverageBadge(automation) {
  if (automation === "automated") return "pass";
  if (automation === "partial") return "warning";
  return "not-checked";
}

export function coverageLabel(automation) {
  return automation === "partial" ? "Partially automated" : automation.charAt(0).toUpperCase() + automation.slice(1);
}
