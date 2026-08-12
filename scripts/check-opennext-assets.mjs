#!/usr/bin/env node
/**
 * Fails if OpenNext static assets required for a usable deploy are missing.
 *
 * Verifies:
 * 1) `.open-next/assets` exists and contains `_next/static` + public cases/logo
 * 2) Every `/_next/static/*` path referenced by built HTML (Next + OpenNext) exists on disk under ASSETS
 *
 * Usage: node scripts/check-opennext-assets.mjs
 * Optional: OPEN_NEXT_ASSETS=.open-next/assets
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.resolve(
  root,
  process.env.OPEN_NEXT_ASSETS || ".open-next/assets"
);

const requiredPublic = [
  "cases/remove-object-before02.webp",
  "cases/remove-object-after02.webp",
  "cases/logo-remover-before.webp",
  "cases/logo-remover-after.webp",
  "logo.webp",
  "_headers",
];

function fail(message) {
  console.error(`check-opennext-assets: ${message}`);
  process.exit(1);
}

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

if (!existsSync(assetsDir) || !statSync(assetsDir).isDirectory()) {
  fail(
    `missing assets directory at ${path.relative(root, assetsDir)}. Run \`npm run build:worker\` (opennextjs-cloudflare build) first — do not deploy with bare \`next build\` or Pages git integration.`
  );
}

const nextStaticDir = path.join(assetsDir, "_next", "static");
if (!existsSync(nextStaticDir)) {
  fail(
    `missing ${path.relative(root, nextStaticDir)}. OpenNext did not emit static CSS/JS/media into ASSETS.`
  );
}

const cssFiles = walkFiles(path.join(nextStaticDir, "css")).filter((f) =>
  f.endsWith(".css")
);
const jsFiles = walkFiles(path.join(nextStaticDir, "chunks")).filter((f) =>
  f.endsWith(".js")
);
const mediaFiles = walkFiles(path.join(nextStaticDir, "media"));

if (cssFiles.length === 0) {
  fail("no CSS files under _next/static/css — deploy would be unstyled.");
}
if (jsFiles.length === 0) {
  fail("no JS chunks under _next/static/chunks — deploy would be non-interactive.");
}
if (mediaFiles.length === 0) {
  fail("no media under _next/static/media — font/media assets missing from ASSETS.");
}

const missingPublic = requiredPublic.filter(
  (rel) => !existsSync(path.join(assetsDir, rel))
);
if (missingPublic.length > 0) {
  fail(
    `public assets missing from ASSETS bundle:\n  - ${missingPublic.join("\n  - ")}`
  );
}

// HTML lives in Next/OpenNext server output, not always copied into ASSETS.
const htmlRoots = [
  path.join(root, ".next", "server"),
  path.join(root, ".open-next", "server-functions"),
  assetsDir,
].filter((dir) => existsSync(dir));

const htmlFiles = htmlRoots.flatMap((dir) =>
  walkFiles(dir).filter((f) => f.endsWith(".html"))
);

const referenced = new Set();
const refRe = /\/_next\/static\/[A-Za-z0-9._\-\/]+/g;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const match of html.match(refRe) || []) {
    referenced.add(match.split("?")[0]);
  }
}

if (referenced.size === 0) {
  fail(
    "no /_next/static references found in built HTML under .next/server or .open-next — cannot verify ASSETS completeness."
  );
}

const missingRefs = [];
for (const assetPath of referenced) {
  const onDisk = path.join(assetsDir, assetPath.replace(/^\//, ""));
  if (!existsSync(onDisk)) missingRefs.push(assetPath);
}

if (missingRefs.length > 0) {
  fail(
    `HTML references ${missingRefs.length} missing /_next/static asset(s) in ASSETS:\n  - ${missingRefs
      .slice(0, 30)
      .join("\n  - ")}${missingRefs.length > 30 ? "\n  - …" : ""}`
  );
}

const rel = (p) => path.relative(root, p);
console.log("check-opennext-assets: OK");
console.log(`  assets: ${rel(assetsDir)}`);
console.log(`  css: ${cssFiles.length}, js chunks: ${jsFiles.length}, media: ${mediaFiles.length}`);
console.log(`  html files scanned: ${htmlFiles.length}, static refs verified: ${referenced.size}`);
console.log(`  public cases/logo/_headers: present`);
console.log(
  "  deploy with: npm run deploy   # opennextjs-cloudflare build + ASSETS upload"
);
console.log(
  "  preview upload: npm run upload  # versions upload (includes assets); do NOT use Pages git deploy"
);
