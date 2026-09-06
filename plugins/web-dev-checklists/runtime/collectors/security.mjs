import { collectTlsBaseline } from "./tls-baseline.mjs";
import { fetchBoundedText } from "./http-text.mjs";
import { pickHeaders } from "./headers.mjs";
import { truncate } from "../evidence/text.mjs";

export async function collectSecurityEvidence({ context, page, requestProtocolCounts, requestedUrl, response, timeoutMs, sharedHttpRedirect }) {
  const finalUrl = new URL(page.url());
  const responseHeaders = response ? await response.allHeaders() : {};
  const responseHeaderEntries = response ? await response.headersArray() : [];
  const securityDetails = response ? await response.securityDetails() : null;
  const navigationProtocol = await page.evaluate(() => performance.getEntriesByType("navigation")[0]?.nextHopProtocol || null);
  const documentSecurity = await page.evaluate(() => {
    const insecureResourceCounts = {};
    const resourceSelectors = [
      ["audio", "src"],
      ["embed", "src"],
      ["iframe", "src"],
      ["img", "src"],
      ["link[rel~='stylesheet']", "href"],
      ["link[rel~='preload']", "href"],
      ["link[rel~='modulepreload']", "href"],
      ["link[rel~='icon']", "href"],
      ["object", "data"],
      ["script", "src"],
      ["source", "src"],
      ["video", "src"]
    ];

    for (const [selector, attribute] of resourceSelectors) {
      for (const element of document.querySelectorAll(`${selector}[${attribute}]`)) {
        try {
          if (new URL(element.getAttribute(attribute), document.baseURI).protocol === "http:") insecureResourceCounts[selector] = (insecureResourceCounts[selector] ?? 0) + 1;
        } catch {
          // Invalid URLs are outside this transport-only observation.
        }
      }
    }

    let insecureFormActionCount = 0;

    for (const form of document.forms) {
      try {
        if (new URL(form.getAttribute("action") || document.URL, document.baseURI).protocol === "http:") insecureFormActionCount += 1;
      } catch {
        // Invalid form actions are outside this transport-only observation.
      }
    }

    return {
      formCount: document.forms.length,
      insecureFormActionCount,
      insecureResourceCounts,
      passwordFieldCount: document.querySelectorAll("input[type='password']").length
    };
  });
  const contextCookies = (await context.cookies(page.url())).map((cookie) => ({
    domain: cookie.domain,
    expires: cookie.expires,
    httpOnly: cookie.httpOnly,
    name: cookie.name,
    path: cookie.path,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    session: cookie.expires === -1
  }));
  const [httpRedirect, securityTxt, tlsBaseline] = await Promise.all([
    sharedHttpRedirect(),
    probeSecurityTxt(finalUrl, timeoutMs),
    collectTlsBaseline(finalUrl, timeoutMs)
  ]);

  return {
    certificate: securityDetails ? {
      issuer: securityDetails.issuer ?? null,
      protocol: securityDetails.protocol ?? null,
      subjectName: securityDetails.subjectName ?? null,
      validFrom: toIsoDate(securityDetails.validFrom),
      validTo: toIsoDate(securityDetails.validTo)
    } : null,
    cookies: {
      accepted: contextCookies,
      issued: responseHeaderEntries.filter((header) => header.name.toLowerCase() === "set-cookie").map((header) => summarizeSetCookie(header.value))
    },
    cors: pickHeaders(responseHeaders, ["access-control-allow-credentials", "access-control-allow-headers", "access-control-allow-methods", "access-control-allow-origin"]),
    document: documentSecurity,
    finalUrl: finalUrl.href,
    headers: pickHeaders(responseHeaders, ["cache-control", "content-security-policy", "content-security-policy-report-only", "content-type", "permissions-policy", "referrer-policy", "server", "strict-transport-security", "x-aspnet-version", "x-content-type-options", "x-frame-options", "x-powered-by", "x-xss-protection"]),
    httpRedirect,
    navigationProtocol,
    requestProtocolCounts,
    securityTxt,
    tlsBaseline
  };
}

async function probeSecurityTxt(finalUrl, timeoutMs) {
  if (finalUrl.protocol !== "https:") {
    return { found: false, reason: "security.txt is defined for an HTTPS origin.", transportSecure: false };
  }

  const securityTxtUrl = new URL("/.well-known/security.txt", finalUrl.origin);

  try {
    const result = await fetchBoundedText(securityTxtUrl, { timeoutMs, maximumBytes: 131072, resourceName: "security.txt", overflow: "reject" });

    if (result.status !== 200) return { contentType: result.contentType, finalHost: result.finalUrl.host, finalStatus: result.status, found: false, transportSecure: true };

    const fields = result.text.split(/\r?\n/).map((line) => line.match(/^([A-Za-z][A-Za-z0-9-]*):\s*(.+)$/)).filter(Boolean).map((match) => ({ name: match[1].toLowerCase(), value: match[2].trim() }));
    const contactCount = fields.filter((field) => field.name === "contact").length;
    const expiresField = fields.find((field) => field.name === "expires")?.value ?? null;
    const expiresAt = expiresField && !Number.isNaN(Date.parse(expiresField)) ? new Date(expiresField).toISOString() : null;
    const contentTypeValid = result.contentType.toLowerCase().startsWith("text/plain");
    const current = expiresAt !== null && new Date(expiresAt).getTime() > Date.now();

    return { contactCount, contentType: result.contentType, contentTypeValid, current, expiresAt, finalHost: result.finalUrl.host, finalStatus: result.status, found: true, transportSecure: true, valid: contactCount > 0 && contentTypeValid && current };
  } catch (error) {
    return { error: truncate(error.message, 300), found: false, transportSecure: true };
  }
}

function summarizeSetCookie(value) {
  const segments = value.split(";").map((segment) => segment.trim());
  const name = segments.shift()?.split("=", 1)[0] || "unnamed";
  const attributeNames = segments.map((segment) => segment.split("=", 1)[0].toLowerCase());
  const sameSiteSegment = segments.find((segment) => segment.toLowerCase().startsWith("samesite="));

  return {
    httpOnly: attributeNames.includes("httponly"),
    name,
    sameSite: sameSiteSegment ? sameSiteSegment.slice(sameSiteSegment.indexOf("=") + 1) : null,
    secure: attributeNames.includes("secure")
  };
}

function toIsoDate(unixSeconds) {
  return typeof unixSeconds === "number" && unixSeconds > 0 ? new Date(unixSeconds * 1000).toISOString() : null;
}
