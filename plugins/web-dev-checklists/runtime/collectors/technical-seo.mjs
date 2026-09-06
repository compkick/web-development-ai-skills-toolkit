import { fetchTextPreview } from "./http-text.mjs";
import { pickHeaders } from "./headers.mjs";
import { truncate } from "../evidence/text.mjs";

export async function collectSeoEvidence({ page, requestedUrl, response, timeoutMs }) {
  const finalUrl = new URL(page.url());
  const responseHeaders = response ? await response.allHeaders() : {};
  const redirectChain = await summarizeNavigationChain(response);
  const documentSeo = await page.evaluate(() => {
    const cleanText = (value, maximumLength = 300) => {
      const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
      return normalized.length <= maximumLength ? normalized : `${normalized.slice(0, maximumLength - 1)}…`;
    };
    const resolveUrl = (value) => {
      try {
        return new URL(value, document.baseURI).href;
      } catch {
        return null;
      }
    };
    const canonicalElements = [...document.querySelectorAll("link[rel~='canonical']")].map((element) => {
      const href = element.getAttribute("href")?.trim() ?? "";
      const resolvedUrl = resolveUrl(href);
      return { absolute: /^https?:\/\//i.test(href), hasFragment: resolvedUrl ? new URL(resolvedUrl).hash.length > 0 : null, href: cleanText(href), resolvedUrl };
    });
    const alternateLanguages = [...document.querySelectorAll("link[rel~='alternate'][hreflang]")].slice(0, 50).map((element) => ({
      href: cleanText(element.getAttribute("href")),
      hreflang: cleanText(element.getAttribute("hreflang"), 80),
      resolvedUrl: resolveUrl(element.getAttribute("href"))
    }));
    const jsonLd = [...document.querySelectorAll("script[type='application/ld+json']")].map((element, index) => {
      try {
        const parsed = JSON.parse(element.textContent ?? "");
        const types = new Set();
        const visit = (value) => {
          if (Array.isArray(value)) return value.forEach(visit);
          if (!value || typeof value !== "object") return;
          const declaredTypes = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
          declaredTypes.filter((type) => typeof type === "string").forEach((type) => types.add(type));
          Object.values(value).forEach(visit);
        };
        visit(parsed);
        return { index, parsed: true, types: [...types].slice(0, 30) };
      } catch (error) {
        return { error: cleanText(error.message, 200), index, parsed: false, types: [] };
      }
    });
    const linkInventory = { crawlableHttp: 0, emptyHref: 0, internalHttp: 0, missingText: 0, nonHttp: 0, total: 0 };

    for (const anchor of document.querySelectorAll("a")) {
      linkInventory.total += 1;
      const href = anchor.getAttribute("href")?.trim() ?? "";
      const accessibleText = cleanText(anchor.textContent || anchor.getAttribute("aria-label") || anchor.querySelector("img")?.getAttribute("alt"));
      if (!accessibleText) linkInventory.missingText += 1;
      if (!href) {
        linkInventory.emptyHref += 1;
        continue;
      }
      const resolvedUrl = resolveUrl(href);
      if (!resolvedUrl || !new Set(["http:", "https:"]).has(new URL(resolvedUrl).protocol)) {
        linkInventory.nonHttp += 1;
        continue;
      }
      linkInventory.crawlableHttp += 1;
      if (new URL(resolvedUrl).origin === location.origin) linkInventory.internalHttp += 1;
    }

    const descriptions = [...document.querySelectorAll("meta[name='description' i]")].map((element) => cleanText(element.getAttribute("content"), 500));
    const robotsDirectives = [...document.querySelectorAll("meta[name='robots' i], meta[name='googlebot' i]")].map((element) => ({
      content: cleanText(element.getAttribute("content"), 300),
      name: cleanText(element.getAttribute("name"), 80).toLowerCase()
    }));
    const bodyText = cleanText(document.body?.innerText, 1000000);
    const mainText = cleanText(document.querySelector("main, [role='main']")?.innerText, 1000000);

    return {
      alternateLanguages,
      canonicalElements,
      content: { bodyTextLength: bodyText.length, mainTextLength: mainText.length },
      headings: { h1Count: document.querySelectorAll("h1").length, h1Text: [...document.querySelectorAll("h1")].slice(0, 5).map((heading) => cleanText(heading.textContent)) },
      htmlLanguage: cleanText(document.documentElement.lang, 80) || null,
      linkInventory,
      metaDescriptions: descriptions,
      metaRobots: robotsDirectives,
      structuredData: {
        jsonLd,
        jsonLdBlockCount: jsonLd.length,
        jsonLdParseErrorCount: jsonLd.filter((block) => !block.parsed).length,
        microdataItemCount: document.querySelectorAll("[itemscope]").length,
        rdfaTypeCount: document.querySelectorAll("[typeof]").length
      },
      titles: [...document.querySelectorAll("title")].map((element) => cleanText(element.textContent, 500))
    };
  });
  const robotsTxt = await probeRobotsTxt(finalUrl, timeoutMs);
  const sitemaps = await probeSitemaps(finalUrl, robotsTxt.sitemapUrls ?? [], timeoutMs);
  const httpCanonicalElements = parseHttpCanonicalLinks(responseHeaders.link, finalUrl);

  return {
    contentType: responseHeaders["content-type"] ?? null,
    document: documentSeo,
    finalUrl: finalUrl.href,
    httpCanonicalElements,
    requestedUrl,
    responseHeaders: pickHeaders(responseHeaders, ["link", "x-robots-tag"]),
    redirectChain,
    robotsTxt,
    sitemaps
  };
}

function parseHttpCanonicalLinks(linkHeader, baseUrl) {
  if (!linkHeader) return [];
  const canonicals = [];

  for (const match of linkHeader.matchAll(/<([^>]+)>\s*([^,]*)/g)) {
    if (!/(?:^|;)\s*rel\s*=\s*(?:"[^"]*\bcanonical\b[^"]*"|'[^']*\bcanonical\b[^']*'|canonical)(?:\s*;|\s*$)/i.test(match[2])) continue;
    const href = match[1].trim();
    let resolvedUrl = null;

    try {
      resolvedUrl = new URL(href, baseUrl).href;
    } catch {
      // Invalid canonical URLs are retained as null evidence.
    }

    canonicals.push({ absolute: /^https?:\/\//i.test(href), hasFragment: resolvedUrl ? new URL(resolvedUrl).hash.length > 0 : null, href: truncate(href, 300), resolvedUrl });
  }

  return canonicals;
}

async function summarizeNavigationChain(response) {
  const reversed = [];
  let request = response?.request() ?? null;

  while (request) {
    const requestResponse = await request.response();
    reversed.push({ status: requestResponse?.status() ?? null, url: request.url() });
    request = request.redirectedFrom();
  }

  return reversed.reverse();
}

async function probeRobotsTxt(finalUrl, timeoutMs) {
  const robotsUrl = new URL("/robots.txt", finalUrl.origin);

  try {
    const result = await fetchTextPreview(robotsUrl, timeoutMs, 512000, "robots.txt", "text/plain,*/*;q=0.8");
    const sitemapUrls = result.status === 200 ? [...result.text.matchAll(/^\s*sitemap\s*:\s*(\S+)\s*$/gim)].map((match) => match[1]).slice(0, 20) : [];
    return {
      allowDirectiveCount: result.status === 200 ? (result.text.match(/^\s*allow\s*:/gim) ?? []).length : 0,
      contentType: result.contentType,
      disallowDirectiveCount: result.status === 200 ? (result.text.match(/^\s*disallow\s*:/gim) ?? []).length : 0,
      finalUrl: result.finalUrl.href,
      found: result.status === 200,
      sitemapUrls,
      status: result.status,
      truncated: result.truncated,
      userAgentDirectiveCount: result.status === 200 ? (result.text.match(/^\s*user-agent\s*:/gim) ?? []).length : 0
    };
  } catch (error) {
    return { error: truncate(error.message, 300), found: false, sitemapUrls: [] };
  }
}

async function probeSitemaps(finalUrl, declaredSitemaps, timeoutMs) {
  const candidates = declaredSitemaps.length > 0 ? declaredSitemaps : [new URL("/sitemap.xml", finalUrl.origin).href];
  const results = [];

  for (const candidate of [...new Set(candidates)].slice(0, 3)) {
    let sitemapUrl;

    try {
      sitemapUrl = new URL(candidate, finalUrl.origin);
    } catch {
      results.push({ error: "The sitemap directive is not a valid URL.", url: truncate(candidate, 300) });
      continue;
    }

    if (sitemapUrl.origin !== finalUrl.origin) {
      results.push({ reason: "The sitemap is outside the authorized origin and was not requested.", status: "not-checked", url: sitemapUrl.href });
      continue;
    }

    try {
      const result = await fetchTextPreview(sitemapUrl, timeoutMs, 262144, "sitemap", "application/xml,text/xml,text/plain,*/*;q=0.5");
      const rootMatch = result.text.match(/<(urlset|sitemapindex)(?:\s|>)/i);
      const rootType = rootMatch?.[1]?.toLowerCase() ?? null;
      const locations = [...result.text.matchAll(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXmlText(match[1].trim())).slice(0, 5000);
      results.push({
        contentType: result.contentType,
        finalUrl: result.finalUrl.href,
        locationCountInPreview: locations.length,
        rootType,
        status: result.status,
        targetIncludedInPreview: rootType === "urlset" ? locations.includes(finalUrl.href) : null,
        truncated: result.truncated,
        url: sitemapUrl.href
      });
    } catch (error) {
      results.push({ error: truncate(error.message, 300), url: sitemapUrl.href });
    }
  }

  return results;
}

function decodeXmlText(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&apos;", "'");
}
