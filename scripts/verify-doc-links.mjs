import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const documents = [
  "README.md",
  "README_EN.md",
  "ARCHITECTURE.md",
  "CHANGELOG.md",
];

function collectMarkdown(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === ".git") return [];
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectMarkdown(path);
    return entry.isFile() && entry.name.endsWith(".md") ? [path] : [];
  }).map((path) => path.replace(`${resolve(".")}${process.platform === "win32" ? "\\" : "/"}`, "").replaceAll("\\", "/"));
}

documents.push(...collectMarkdown("docs"), ...collectMarkdown("wiki"));

// GitHub-style heading IDs, including duplicate suffixes and explicit HTML anchors.
// Ignore fenced code so example headings cannot make a broken link pass.
const anchorCache = new Map();
function anchorsFor(path) {
  if (anchorCache.has(path)) return anchorCache.get(path);
  const anchors = new Set();
  let fence;
  let previous = "";
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length
        && line.slice(marker[0].length).trim() === "") fence = undefined;
      previous = "";
      continue;
    }
    if (marker) { fence = marker[1]; previous = ""; continue; }
    for (const tag of line.matchAll(/<[a-z][^>]*>/gi)) {
      for (const match of tag[0].matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) anchors.add(match[1]);
    }
    const heading = line.match(/^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?\s*$/)?.[1]
      ?? (/^ {0,3}(?:=+|-+)\s*$/.test(line) && previous.trim() ? previous.trim() : undefined);
    if (heading !== undefined) {
      const slug = heading.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/<[^>]*>/g, "").toLowerCase()
        .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
      let candidate = slug;
      for (let suffix = 1; anchors.has(candidate); suffix++) candidate = `${slug}-${suffix}`;
      anchors.add(candidate);
    }
    previous = line;
  }
  anchorCache.set(path, anchors);
  return anchors;
}

const failures = [];
let checked = 0;
let fragmentsChecked = 0;
for (const document of documents) {
  assert.ok(existsSync(document), `Missing documentation entry: ${document}`);
  const markdown = readFileSync(document, "utf8");
  for (const match of markdown.matchAll(/!?(?:\[[^\]]*\])\(([^)]+)\)/g)) {
    const destination = match[1].trim().replace(/^<|>$/g, "");
    if (!destination || /^(?:https?:|mailto:)/i.test(destination)) continue;
    checked++;
    const separator = destination.indexOf("#");
    const file = separator < 0 ? destination : destination.slice(0, separator);
    const fragment = separator < 0 ? "" : decodeURIComponent(destination.slice(separator + 1));
    const target = file ? resolve(dirname(document), decodeURIComponent(file)) : resolve(document);
    if (!existsSync(target)) { failures.push(`${document} -> ${destination}`); continue; }
    if (fragment && /\.md$/i.test(target)) {
      fragmentsChecked++;
      if (!anchorsFor(target).has(fragment)) failures.push(`${document} -> ${destination} (missing heading/anchor)`);
    }
  }
}

assert.deepEqual(failures, [], `Broken local documentation links:\n${failures.join("\n")}`);
console.log(JSON.stringify({ documents: documents.length, localLinksChecked: checked, fragmentsChecked }));
