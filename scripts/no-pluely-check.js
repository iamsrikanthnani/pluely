#!/usr/bin/env node
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SCAN_PATHS = [
  "src",
  "src-tauri",
  "docs",
  "README.md",
  "package.json",
  "vite.config.ts",
  "index.html",
  ".github",
];

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "target",
  "src-tauri/target",
  "src-tauri/gen",
]);

const TEXT_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".toml",
  ".rs",
  ".html",
  ".css",
  ".scss",
  ".txt",
  ".plist",
  ".desktop",
]);

const BANNED_PATTERNS = [
  /hasActiveLicense/,
  /validate_license_api/,
  /\bGetLicense\b/,
  /subscription/i,
  /billing/i,
  /paywall/i,
  /upgrade/i,
  /\bpluely\b/i,
  /pluely\.com/i,
];

const ALLOWLIST_LINE_PATTERNS = [
  // Azure Speech header (unrelated to billing/subscriptions)
  /Ocp-Apim-Subscription-Key/i,
  // This repo intentionally contains this check name/script
  /check:no-pluely/i,
  /no-pluely-check\.js/i,
];

function isIgnoredDir(relPath) {
  const normalized = relPath.split(path.sep).join("/");
  for (const d of IGNORE_DIRS) {
    if (normalized === d || normalized.startsWith(`${d}/`)) return true;
  }
  return false;
}

function shouldScanFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!TEXT_EXTS.has(ext)) return false;
  return true;
}

function walk(relPath, outFiles) {
  const absPath = path.join(ROOT, relPath);

  if (!fs.existsSync(absPath)) return;

  const stat = fs.statSync(absPath);
  if (stat.isFile()) {
    if (shouldScanFile(absPath)) outFiles.push(absPath);
    return;
  }

  if (!stat.isDirectory()) return;

  if (isIgnoredDir(relPath)) return;

  for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
    const childRel = path.join(relPath, entry.name);
    const childAbs = path.join(ROOT, childRel);
    if (entry.isDirectory()) {
      if (!isIgnoredDir(childRel)) walk(childRel, outFiles);
      continue;
    }
    if (entry.isFile() && shouldScanFile(childAbs)) outFiles.push(childAbs);
  }
}

function scanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return [];
  }

  // Skip likely-binary files (nul byte)
  if (content.includes("\u0000")) return [];

  const rel = path.relative(ROOT, filePath).split(path.sep).join("/");
  const hits = [];

  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOWLIST_LINE_PATTERNS.some((p) => p.test(line))) continue;
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(line)) {
        const snippet = line.trim().slice(0, 200);
        hits.push({ rel, lineNo: i + 1, snippet, pattern: String(pattern) });
        break;
      }
    }
  }

  return hits;
}

const files = [];
for (const rel of SCAN_PATHS) walk(rel, files);

const allHits = files.flatMap(scanFile);

if (allHits.length > 0) {
  console.error("Blocked terms found:");
  for (const hit of allHits) {
    console.error(`${hit.rel}:${hit.lineNo}: ${hit.snippet}`);
  }
  console.error(`\nTotal: ${allHits.length} match(es).`);
  process.exit(1);
}

console.log("OK: no blocked terms found.");
