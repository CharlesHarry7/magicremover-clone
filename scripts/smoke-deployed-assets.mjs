#!/usr/bin/env node
/**
 * Post-deploy smoke check: homepage HTML 200 is not enough — critical
 * /_next/static and /cases assets must also return 200 with sane content-types.
 * A known-missing hashed chunk must 404 with a non-HTML content-type (not a
 * Next/OpenNext HTML document shell).
 *
 * Usage: node scripts/smoke-deployed-assets.mjs <baseUrl>
 * Example: node scripts/smoke-deployed-assets.mjs https://example.workers.dev
 */
const args = process.argv.slice(2);
const assetsOnly = args.includes("--assets-only");
const baseUrl = (args.find((a) => !a.startsWith("--")) || "").replace(/\/$/, "");
if (!baseUrl) {
  console.error(
    "Usage: node scripts/smoke-deployed-assets.mjs <baseUrl> [--assets-only]"
  );
  process.exit(2);
}

async function headOrGet(url) {
  let res = await fetch(url, { method: "HEAD", redirect: "follow" });
  // Some edges omit useful content-type on HEAD; fall back to GET.
  if (!res.ok || !res.headers.get("content-type")) {
    res = await fetch(url, { method: "GET", redirect: "follow" });
  }
  return res;
}

let samples = ["/cases/remove-object-before02.webp", "/logo.webp"];

if (assetsOnly) {
  // Assets-only Workers have no SSR HTML; discover CSS from a known build layout
  // by probing the first CSS href pattern isn't available — caller should pass
  // paths via SMOKE_CSS env, else we only check cases/logo + optional SMOKE_CSS.
  const cssPath = process.env.SMOKE_CSS;
  if (cssPath) samples = [cssPath, ...samples];
  console.log(`assets-only mode @ ${baseUrl}`);
} else {
  const home = await headOrGet(baseUrl + "/");
  const homeCt = home.headers.get("content-type") || "";
  console.log(`GET / -> ${home.status} (${homeCt})`);
  if (!home.ok || !homeCt.includes("text/html")) {
    console.error("smoke-deployed-assets: homepage did not return HTML 200");
    process.exit(1);
  }

  const html = await (await fetch(baseUrl + "/")).text();
  const refs = [
    ...new Set(
      (html.match(/\/_next\/static\/[A-Za-z0-9._\-\/]+/g) || []).map((p) =>
        p.split("?")[0]
      )
    ),
  ];

  const css = refs.filter((p) => p.endsWith(".css"));
  const js = refs.filter((p) => p.endsWith(".js"));
  const media = refs.filter((p) => p.includes("/media/"));

  samples = [
    ...css.slice(0, 2),
    ...js.slice(0, 3),
    ...media.slice(0, 2),
    "/cases/remove-object-before02.webp",
    "/logo.webp",
  ];

  if (css.length === 0) {
    console.error(
      "smoke-deployed-assets: homepage HTML references no CSS under /_next/static"
    );
    process.exit(1);
  }
}

let failed = 0;
for (const p of samples) {
  const url = baseUrl + p;
  const res = await headOrGet(url);
  const ct = res.headers.get("content-type") || "";
  const ok =
    res.ok &&
    ((p.endsWith(".css") && ct.includes("text/css")) ||
      (p.endsWith(".js") && (ct.includes("javascript") || ct.includes("ecmascript") || ct.includes("text/plain"))) ||
      (p.endsWith(".woff2") && (ct.includes("font") || ct.includes("octet-stream"))) ||
      (p.endsWith(".webp") && (ct.includes("image/webp") || ct.includes("image/"))) ||
      res.ok);
  const mark = ok ? "OK" : "FAIL";
  console.log(`${mark} ${res.status} ${ct || "<?>"}\t${p}`);
  if (!ok) failed += 1;
}

if (failed > 0) {
  console.error(
    `smoke-deployed-assets: ${failed} asset check(s) failed. HTML 200 with /_next/static 404 usually means the Worker was published without uploading .open-next/assets (use npm run deploy / opennextjs-cloudflare deploy, not Pages git).`
  );
  process.exit(1);
}

// Stale hashed chunks after a new deploy must hard-404 as non-HTML.
// Next/OpenNext HTML 404 (~30KB, text/html, x-opennext) is treated as JS by
// old cached documents and leaves the app looking dead.
const missingPath = "/_next/static/chunks/app/page-deadbeefdeadbeef.js";
const missingRes = await fetch(baseUrl + missingPath, {
  method: "GET",
  redirect: "follow",
});
const missingCt = (missingRes.headers.get("content-type") || "").toLowerCase();
const missingOpenNext = missingRes.headers.get("x-opennext");
const missingBody = await missingRes.text();
const missingLooksHtml = /<!doctype html|<html[\s>]/i.test(missingBody);
const missingOk =
  missingRes.status === 404 &&
  !missingCt.includes("text/html") &&
  !missingOpenNext &&
  !missingLooksHtml;
console.log(
  `${missingOk ? "OK" : "FAIL"} ${missingRes.status} ${missingCt || "<?>"}\t${missingPath} (known-missing)`
);
if (missingRes.status !== 404) {
  console.error(
    `smoke-deployed-assets: known-missing ${missingPath} returned ${missingRes.status}, expected 404`
  );
  process.exit(1);
}
if (missingCt.includes("text/html") || missingLooksHtml || missingOpenNext) {
  console.error(
    `smoke-deployed-assets: known-missing ${missingPath} looks like a Next/OpenNext HTML shell (content-type=${missingCt || "<?>"}, x-opennext=${missingOpenNext || "absent"}). ASSETS miss must hard-404 as non-HTML.`
  );
  process.exit(1);
}

console.log(`smoke-deployed-assets: OK (${samples.length} assets + 1 known-missing 404) @ ${baseUrl}`);
