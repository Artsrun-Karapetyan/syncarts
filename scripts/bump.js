#!/usr/bin/env node

/**
 * Bumps the patch version (e.g. 0.3.0 → 0.3.1) across all config files.
 * Usage: bun run bump
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");

const files = [
  {
    path: resolve(root, "package.json"),
    pattern: /"version":\s*"(\d+\.\d+\.\d+)"/,
  },
  {
    path: resolve(root, "src-tauri/tauri.conf.json"),
    pattern: /"version":\s*"(\d+\.\d+\.\d+)"/,
  },
  {
    path: resolve(root, "src-tauri/Cargo.toml"),
    pattern: /version\s*=\s*"(\d+\.\d+\.\d+)"/,
  },
];

// Read current version from package.json
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);
const next = `${major}.${minor}.${patch + 1}`;

for (const { path, pattern } of files) {
  const content = readFileSync(path, "utf-8");
  const updated = content.replace(pattern, (match, _ver) =>
    match.replace(_ver, next),
  );
  writeFileSync(path, updated);
}

console.log(`✅ ${pkg.version} → ${next}`);
