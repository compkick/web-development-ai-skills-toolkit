import { writeFile } from "node:fs/promises";
import path from "node:path";
import { AUDIT_USER_AGENT, FAVICON_REVIEW } from "../config/runtime-config.mjs";

// Read only declared same-origin assets. Decode as images in an isolated, network-blocked context.
export async function collectFaviconEvidence({ page, outputDirectory, timeoutMs }) {
  const target = new URL(page.url());
  const declarations = await page.evaluate(() => {
    const links = [...document.head.querySelectorAll("link")];
    const icons = links.filter((link) => /(?:^|\s)(?:icon|apple-touch-icon|apple-touch-icon-precomposed)(?:\s|$)/i.test(link.rel));
    return {
      icons: icons.slice(0, 100).map((link) => ({ kind: /apple-touch-icon/i.test(link.rel) ? "apple" : "favicon", hasHref: Boolean(link.getAttribute("href")?.trim()), url: link.getAttribute("href")?.trim() ? link.href : "", sizes: (link.getAttribute("sizes") ?? "").slice(0, 200), type: link.type.slice(0, 100), media: link.media.slice(0, 200) })),
      total: icons.length,
      manifest: links.find((link) => /(?:^|\s)manifest(?:\s|$)/i.test(link.rel))?.href ?? null
    };
  });
  const deadline = Date.now() + Math.min(timeoutMs, FAVICON_REVIEW.timeoutMs);
  const signal = AbortSignal.timeout(Math.max(1, deadline - Date.now()));
  const result = { pageUrl: publicUrl(target.href), declarations, icons: [], manifest: null, skippedByLimit: 0, limits: FAVICON_REVIEW };
  const candidates = [...declarations.icons];
  if (!candidates.some((icon) => icon.kind === "favicon")) candidates.unshift({ kind: "favicon", url: new URL("/favicon.ico", target).href, fallback: true, sizes: "", type: "", media: "" });
  if (declarations.manifest) {
    result.manifest = { url: publicUrl(declarations.manifest), status: "warning" };
    try {
      const resource = await fetchAsset(declarations.manifest, target, signal, "application/manifest+json,application/json");
      if (resource.status !== 200) throw new Error(`Manifest returned HTTP ${resource.status}.`);
      const manifest = JSON.parse(resource.bytes.toString("utf8"));
      if (!Array.isArray(manifest.icons) || !manifest.icons.length) throw new Error("Declared manifest has no app icons.");
      result.manifest.status = "pass";
      result.manifest.iconCount = manifest.icons.length;
      for (const icon of manifest.icons.slice(0, 100)) {
        let url = "";
        try { if (typeof icon.src === "string" && icon.src.trim()) url = new URL(icon.src, resource.url).href; } catch {}
        candidates.push({ kind: "app", url, sizes: typeof icon.sizes === "string" ? icon.sizes : "", type: typeof icon.type === "string" ? icon.type : "", media: "" });
      }
      result.skippedByLimit += Math.max(0, manifest.icons.length - 100);
    } catch (error) { result.manifest.note = safeError(error); }
  }
  // Round-robin the kinds so a long favicon list cannot starve declared touch/app icons.
  const groups = ["favicon", "apple", "app"].map((kind) => candidates.filter((icon) => icon.kind === kind));
  const selected = [];
  while (groups.some((group) => group.length) && selected.length < FAVICON_REVIEW.maximumIcons) {
    for (const group of groups) if (group.length && selected.length < FAVICON_REVIEW.maximumIcons) selected.push(group.shift());
  }
  result.skippedByLimit += Math.max(0, declarations.total - 100) + candidates.length - selected.length;
  const context = await page.context().browser().newContext({ serviceWorkers: "block" });
  try {
    await context.route("**/*", (route) => route.abort());
    const decoder = await context.newPage();
    for (const candidate of selected) {
      const icon = { ...candidate, url: publicUrl(candidate.url), status: "warning", notes: [] };
      result.icons.push(icon);
      try {
        if (Date.now() >= deadline) throw new Error("Favicon review reached its time limit.");
        const resource = await fetchAsset(candidate.url, target, signal);
        icon.httpStatus = resource.status;
        icon.finalUrl = publicUrl(resource.url);
        icon.contentType = resource.contentType;
        if (resource.status !== 200) throw new Error(`Icon returned HTTP ${resource.status}.`);
        const mime = imageMime(resource.bytes);
        if (!mime) throw new Error("Response is not a recognized icon image (it may be an HTML error page).");
        if (!/^image\//i.test(resource.contentType)) icon.notes.push("Server does not send an image Content-Type.");
        if (target.protocol === "https:" && new URL(resource.url).protocol !== "https:") icon.notes.push("Icon uses insecure HTTP on an HTTPS site.");
        const decoded = await decodeImage(decoder, resource.bytes, mime, Math.max(1, deadline - Date.now()));
        icon.width = decoded.width;
        icon.height = decoded.height;
        icon.format = mime;
        icon.availableSizes = icoSizes(resource.bytes, mime) ?? [{ width: icon.width, height: icon.height }];
        if (icon.width !== icon.height || icon.width < 8) icon.notes.push("Icon should be square and at least 8 × 8 pixels.");
        const declaredSizes = candidate.sizes.toLowerCase().split(/\s+/).filter((size) => /^\d+x\d+$/.test(size));
        if (declaredSizes.some((size) => !icon.availableSizes.some(({ width, height }) => size === `${width}x${height}`)) && mime !== "image/svg+xml") icon.notes.push("Declared sizes do not match the image dimensions.");
        if (candidate.type && candidate.type.toLowerCase() !== mime && !(mime === "image/x-icon" && /image\/(?:vnd.microsoft.icon|ico)/i.test(candidate.type))) icon.notes.push("Declared image type does not match the file format.");
        icon.preview = `favicon-preview-${result.icons.length}.png`;
        await writeFile(path.join(outputDirectory, icon.preview), Buffer.from(decoded.png.split(",")[1], "base64"));
        icon.status = icon.notes.length ? "warning" : "pass";
      } catch (error) { icon.notes.push(safeError(error)); }
    }
  } finally { await context.close(); }
  result.declarations = { ...declarations, manifest: declarations.manifest ? publicUrl(declarations.manifest) : null, icons: declarations.icons.map((icon) => ({ ...icon, url: publicUrl(icon.url) })) };
  return result;
}

async function fetchAsset(value, target, signal, accept = "image/*") {
  let url;
  try { url = new URL(value); } catch { throw new Error("Icon URL is empty or invalid."); }
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (url.origin !== target.origin || !["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Asset is outside the authorized origin or uses an unsupported URL; review manually.");
    const response = await fetch(url, { signal, redirect: "manual", headers: { accept, "user-agent": AUDIT_USER_AGENT } });
    if (response.status >= 300 && response.status < 400 && response.headers.has("location")) {
      await response.body?.cancel();
      url = new URL(response.headers.get("location"), url);
      continue;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (response.status !== 200) { await response.body?.cancel(); return { url: url.href, status: response.status, contentType, bytes: Buffer.alloc(0) }; }
    if (Number(response.headers.get("content-length")) > FAVICON_REVIEW.maximumBytes) { await response.body?.cancel(); throw new Error("Icon or manifest exceeds the byte limit."); }
    const chunks = [];
    let count = 0;
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { value: chunk, done } = await reader.read();
          if (done) break;
          count += chunk.length;
          if (count > FAVICON_REVIEW.maximumBytes) throw new Error("Icon or manifest exceeds the byte limit.");
          chunks.push(Buffer.from(chunk));
        }
      } finally { await reader.cancel().catch(() => {}); }
    }
    return { url: url.href, status: response.status, contentType, bytes: Buffer.concat(chunks) };
  }
  throw new Error("Icon or manifest exceeded three redirects.");
}

