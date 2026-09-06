import path from "node:path";

export function parseArguments(argumentsToParse) {
  const optionsToReturn = {
    allowNoSandbox: false,
    browser: "auto",
    collectLaunch: false,
    collectSecurity: false,
    collectSeo: false,
    includeErrorDetails: false,
    outputDirectory: null,
    skipAccessibility: false,
    skipLighthouse: false,
    timeoutMs: 45000,
    url: null
  };

  for (let index = 0; index < argumentsToParse.length; index += 1) {
    const argument = argumentsToParse[index];

    if (argument === "--url" || argument === "--output" || argument === "--browser" || argument === "--timeout-ms") {
      const value = argumentsToParse[index + 1];

      if (!value) {
        throw new Error(`Missing value for ${argument}.`);
      }

      index += 1;

      if (argument === "--url") optionsToReturn.url = value;
      if (argument === "--output") optionsToReturn.outputDirectory = path.resolve(value);
      if (argument === "--browser") optionsToReturn.browser = value;
      if (argument === "--timeout-ms") optionsToReturn.timeoutMs = Number.parseInt(value, 10);
      continue;
    }

    if (argument === "--skip-accessibility") {
      optionsToReturn.skipAccessibility = true;
      continue;
    }

    if (argument === "--collect-security") {
      optionsToReturn.collectSecurity = true;
      continue;
    }

    if (argument === "--collect-launch") {
      optionsToReturn.collectLaunch = true;
      continue;
    }

    if (argument === "--collect-seo") {
      optionsToReturn.collectSeo = true;
      continue;
    }

    if (argument === "--skip-lighthouse") {
      optionsToReturn.skipLighthouse = true;
      continue;
    }

    if (argument === "--allow-no-sandbox") {
      optionsToReturn.allowNoSandbox = true;
      continue;
    }

    if (argument === "--include-error-details") {
      optionsToReturn.includeErrorDetails = true;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!optionsToReturn.url || !optionsToReturn.outputDirectory) {
    throw new Error("Both --url and --output are required.");
  }

  const parsedUrl = new URL(optionsToReturn.url);

  if (!new Set(["http:", "https:"]).has(parsedUrl.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  optionsToReturn.url = parsedUrl.href;

  if (!new Set(["auto", "chrome", "edge", "chromium"]).has(optionsToReturn.browser)) {
    throw new Error("--browser must be auto, chrome, edge, or chromium.");
  }

  if (!Number.isInteger(optionsToReturn.timeoutMs) || optionsToReturn.timeoutMs < 1000 || optionsToReturn.timeoutMs > 120000) {
    throw new Error("--timeout-ms must be an integer from 1000 through 120000.");
  }

  return optionsToReturn;
}
