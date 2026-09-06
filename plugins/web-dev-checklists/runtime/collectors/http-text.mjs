import { AUDIT_USER_AGENT } from "../config/runtime-config.mjs";

// Both callers are same-origin, bounded reads. A preview may truncate; security.txt must be complete.
export async function fetchBoundedText(initialUrl, { timeoutMs, maximumBytes, resourceName, accept = "text/plain", overflow = "reject" }) {
  if (!["reject", "truncate"].includes(overflow)) throw new Error("Unknown text overflow policy.");
  const origin = new URL(initialUrl).origin;
  let currentUrl = new URL(initialUrl);

  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    const response = await fetch(currentUrl, { headers: { accept, "user-agent": AUDIT_USER_AGENT }, redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
    const location = response.headers.get("location");
    if (location && response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      const nextUrl = new URL(location, currentUrl);
      if (nextUrl.origin !== origin) throw new Error(`${resourceName} redirected outside the authorized origin.`);
      currentUrl = nextUrl;
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const result = { contentType, finalUrl: currentUrl, status: response.status, text: "", truncated: false };
    if (overflow === "reject" && Number(response.headers.get("content-length")) > maximumBytes) {
      await response.body?.cancel();
      throw new Error(`${resourceName} exceeds ${maximumBytes} bytes.`);
    }
    if (!response.body) return result;

    const reader = response.body.getReader();
    const chunks = [];
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const remaining = maximumBytes - totalBytes;
        if (value.byteLength > remaining && overflow === "reject") throw new Error(`${resourceName} exceeds ${maximumBytes} bytes.`);
        chunks.push(value.byteLength <= remaining ? value : value.slice(0, remaining));
        totalBytes += Math.min(value.byteLength, remaining);
        if (overflow === "truncate" && totalBytes === maximumBytes) {
          result.truncated = true;
          break;
        }
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    result.text = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
    return result;
  }
  throw new Error(`${resourceName} returned more than 5 redirects.`);
}

export function fetchTextPreview(initialUrl, timeoutMs, maximumBytes, resourceName, accept) {
  return fetchBoundedText(initialUrl, { timeoutMs, maximumBytes, resourceName, accept, overflow: "truncate" });
}