function imageMime(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.length >= 6 && bytes.readUInt32LE(0) === 0x00010000) return "image/x-icon";
  if (bytes.subarray(0, 3).toString() === "GIF") return "image/gif";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (/^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(bytes.toString("utf8"))) return "image/svg+xml";
  return null;
}

function icoSizes(bytes, mime) {
  if (mime !== "image/x-icon") return null;
  const count = bytes.readUInt16LE(4);
  if (!count || count > 256 || 6 + count * 16 > bytes.length) return null;
  return Array.from({ length: count }, (_, index) => ({ width: bytes[6 + index * 16] || 256, height: bytes[7 + index * 16] || 256 }));
}

async function decodeImage(page, bytes, mime, timeoutMs) {
  return page.evaluate(({ data, timeout }) => new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => { image.src = ""; reject(new Error("Icon decoding timed out.")); }, timeout);
    image.onerror = () => { clearTimeout(timer); reject(new Error("Browser could not decode the icon image.")); };
    image.onload = () => {
      clearTimeout(timer);
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (!width || !height || width > 16384 || height > 16384) { reject(new Error("Icon dimensions are empty or too large to preview.")); return; }
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 128;
      const scale = Math.min(128 / width, 128 / height);
      try {
        canvas.getContext("2d").drawImage(image, (128 - width * scale) / 2, (128 - height * scale) / 2, width * scale, height * scale);
        resolve({ width, height, png: canvas.toDataURL("image/png") });
      } catch { reject(new Error("Browser could not create a safe icon preview.")); }
    };
    image.src = data;
  }), { data: `data:${mime};base64,${bytes.toString("base64")}`, timeout: timeoutMs });
}

function publicUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return `${url.protocol}[not collected]`;
    url.username = url.password = "";
    for (const [key] of url.searchParams) if (/(?:access|auth|code|credential|key|password|secret|session|signature|token)/i.test(key)) url.searchParams.set(key, "[redacted]");
    return url.href.slice(0, 500);
  } catch { return "(empty or invalid URL)"; }
}

function safeError(error) {
  // Fetch/JSON errors can echo target URLs or manifest content; only expose our bounded diagnostic messages.
  return /^(?:Asset |Icon |Manifest |Declared manifest |Response |Browser |Favicon )/.test(error.message) ? error.message.slice(0, 250) : "Asset could not be fetched or parsed; review manually.";
}
