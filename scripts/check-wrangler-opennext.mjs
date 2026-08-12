#!/usr/bin/env node
/**
 * Guards the OpenNext + Workers Static Assets deploy contract.
 *
 * Fails if:
 * - next.config sets assetPrefix / basePath (wrong fix for /_next/static 404)
 * - wrangler.jsonc is missing main / assets.directory / ASSETS binding
 * - wrangler.jsonc looks like a Pages-only config (pages_build_output_dir)
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
if (
  /\boutput\b\s*:\s*['"]export['"]/.test(nextConfig) ||
  /\boutput\b\s*:\s*"export"/.test(nextConfig)
) {
  fail(
    'next.config.ts must NOT set output: "export". Static export breaks OpenNext Workers SSR; deploy with opennextjs-cloudflare build + assets=.open-next/assets.'
  );
}

// 503 MISSING_API_KEY JSON must stay neutral (no REPLICATE_API_TOKEN in the body).
const removeErrorsPath = path.join(root, "src/lib/remove-errors.ts");
if (!existsSync(removeErrorsPath)) {
  fail("missing src/lib/remove-errors.ts");
}
const removeErrors = readFileSync(removeErrorsPath, "utf8");
if (
  !/SERVICE_UNAVAILABLE_API_ERROR\s*=\s*"Object removal is not available\."/.test(
    removeErrors
  )
) {
  fail(
    'SERVICE_UNAVAILABLE_API_ERROR must be the neutral string "Object removal is not available."'
  );
}
const jsonBlock = removeErrors.match(
  /export const MISSING_API_KEY_JSON\s*=\s*\{[\s\S]*?\}\s*as const/
)?.[0];
if (!jsonBlock) {
  fail("MISSING_API_KEY_JSON export not found in remove-errors.ts");
}
if (/REPLICATE_API_TOKEN|REPLICATE_/i.test(jsonBlock)) {
  fail(
    "MISSING_API_KEY_JSON must not mention REPLICATE_* — keep { error: neutral, code: MISSING_API_KEY } only."
  );
}
if (
  !/code:\s*"MISSING_API_KEY"/.test(jsonBlock) ||
  !/error:\s*SERVICE_UNAVAILABLE_API_ERROR/.test(jsonBlock)
) {
  fail(
    "MISSING_API_KEY_JSON must be { error: SERVICE_UNAVAILABLE_API_ERROR, code: \"MISSING_API_KEY\" }."
  );
}

const siteUrlPath = path.join(root, "src/lib/site-url.ts");
if (!existsSync(siteUrlPath)) {
  fail("missing src/lib/site-url.ts");
}
const siteUrlSrc = readFileSync(siteUrlPath, "utf8");
if (!/magicremover-clone\.guochao950518\.workers\.dev/.test(siteUrlSrc)) {
  fail(
    "site-url.ts must default PRODUCTION_SITE_URL to the workers.dev QA host."
  );
}
if (!/localhost|127\.0\.0\.1/.test(siteUrlSrc)) {
  fail("site-url.ts must explicitly reject localhost for metadataBase.");
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

const flags = wrangler.compatibility_flags;
if (!Array.isArray(flags) || !flags.includes("nodejs_compat")) {
  fail('compatibility_flags must include "nodejs_compat" for OpenNext on Workers.');
}

console.log("check-wrangler-opennext: OK");
console.log('  next.config: no assetPrefix/basePath/output:export');
console.log('  wrangler: main=.open-next/worker.js');
console.log('  wrangler: assets.directory=.open-next/assets binding=ASSETS');
console.log("  deploy: npm run deploy | npm run upload  # Worker + ASSETS together");
console.log("  never: Pages git / bare next build / assets-only for full app");
