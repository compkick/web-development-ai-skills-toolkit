import { SCREENSHOT_READINESS } from "../config/runtime-config.mjs";

// Best-effort visual readiness, not a performance measurement or proof that every resource loaded.
export async function preparePageForScreenshot(page, settings = SCREENSHOT_READINESS) {
  const startedAt = Date.now();
  let loadState = "loaded";
  try {
    await page.waitForLoadState("load", { timeout: Math.min(settings.loadTimeoutMs, settings.timeoutMs) });
  } catch (error) {
    if (error.name !== "TimeoutError") throw error;
    loadState = "timed-out";
  }

  const result = await page.evaluate(async (options) => {
    const deadline = Date.now() + options.remainingMs;
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, Math.min(ms, deadline - Date.now()))));
    const pageHeight = () => Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
    let steps = 0;
    let reachedBottom = false;
    const decoded = new Map();

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    while (Date.now() < deadline && steps < options.maxScrollSteps) {
      const bottom = Math.max(0, pageHeight() - window.innerHeight);
      window.scrollTo({ top: Math.min(bottom, window.scrollY + Math.max(1, window.innerHeight * 0.8)), behavior: "instant" });
      steps += 1;
      await pause(options.scrollPauseMs);
      if (window.scrollY + window.innerHeight >= pageHeight() - 1) {
        reachedBottom = true;
        break;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    function imageState() {
      const counts = { total: 0, loaded: 0, pending: 0, failed: 0, missingSource: 0 };
      for (const image of document.images) {
        // Hidden carousel slides and unused responsive alternatives must not hold up the screenshot.
        if (!image.getClientRects().length || ["hidden", "collapse"].includes(getComputedStyle(image).visibility)) continue;
        counts.total += 1;
        const source = image.currentSrc || image.getAttribute("src") || image.getAttribute("srcset");
        if (!source) { counts.missingSource += 1; continue; }
        if (!image.complete) { counts.pending += 1; continue; }
        if (image.naturalWidth === 0) { counts.failed += 1; continue; }
        let entry = decoded.get(image);
        if (!entry || entry.source !== source) {
          entry = { source, status: "pending" };
          decoded.set(image, entry);
          image.decode().then(() => { entry.status = "loaded"; }, () => { entry.status = "failed"; });
        }
        counts[entry.status] += 1;
      }
      return counts;
    }

    let images = imageState();
    let fonts = document.fonts?.status ?? "loaded";
    let stableSince = Date.now();
    let previousState = "";
    let settled = false;
    while (Date.now() < deadline) {
      images = imageState();
      fonts = document.fonts?.status ?? "loaded";
      const state = JSON.stringify({ images, fonts, height: pageHeight() });
      if (state !== previousState || images.pending > 0 || fonts !== "loaded") stableSince = Date.now();
      previousState = state;
      if (Date.now() - stableSince >= options.settleMs) { settled = true; break; }
      await pause(100);
    }

    return {
      fonts,
      images: imageState(),
      scroll: { steps, reachedBottom, limitReached: !reachedBottom && steps >= options.maxScrollSteps },
      timedOut: !settled,
      // Describe the limits explicitly; missing or broken images are not "loaded".
      scope: "Rendered HTML images and document fonts; excludes hidden images, CSS background decoding, video, and content requiring interaction."
    };
  }, { ...settings, remainingMs: Math.max(0, settings.timeoutMs - (Date.now() - startedAt)) });

  return {
    status: loadState === "loaded" && !result.timedOut && result.scroll.reachedBottom && result.images.failed === 0 && result.images.missingSource === 0 ? "ready" : "incomplete",
    elapsedMs: Date.now() - startedAt,
    budgetMs: settings.timeoutMs,
    loadState,
    ...result
  };
}
