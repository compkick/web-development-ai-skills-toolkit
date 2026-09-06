import { createEvidence, collectArtifacts } from "../evidence/package.mjs";
import { browserErrorsCheck } from "./browser.mjs";
import { assessHttpRedirect } from "../collectors/http-redirect.mjs";
import { assessContentSecurityPolicy, assessPublicCookies } from "../reporting/review-observations.mjs";

export async function buildSecurityEvidence(profileToUse, summary, securityResult, outputDirectory) {
  const checks = [];
  const finalUrl = new URL(summary.page.finalUrl);
  const headers = securityResult?.headers ?? {};
  const addCheck = (id, title, status, method, evidence, artifacts = ["security-results.json"]) => checks.push({ id, title, status, method, evidence, artifacts });
  const httpStatus = summary.page.httpStatus;

  addCheck("page-http-status", "Site returns a successful HTTP response", typeof httpStatus !== "number" ? "warning" : httpStatus >= 200 && httpStatus < 400 ? "pass" : "fail", "browser", { finalUrl: summary.page.finalUrl, httpStatus }, ["summary.json"]);

  if (!securityResult) {
    addCheck("security-collection", "Runner completes public security evidence collection", "not-checked", "browser", { error: summary.security?.error ?? null, runtimeStatus: summary.security?.status ?? "missing" }, ["summary.json"]);
  } else {
    addCheck("security-collection", "Runner completes public security evidence collection", "pass", "browser", { runtimeStatus: "completed" });
  }

  const certificate = securityResult?.certificate ?? null;
  addCheck("https-transport", "Site uses HTTPS", finalUrl.protocol === "https:" ? "pass" : "fail", "browser", { certificateObserved: certificate !== null, finalProtocol: finalUrl.protocol });

  if (certificate) {
    const now = Date.now();
    const validFrom = certificate.validFrom ? Date.parse(certificate.validFrom) : null;
    const validTo = certificate.validTo ? Date.parse(certificate.validTo) : null;
    const certificateDatesKnown = validFrom !== null && validTo !== null;
    const certificateCurrent = certificateDatesKnown && validFrom <= now && validTo >= now;
    addCheck("certificate-validity", "Site presents a currently valid HTTPS certificate", !certificateDatesKnown ? "warning" : certificateCurrent ? "pass" : "fail", "browser", certificate);
  } else {
    addCheck("certificate-validity", "Site presents a currently valid HTTPS certificate", "not-checked", "browser", { reason: finalUrl.protocol === "https:" ? "Certificate details were unavailable." : "The rendered page did not use HTTPS." });
  }

  const tlsBaseline = securityResult?.tlsBaseline ?? null;
  const negotiatedTls = tlsBaseline?.negotiated ?? null;
  const negotiatedTlsAccepted = negotiatedTls?.outcome === "accepted";
  const modernVersions = [tlsBaseline?.versions?.tls13, tlsBaseline?.versions?.tls12];
  const deprecatedVersions = [tlsBaseline?.versions?.tls11, tlsBaseline?.versions?.tls10];
  const supportsModernTls = modernVersions.some((result) => result?.outcome === "accepted");
  const modernTlsRejected = modernVersions.every((result) => result?.outcome === "rejected");
  const acceptsDeprecatedTls = deprecatedVersions.some((result) => result?.outcome === "accepted");
  const rejectsDeprecatedTls = deprecatedVersions.every((result) => result?.outcome === "rejected");

  addCheck("tls-cipher-suite", "Site negotiates a strong cipher suite", !tlsBaseline?.attempted || !negotiatedTlsAccepted ? "not-checked" : negotiatedTls.strongCipher ? "pass" : "fail", "tls", { cipher: negotiatedTls?.cipher ?? null, protocol: negotiatedTls?.protocol ?? null });
  addCheck("tls-forward-secrecy", "Site uses a forward-secret key exchange", !tlsBaseline?.attempted || !negotiatedTlsAccepted ? "not-checked" : negotiatedTls.forwardSecret ? "pass" : "fail", "tls", { cipher: negotiatedTls?.cipher ?? null, ephemeralKey: negotiatedTls?.ephemeralKey ?? null, protocol: negotiatedTls?.protocol ?? null });
  addCheck("tls-key-exchange-group", "Site negotiates an approved key-exchange group", !tlsBaseline?.attempted || !negotiatedTlsAccepted || negotiatedTls.approvedKeyExchangeGroup === null ? "not-checked" : negotiatedTls.approvedKeyExchangeGroup ? "pass" : "warning", "tls", { ephemeralKey: negotiatedTls?.ephemeralKey ?? null });
  addCheck("tls-supported-versions", "Site supports TLS 1.3 or TLS 1.2", !tlsBaseline?.attempted ? "not-checked" : supportsModernTls ? "pass" : modernTlsRejected ? "fail" : "not-checked", "tls", { tls12: tlsBaseline?.versions?.tls12 ?? null, tls13: tlsBaseline?.versions?.tls13 ?? null });
  addCheck("tls-deprecated-versions", "Site rejects TLS 1.0 and TLS 1.1", !tlsBaseline?.attempted ? "not-checked" : acceptsDeprecatedTls ? "fail" : rejectsDeprecatedTls ? "pass" : "not-checked", "tls", { tls10: tlsBaseline?.versions?.tls10 ?? null, tls11: tlsBaseline?.versions?.tls11 ?? null });

  const redirect = securityResult?.httpRedirect;
  const redirectAssessment = assessHttpRedirect(redirect);
  addCheck("http-to-https-redirect", "Site redirects plain HTTP to HTTPS", redirectAssessment.status, "http", { ...(redirect ?? { attempted: false }), assessment: redirectAssessment.reason });

  const insecureResourceCounts = securityResult?.document?.insecureResourceCounts ?? {};
  const insecureReferenceCount = Object.values(insecureResourceCounts).reduce((total, count) => total + count, 0) + (securityResult?.document?.insecureFormActionCount ?? 0);
  const insecureRequestCount = finalUrl.protocol === "https:" ? securityResult?.requestProtocolCounts?.http ?? 0 : 0;
  addCheck("insecure-page-resources", "Site uses HTTPS for rendered resources and form actions", !securityResult || finalUrl.protocol !== "https:" ? "not-checked" : insecureReferenceCount + insecureRequestCount === 0 ? "pass" : "fail", "browser", { insecureFormActionCount: securityResult?.document?.insecureFormActionCount ?? null, insecureRequestCount, insecureResourceCounts });

  const hsts = headers["strict-transport-security"] ?? null;
  const hstsMaxAge = hsts?.match(/(?:^|;)\s*max-age=(\d+)/i)?.[1] ?? null;
  addCheck("strict-transport-security", "Site presents an active HSTS policy", !securityResult || finalUrl.protocol !== "https:" ? "not-checked" : hstsMaxAge && Number(hstsMaxAge) > 0 ? "pass" : "warning", "browser", { header: hsts, maxAge: hstsMaxAge === null ? null : Number(hstsMaxAge) });

  const csp = headers["content-security-policy"] ?? null;
  const cspAssessment = assessContentSecurityPolicy(csp);
  addCheck("content-security-policy", "Site includes an enforced Content Security Policy", !securityResult ? "not-checked" : cspAssessment.status, "browser", { concerns: cspAssessment.concerns, enforcedPolicy: csp, reportOnlyPolicy: headers["content-security-policy-report-only"] ?? null, scriptElementPolicyPresent: cspAssessment.scriptElementPolicyPresent, scriptAttributePolicyPresent: cspAssessment.scriptAttributePolicyPresent, reviewNote: "Framing protection is assessed separately. Missing script restrictions may be an intentional choice; record the tradeoff after review. This check is not a complete CSP validation." });

  const frameAncestors = csp?.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i)?.[1]?.trim() ?? null;
  const xFrameOptions = headers["x-frame-options"] ?? null;
  const framingRestricted = frameAncestors !== null && frameAncestors !== "*" || /^(DENY|SAMEORIGIN)$/i.test(xFrameOptions ?? "");
  addCheck("framing-protection", "Site restricts framing", !securityResult ? "not-checked" : framingRestricted ? "pass" : "warning", "browser", { frameAncestors, xFrameOptions });

  const contentTypeOptions = headers["x-content-type-options"] ?? null;
  addCheck("content-type-protection", "Site prevents content-type sniffing", !securityResult ? "not-checked" : contentTypeOptions?.toLowerCase() === "nosniff" ? "pass" : "warning", "browser", { xContentTypeOptions: contentTypeOptions });

  const referrerPolicy = headers["referrer-policy"] ?? null;
  addCheck("referrer-policy", "Site sends an explicit Referrer-Policy header", !securityResult ? "not-checked" : referrerPolicy === null ? "informational" : referrerPolicy.toLowerCase().includes("unsafe-url") ? "warning" : "pass", "browser", { referrerPolicy });

  const issuedCookies = securityResult?.cookies?.issued ?? [];
  const cookieAssessment = assessPublicCookies(securityResult?.cookies, finalUrl.protocol);
  addCheck("public-cookie-flags", "Site protects public cookies with appropriate attributes", !securityResult ? "not-checked" : cookieAssessment.status, "browser", { accepted: securityResult?.cookies?.accepted ?? [], concerns: cookieAssessment.concerns, issued: issuedCookies, reviewNote: cookieAssessment.reviewNote });

  const cors = securityResult?.cors ?? {};
  const corsInvalid = cors["access-control-allow-origin"] === "*" && cors["access-control-allow-credentials"]?.toLowerCase() === "true";
  addCheck("cors-policy", "Site avoids unsafe wildcard CORS with credentials", !securityResult ? "not-checked" : corsInvalid ? "warning" : "informational", "browser", { headers: cors, invalidWildcardWithCredentials: corsInvalid });

  const disclosureHeaders = Object.fromEntries(["server", "x-powered-by", "x-aspnet-version", "x-xss-protection"].filter((name) => headers[name] !== undefined).map((name) => [name, headers[name]]));
  const disclosureConcerns = [];

  if (headers["x-powered-by"]) disclosureConcerns.push("x-powered-by is exposed");
  if (headers["x-aspnet-version"]) disclosureConcerns.push("x-aspnet-version is exposed");
  if (/\d/.test(headers.server ?? "")) disclosureConcerns.push("server appears to expose a version");
  if (headers["x-xss-protection"] && headers["x-xss-protection"] !== "0") disclosureConcerns.push("deprecated x-xss-protection is enabled");
  addCheck("response-disclosure", "Site avoids disclosing unnecessary server details", !securityResult ? "not-checked" : disclosureConcerns.length > 0 ? "warning" : "pass", "browser", { concerns: disclosureConcerns, headers: disclosureHeaders });

  const securityTxt = securityResult?.securityTxt ?? null;
  addCheck("security-txt", "Site publishes a valid security.txt file", !securityResult ? "not-checked" : securityTxt?.valid ? "pass" : securityTxt?.found ? "warning" : "informational", "http", securityTxt ?? { found: false });

  checks.push(browserErrorsCheck(summary, "Site loads without browser console or page errors"));

  const artifactDefinitions = [
    ["summary.json", "Low-level browser and collector summary"],
    ["page.png", "Full-page rendered screenshot"],
    ["security-results.json", "Reduced public transport, header, cookie, and disclosure evidence"],
    ["browser-errors.json", "Opt-in truncated browser error details"]
  ];
  const artifacts = await collectArtifacts(outputDirectory, artifactDefinitions);

  return createEvidence(profileToUse, summary, {
    checks,
    artifacts,
    limitations: [
      "This package covers one public URL and does not prove whole-site or whole-application security.",
      "No injection payloads, authentication attempts, endpoint enumeration, port scans, form submissions, or vulnerability exploitation were performed.",
      "The runner performs bounded TLS version handshakes and evaluates the normally negotiated cipher and key exchange; it does not enumerate every accepted cipher suite or test server cipher preference.",
      "Headers, cookies, and browser observations require application context and do not prove that source code, authorization, authenticated workflows, or operational controls are secure.",
      "The HTTP redirect and security.txt probes are limited to the authorized hostname or origin."
    ]
  });
}
