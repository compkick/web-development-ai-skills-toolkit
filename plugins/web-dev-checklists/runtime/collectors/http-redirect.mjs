import { AUDIT_USER_AGENT } from "../config/runtime-config.mjs";

export async function probeHttpRedirect(requestedUrl, timeoutMs, userAgent = AUDIT_USER_AGENT) {
  const targetUrl = new URL(requestedUrl);

  if (targetUrl.protocol !== "https:") return { attempted: false, reason: "The supplied URL is not HTTPS." };

  const initialHttpUrl = new URL(targetUrl);
  initialHttpUrl.protocol = "http:";
  const seen = new Set();
  const chain = [];
  let currentUrl = initialHttpUrl;

  try {
    for (let redirectCount = 0; redirectCount <= 10; redirectCount += 1) {
      const currentKey = currentUrl.href;

      if (seen.has(currentKey)) return { attempted: true, chain, error: "Redirect loop detected." };
      seen.add(currentKey);

      const response = await fetch(currentUrl, {
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "user-agent": userAgent
        },
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs)
      });
      await response.body?.cancel();
      const location = response.headers.get("location");
      const entry = { host: currentUrl.host, protocol: currentUrl.protocol, status: response.status };

      if (location) {
        const nextUrl = new URL(location, currentUrl);
        entry.locationHost = nextUrl.host;
        entry.locationProtocol = nextUrl.protocol;
        chain.push(entry);

        if (nextUrl.hostname !== targetUrl.hostname) return { attempted: true, chain, error: "Redirect left the authorized hostname." };
        currentUrl = nextUrl;
        continue;
      }

      chain.push(entry);
      return { attempted: true, chain, finalHost: currentUrl.host, finalProtocol: currentUrl.protocol, finalStatus: response.status };
    }

    return { attempted: true, chain, error: "More than 10 redirects were returned." };
  } catch (error) {
    return { attempted: true, chain, error: truncate(error.message, 300) };
  }
}

export function assessHttpRedirect(result) {
  if (!result?.attempted) return { reason: result?.reason ?? "The redirect probe was not attempted.", status: "not-checked" };

  const normalizedError = result.error?.toLowerCase() ?? "";

  if (normalizedError.includes("loop") || normalizedError.includes("more than 10")) {
    return { reason: result.error, status: "fail" };
  }

  if (result.error) return { reason: result.error, status: "warning" };

  const firstResponse = result.chain?.[0];
  const firstResponseRedirects = firstResponse?.status >= 300 && firstResponse.status < 400 && firstResponse.locationProtocol;

  if (firstResponseRedirects && result.finalProtocol === "https:") {
    return { reason: "The plain HTTP request redirected to HTTPS.", status: "pass" };
  }

  if (firstResponseRedirects || result.finalProtocol === "http:" && result.finalStatus >= 200 && result.finalStatus < 300) {
    return { reason: "The plain HTTP request did not finish on HTTPS.", status: "fail" };
  }

  if (result.finalStatus >= 400) {
    return { reason: `The plain HTTP probe returned ${result.finalStatus} without a redirect, so the browser-facing redirect could not be confirmed.`, status: "warning" };
  }

  return { reason: "The plain HTTP redirect could not be confirmed.", status: "warning" };
}

function truncate(value, maximumLength) {
  if (value.length <= maximumLength) return value;
  return `${value.slice(0, maximumLength - 1)}…`;
}
