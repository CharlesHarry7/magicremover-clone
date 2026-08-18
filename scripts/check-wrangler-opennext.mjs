#!/usr/bin/env node
/**
 * Guards the OpenNext + Workers Static Assets deploy contract.
 *
 * Fails if:
 * - next.config sets assetPrefix / basePath (wrong fix for /_next/static 404)
 * - wrangler.jsonc is missing main / assets.directory / ASSETS binding
 * - wrangler.jsonc looks like a Pages-only config (pages_build_output_dir)
 * - assets.not_found_handling is not "none" (SPA / 404.html would be HTML for missing JS)
 *
 * Usage: node scripts/check-wrangler-opennext.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(`check-wrangler-opennext: ${message}`);
  process.exit(1);
}

function stripJsonc(text) {
  // Drop // line comments and /* */ blocks (good enough for our wrangler.jsonc).
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const nextConfigPath = path.join(root, "next.config.ts");
if (!existsSync(nextConfigPath)) {
  fail("missing next.config.ts");
}
const nextConfig = readFileSync(nextConfigPath, "utf8");
if (/\bassetPrefix\b\s*:/.test(nextConfig) || /\bbasePath\b\s*:/.test(nextConfig)) {
  fail(
    "next.config.ts must NOT set assetPrefix/basePath. Live /_next/static 404s mean the Worker was published without `.open-next/assets` (fix wrangler assets + OpenNext deploy), not Next assetPrefix."
  );
}

const wranglerPath = path.join(root, "wrangler.jsonc");
if (!existsSync(wranglerPath)) {
  fail("missing wrangler.jsonc");
}
const wranglerRaw = readFileSync(wranglerPath, "utf8");
let wrangler;
try {
  wrangler = JSON.parse(stripJsonc(wranglerRaw));
} catch (err) {
  fail(`wrangler.jsonc is not valid JSONC: ${err instanceof Error ? err.message : err}`);
}

if (wrangler.pages_build_output_dir) {
  fail(
    "wrangler.jsonc has pages_build_output_dir — that is Cloudflare Pages, not OpenNext Workers+ASSETS. Remove it and deploy with npm run deploy."
  );
}

if (wrangler.main !== ".open-next/worker.js") {
  fail(
    `wrangler.jsonc main must be ".open-next/worker.js" (got ${JSON.stringify(wrangler.main)}).`
  );
}

const assets = wrangler.assets;
if (!assets || typeof assets !== "object") {
  fail('wrangler.jsonc missing assets { directory, binding } — required for /_next/static.');
}
if (assets.directory !== ".open-next/assets") {
  fail(
    `assets.directory must be ".open-next/assets" (got ${JSON.stringify(assets.directory)}).`
  );
}
if (assets.binding !== "ASSETS") {
  fail(
    `assets.binding must be "ASSETS" for OpenNext (got ${JSON.stringify(assets.binding)}).`
  );
}
if (assets.run_worker_first === true) {
  fail(
    "assets.run_worker_first must not be true globally — static CSS/JS would hit the Worker first and commonly 404. Keep default false (ASSETS first)."
  );
}
if (assets.not_found_handling !== "none") {
  fail(
    `assets.not_found_handling must be "none" (got ${JSON.stringify(assets.not_found_handling)}). SPA / 404-page / omit would allow HTML for missing /_next/static/* instead of the Worker hard-404.`
  );
}

const flags = wrangler.compatibility_flags;
if (!Array.isArray(flags) || !flags.includes("nodejs_compat")) {
  fail('compatibility_flags must include "nodejs_compat" for OpenNext on Workers.');
}

console.log("check-wrangler-opennext: OK");
console.log('  next.config: no assetPrefix/basePath');
console.log('  wrangler: main=.open-next/worker.js');
console.log('  wrangler: assets.directory=.open-next/assets binding=ASSETS');
console.log('  wrangler: run_worker_first=false not_found_handling=none (no SPA HTML fallback)');
console.log("  deploy: npm run deploy | npm run upload  # Worker + ASSETS together");
console.log("  never: Pages git / bare next build / assets-only for full app");
