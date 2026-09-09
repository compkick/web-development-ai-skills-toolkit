import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repositoryRoot = process.cwd();
const argumentsSet = new Set(process.argv.slice(2));
const internalOnly = argumentsSet.has("--internal-only");
const externalOnly = argumentsSet.has("--external-only");

if (internalOnly && externalOnly) {
  console.error("Choose either --internal-only or --external-only, not both.");
  process.exit(2);
}

const checkInternal = !externalOnly;
const checkExternal = !internalOnly;
const ignoredDirectories = new Set([".git", "node_modules"]);

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
      files.push(...await findMarkdownFiles(absolutePath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function maskCode(markdown) {
  let inFence = false;
  let fenceMarker = "";

  return markdown
    .split(/\r?\n/)
    .map((line) => {
      const fenceMatch = line.match(/^\s*(```+|~~~+)/);

      if (fenceMatch) {
        if (!inFence) {
          inFence = true;
          fenceMarker = fenceMatch[1][0];
        } else if (fenceMatch[1][0] === fenceMarker) {
          inFence = false;
          fenceMarker = "";
        }

        return "";
      }

      if (inFence) {
        return "";
      }

      return line.replace(/`[^`\n]*`/g, "");
    })
    .join("\n");
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

function cleanDestination(rawDestination) {
  let destination = rawDestination.trim().replaceAll("&amp;", "&");

  if (destination.startsWith("<") && destination.endsWith(">")) {
    destination = destination.slice(1, -1);
  }

  return destination;
}

function extractLinks(markdown, sourcePath) {
  const maskedMarkdown = maskCode(markdown);
  const links = [];
  const patterns = [
    /!?\[[^\]]*]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g,
    /^ {0,3}\[[^\]]+]:\s*(<[^>]+>|\S+)/gm,
    /<(https?:\/\/[^>\s]+)>/g,
  ];

  for (const pattern of patterns) {
    for (const match of maskedMarkdown.matchAll(pattern)) {
      links.push({
        destination: cleanDestination(match[1]),
        sourcePath,
        line: lineNumberAt(maskedMarkdown, match.index),
      });
    }
  }

  return links;
}

function githubHeadingAnchors(markdown) {
  const anchors = new Set();
  const occurrences = new Map();

  for (const line of maskCode(markdown).split("\n")) {
    const headingMatch = line.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/u);

    if (!headingMatch) {
      continue;
    }

    const baseSlug = headingMatch[1]
      .replace(/<[^>]*>/g, "")
      .replace(/!?\[([^\]]*)]\([^)]*\)/g, "$1")
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, "")
      .replace(/\s+/g, "-");
    const occurrence = occurrences.get(baseSlug) ?? 0;
    const slug = occurrence === 0 ? baseSlug : `${baseSlug}-${occurrence}`;

    occurrences.set(baseSlug, occurrence + 1);
    anchors.add(slug);
  }

  return anchors;
}

function decodeLinkPath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function validateInternalLink(link) {
  const [rawPath, rawFragment = ""] = link.destination.split("#", 2);
  const decodedPath = decodeLinkPath(rawPath.split("?")[0]);
  const targetPath = decodedPath
    ? path.resolve(decodedPath.startsWith("/") ? repositoryRoot : path.dirname(link.sourcePath), decodedPath.replace(/^[/\\]+/, ""))
    : link.sourcePath;

  let targetStats;

  try {
    targetStats = await stat(targetPath);
  } catch {
    return `target does not exist: ${path.relative(repositoryRoot, targetPath)}`;
  }

  if (!targetStats.isFile()) {
    return `target is not a file: ${path.relative(repositoryRoot, targetPath)}`;
  }

  if (rawFragment && targetPath.toLowerCase().endsWith(".md")) {
    const targetMarkdown = await readFile(targetPath, "utf8");
    const targetAnchor = decodeLinkPath(rawFragment).toLowerCase();

    if (!githubHeadingAnchors(targetMarkdown).has(targetAnchor)) {
      return `heading does not exist: #${rawFragment}`;
    }
  }

  return null;
}

function isSuccessfulStatus(statusCode) {
  return (statusCode >= 200 && statusCode < 400) || statusCode === 401 || statusCode === 403;
}

async function fetchWithTimeout(url, method) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "dev-docs-link-checker/1.0",
        ...(method === "GET" ? { Range: "bytes=0-0" } : {}),
      },
    });

    if (response.body) {
      await response.body.cancel().catch(() => {});
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function validateExternalUrl(url) {
  let lastResult = "request failed";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      let response = await fetchWithTimeout(url, "HEAD");

      if (!isSuccessfulStatus(response.status)) {
        response = await fetchWithTimeout(url, "GET");
      }

      if (isSuccessfulStatus(response.status)) {
        return null;
      }

      lastResult = `HTTP ${response.status}`;

      if (response.status !== 429 && response.status < 500) {
        break;
      }
    } catch (error) {
      lastResult = error.name === "AbortError" ? "request timed out" : error.message;
    }

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  return lastResult;
}

async function runWithConcurrency(items, limit, operation) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await operation(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const markdownFiles = await findMarkdownFiles(repositoryRoot);
const links = [];

for (const markdownFile of markdownFiles) {
  const markdown = await readFile(markdownFile, "utf8");
  links.push(...extractLinks(markdown, markdownFile));
}

const failures = [];

if (checkInternal) {
  const internalLinks = links.filter(({ destination }) => {
    return !/^[a-z][a-z0-9+.-]*:/iu.test(destination) && !destination.startsWith("//");
  });

  for (const link of internalLinks) {
    const failure = await validateInternalLink(link);

    if (failure) {
      failures.push({ ...link, failure });
    }
  }

  console.log(`Internal links checked: ${internalLinks.length}`);
}

if (checkExternal) {
  const externalReferences = new Map();

  for (const link of links) {
    if (!/^https?:\/\//iu.test(link.destination)) {
      continue;
    }

    const url = link.destination.split("#")[0];
    const references = externalReferences.get(url) ?? [];
    references.push(link);
    externalReferences.set(url, references);
  }

  const urls = [...externalReferences.keys()].sort();
  const results = await runWithConcurrency(urls, 6, validateExternalUrl);

  results.forEach((failure, index) => {
    if (!failure) {
      return;
    }

    const references = externalReferences.get(urls[index]);
    failures.push({
      ...references[0],
      destination: urls[index],
      failure: `${failure}; referenced ${references.length} time(s)`,
    });
  });

  console.log(`External URLs checked: ${urls.length}`);
}

if (failures.length > 0) {
  console.error("\nLink validation failures:");

  for (const failure of failures) {
    const relativeSource = path.relative(repositoryRoot, failure.sourcePath).replaceAll("\\", "/");
    console.error(`- ${relativeSource}:${failure.line} ${failure.destination} (${failure.failure})`);
  }

  process.exit(1);
}

console.log("Documentation links: OK");
