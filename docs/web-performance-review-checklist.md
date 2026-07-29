# Web performance review checklist

## Purpose

Use this checklist to assess loading, responsiveness, visual stability, resource cost, caching, and capacity for representative website or web-application journeys. Combine controlled lab measurements with real-user field data when field data is available; neither source replaces the other.

The current Core Web Vitals good thresholds are a general baseline at the 75th percentile, segmented by mobile and desktop: Largest Contentful Paint at 2.5 seconds or less, Interaction to Next Paint at 200 milliseconds or less, and Cumulative Layout Shift at 0.1 or less. Project performance budgets may be stricter and should also cover business-critical outcomes.

Record scope, evidence, results, severity, remediation, ownership, dates, and exceptions using the [web review findings reference](web-review-findings-reference.md).

## Scope and measurement plan

- [ ] **Baseline requirement:** Record the environment, release, pages, templates, journeys, user segments, devices, networks, locations, authentication states, and cache states being evaluated.
- [ ] **Baseline requirement:** Define or confirm measurable budgets for user-centric timings, page weight, requests, JavaScript, images, fonts, third parties, and server or API latency appropriate to the project.
- [ ] **Baseline requirement:** Record the tools, versions, test configuration, run count, variability, and known limitations so results can be reproduced.
- [ ] **Conditional requirement:** Include logged-in, personalized, commerce, search, upload, data-heavy, international, and low-end-device journeys when they materially affect users.

## Field and lab evidence

- [ ] **Baseline requirement:** Review available real-user data by page or journey, device class, geography, and relevant user segment rather than relying only on an origin-wide average.
- [ ] **Baseline requirement:** Compare LCP, INP, and CLS at the 75th percentile against the current good thresholds and the project's stricter budgets, recording insufficient sample sizes explicitly.
- [ ] **Baseline requirement:** Run repeatable lab tests on representative mobile hardware or emulation and constrained networks with cold and warm caches as appropriate.
- [ ] **Baseline requirement:** Investigate material disagreement between lab and field data instead of selecting whichever result looks better.
- [ ] **Recommended:** Capture a before-change or previous-release baseline so regressions are distinguishable from longstanding limitations.

## Server, network, and delivery

- [ ] **Baseline requirement:** Review DNS, connection, TLS, redirect, Time to First Byte, backend, database, cache, and upstream dependency timing for slow critical pages and APIs.
- [ ] **Baseline requirement:** Verify text resources use appropriate compression and static resources use deliberate cache lifetimes, immutable versioning or cache busting, and tested invalidation.
- [ ] **Conditional requirement:** Verify CDN, edge, full-page, application, object, and browser caches improve intended traffic without caching private or incorrect responses.
- [ ] **Conditional requirement:** Verify HTTP protocol, connection reuse, preconnect, preload, prefetch, or priority hints are used only where measurements show benefit and do not create contention.
- [ ] **Conditional requirement:** Complete capacity, load, endurance, or spike testing when forecast traffic, shared infrastructure, autoscaling, queues, or contractual expectations create material risk.

## Loading and rendering

- [ ] **Baseline requirement:** Identify the LCP element on critical templates and verify its resource is discoverable promptly, appropriately prioritized, not accidentally lazy-loaded, and delivered at a suitable size.
- [ ] **Baseline requirement:** Review render-blocking styles, scripts, fonts, redirects, client-side rendering, and critical request chains that delay useful content.
- [ ] **Baseline requirement:** Verify responsive images use appropriate dimensions, formats, compression, `srcset` or `sizes` where useful, intrinsic dimensions, and lazy loading only below the initial viewport.
- [ ] **Baseline requirement:** Verify web fonts have justified families, weights, subsets, loading behavior, fallbacks, and caching without causing avoidable blocking or layout movement.
- [ ] **Baseline requirement:** Remove or defer unused and non-critical JavaScript and CSS and avoid shipping framework, polyfill, localization, or component code users do not need.

## Responsiveness and runtime

- [ ] **Baseline requirement:** Exercise representative interactions and identify long tasks, excessive event work, layout thrashing, synchronous storage, hydration, rendering, or third-party code that delays the next paint.
- [ ] **Baseline requirement:** Verify critical input provides prompt visual feedback and that expensive work is reduced, split, deferred, scheduled, or moved off the main thread where practical.
- [ ] **Baseline requirement:** Review bundle composition, duplicate dependencies, source-map analysis, route-level loading, memory growth, listener cleanup, and sustained interaction where relevant.
- [ ] **Conditional requirement:** Test slow APIs, timeouts, offline or unreliable networks, retries, and partial failures so performance degradation does not become an unusable or uncontrolled retry loop.

## Visual stability and third parties

- [ ] **Baseline requirement:** Verify images, embeds, ads, banners, consent tools, injected content, fonts, and asynchronous components reserve appropriate space and do not cause unexpected layout shifts.
- [ ] **Baseline requirement:** Verify animations use appropriate properties, avoid unnecessary main-thread work, and honor reduced-motion preferences.
- [ ] **Baseline requirement:** Inventory analytics, tag managers, advertising, chat, video, maps, experimentation, consent, and other third-party code and measure each material cost.
- [ ] **Baseline requirement:** Remove unused third parties, load remaining integrations only when needed and permitted, and define timeout or failure behavior for critical dependencies.

## Regression control and conclusion

- [ ] **Baseline requirement:** Run performance checks against the production build and configuration; do not accept development-mode or single-run results as release evidence.
- [ ] **Baseline requirement:** Add stable, meaningful budgets to CI or release monitoring where the signal is reliable enough to prevent regressions without routine false failures.
- [ ] **Baseline requirement:** Correlate production regressions with deployments, configuration, content, experiments, and third-party changes and assign an owner for field monitoring.
- [ ] **Baseline requirement:** Retest affected pages and journeys after remediation and record both the improvement and any tradeoffs to accessibility, correctness, security, or maintainability.

## References

- [Web Vitals](https://web.dev/articles/vitals)
- [How the Core Web Vitals thresholds were defined](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [Performance budgets 101](https://web.dev/articles/performance-budgets-101)
- [Chrome DevTools performance documentation](https://developer.chrome.com/docs/devtools/performance/)

Last verified against official documentation: 2026-07-25.
