# Website favicon setup guide

## Purpose

Set up the site icon for browser tabs and search results.

## Requirements

- Use the approved site icon, not a CMS or framework default.
- Use a square image. For Google Search, the minimum is 8 × 8 pixels; larger than 48 × 48 is recommended. A 96 × 96 PNG is a simple choice.
- Link the icon in the shared HTML `<head>` on every page. Match `type` and `sizes` to the file.
- Serve the image over HTTPS without requiring a login. Keep its URL stable.
- Allow the homepage and icon to be crawled when the production site should appear in search. Search display is not guaranteed.

## Examples

PNG:

```html
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">
```

SVG for browsers, with a PNG alternative for search compatibility:

```html
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">
<link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg">
```

An ICO file is also valid; declare its actual sizes. A root `/favicon.ico` fallback does not replace the explicit head link in this checklist.

In WordPress, set the Site Icon and check the generated head links. Add touch icons or manifest icons only when the project needs home-screen or installed-app support.

## Verify

- Open the icon URL: it must return the correct image, not an HTML error page.
- Check representative browser tabs, including light/dark themes. Use a fresh browser session if an old icon is cached.
- Recheck on the production domain after launch.

## References

- [Google Search favicon guidelines](https://developers.google.com/search/docs/appearance/favicon-in-search)
- [HTML icon declarations and browser selection](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel#icon)
- [Web app manifest icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons)

Last verified against official documentation: 2026-10-19.
