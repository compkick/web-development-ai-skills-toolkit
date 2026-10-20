export function faviconChecks(result) {
  const icons = result?.icons ?? [];
  const favicons = icons.filter((icon) => icon.kind === "favicon");
  const loaded = favicons.filter((icon) => icon.width > 0);
  const declared = result?.declarations?.icons?.some((icon) => icon.kind === "favicon" && icon.hasHref);
  const suitable = loaded.some((icon) => icon.availableSizes.some(({ width, height }) => width === height && width >= 8));
  const largeRaster = loaded.some((icon) => icon.format !== "image/svg+xml" && icon.availableSizes.some(({ width, height }) => width === height && width > 48));
  const extras = icons.filter((icon) => icon.kind !== "favicon");
  const inappropriateUrls = icons.filter((icon) => !/^https?:/.test(icon.url) || /^https:/.test(result?.pageUrl ?? "") && [icon.url, icon.finalUrl].some((url) => /^http:/.test(url ?? "")));
  const artifacts = ["launch-results.json", ...icons.map((icon) => icon.preview).filter(Boolean)];
  const check = (id, title, status, evidence) => ({ id, title, status, method: "browser", evidence, artifacts });
  return [
    check("favicon-declaration", "Site links its favicon in the document head", declared ? "pass" : "warning", { declared: Boolean(declared), fallbackUsed: icons.some((icon) => icon.fallback), note: "Use <link rel=\"icon\" href=\"…\"> in the shared document head; a working /favicon.ico fallback alone does not establish this best practice." }),
    check("favicon-load", "Site provides a loadable favicon image", loaded.length && loaded.length === favicons.length && !result?.skippedByLimit ? "pass" : "warning", { icons: favicons, skippedByLimit: result?.skippedByLimit ?? 0, error: result?.error ?? null, note: "Cross-origin, unsupported, timed-out, or over-limit assets need manual review; they are not confirmed broken." }),
    check("favicon-dimensions", "Site provides a square favicon with suitable resolution", suitable && largeRaster && !loaded.some((icon) => icon.notes.length) ? "pass" : "warning", { squareImageAvailable: suitable, largerRasterAvailable: largeRaster, sizes: loaded.map((icon) => ({ url: icon.url, format: icon.format, availableSizes: icon.availableSizes, notes: icon.notes })), note: "Browser icons and Google Search have different requirements. Google requires at least 8 × 8 and recommends larger than 48 × 48; a smaller working browser icon is a recommendation warning, not a launch blocker. SVG browser support alone does not establish Google Search compatibility." }),
    check("favicon-urls", "Site uses appropriate favicon and app-icon URLs", icons.length && !inappropriateUrls.length ? "pass" : "warning", { urls: icons.map((icon) => ({ url: icon.url, finalUrl: icon.finalUrl ?? null })), note: "Checks declared URLs and observed redirects; assets outside the authorized origin are not fetched." }),
    check("favicon-app-icons", "Site's declared touch and app icons are usable", result?.manifest?.status === "warning" || extras.some((icon) => icon.status !== "pass") ? "warning" : extras.length ? "pass" : "informational", { icons: extras, manifest: result?.manifest ?? null, note: "Touch and installed-app icons are conditional. Their absence on an ordinary website is not a failure; test the relevant device experience when required." })
  ];
}
