# Web performance review checklist

## Purpose

Use this checklist to find performance problems that affect real users and important tasks. Test representative pages, devices, networks, and user states instead of chasing a perfect score.

The current Core Web Vitals good thresholds are LCP at 2.5 seconds or less, INP at 200 milliseconds or less, and CLS at 0.1 or less at the 75th percentile. Project budgets may be stricter.

## Prepare

- [ ] Choose the pages, workflows, devices, networks, locations, and user states to test.
- [ ] Record the release, test setup, performance budgets, and most important user outcomes.
- [ ] Use production data from real users when it is available and reliable.

## Measure

- [ ] Review LCP, INP, and CLS for mobile and desktop and note when real-user data is insufficient.
- [ ] Run repeatable tests against a production build and compare them with the current baseline.
- [ ] Test both warm and cold cache behavior when it matters.

## Loading and rendering

- [ ] Check server response time, redirects, caching, compression, and CDN behavior.
- [ ] Resize and encode images for how they are displayed.
- [ ] Load the main page content and LCP resource promptly.
- [ ] Remove or delay code and assets that block rendering or are not needed.
- [ ] Confirm personalized or private responses are not cached publicly.

## Interaction and stability

- [ ] Test important interactions, find long tasks, and give users prompt feedback.
- [ ] Prevent unexpected layout shifts and keep animations efficient.

## Third parties and failures

- [ ] Inventory analytics, tag managers, chat, video, maps, ads, and other third-party code.
- [ ] Remove unused third parties and test important dependencies when they are slow or unavailable.
- [ ] Confirm performance problems do not create unusable pages or endless retries.

## Finish the review

- [ ] Investigate meaningful regressions rather than treating every score change as a failure.
- [ ] Retest fixes, note important tradeoffs, and assign an owner for monitoring production performance.

## References

- [Web Vitals](https://web.dev/articles/vitals)
- [How the Core Web Vitals thresholds were defined](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [Performance budgets 101](https://web.dev/articles/performance-budgets-101)
- [Chrome DevTools performance documentation](https://developer.chrome.com/docs/devtools/performance/)

Last verified against official documentation: 2026-07-28.
