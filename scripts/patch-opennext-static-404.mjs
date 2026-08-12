#!/usr/bin/env node
/**
 * After `opennextjs-cloudflare build`, inject an early fetch guard into
 * `.open-next/worker.js` so an ASSETS miss for `/_next/static/*` returns a
 * hard 404 (text/plain) instead of falling through to Next/OpenNext HTML.
 *
 * With `assets.run_worker_first: false`, the Worker only sees these paths
 * when ASSETS already missed. Present files are still served by ASSETS.
 *
 * Idempotent: re-running replaces the marked block.
 *
 * Usage: node scripts/patch-opennext-static-404.mjs
 * Optional: OPEN_NEXT_WORKER=.open-next/worker.js
 *           node scripts/patch-opennext-static-404.mjs --self-test
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BEGIN = "OPENNEXT_STATIC_ASSET_HARD_404_BEGIN";
const END = "OPENNEXT_STATIC_ASSET_HARD_404_END";

const FETCH_RE =
  /^([ \t]*)async\s+fetch\s*\(\s*request\s*,\s*env\s*,\s*ctx\s*\)\s*\{[ \t]*\r?$/m;
const BLOCK_RE = new RegExp(
  `^[ \\t]*// ${BEGIN}\\r?\\n[\\s\\S]*?^[ \\t]*// ${END}\\r?\\n?`,
  "m"
);

function fail(message) {
  console.error(`patch-opennext-static-404: ${message}`);
  process.exit(1);
}

function extraIndent(indent) {
  return indent.includes("\t") ? "\t" : "  ";
}

function buildGuard(fetchIndent) {
  const i1 = fetchIndent + extraIndent(fetchIndent);
  const i2 = i1 + extraIndent(fetchIndent);
  const i3 = i2 + extraIndent(fetchIndent);
  const i4 = i3 + extraIndent(fetchIndent);
  const i5 = i4 + extraIndent(fetchIndent);
  return (
    `${i1}// ${BEGIN}\n` +
    `${i1}{\n` +
    `${i2}const __staticPath = new URL(request.url).pathname;\n` +
    `${i2}if (__staticPath.startsWith("/_next/static/")) {\n` +
    `${i3}return new Response("Not Found", {\n` +
    `${i4}status: 404,\n` +
    `${i4}headers: {\n` +
    `${i5}"content-type": "text/plain; charset=utf-8",\n` +
    `${i5}"cache-control": "no-store",\n` +
    `${i5}"x-content-type-options": "nosniff",\n` +
    `${i4}},\n` +
    `${i3}});\n` +
    `${i2}}\n` +
    `${i1}}\n` +
    `${i1}// ${END}\n`
  );
}

function patchSource(source) {
  const fetchMatch = source.match(FETCH_RE);
  if (!fetchMatch) {
    throw new Error(
      "could not find `async fetch(request, env, ctx) {` in worker.js — OpenNext template may have changed; update this patch script."
    );
  }
  const fetchIndent = fetchMatch[1];
  const guard = buildGuard(fetchIndent);

  if (source.includes(`// ${BEGIN}`)) {
    if (!source.match(BLOCK_RE)) {
      throw new Error(
        "found hard-404 begin marker but could not replace the marked block"
      );
    }
    return source.replace(BLOCK_RE, guard);
  }

  const insertAt = fetchMatch.index + fetchMatch[0].length;
  const before = source.slice(0, insertAt);
  const after = source.slice(insertAt).replace(/^\r?\n/, "");
  return `${before}\n${guard}${after}`;
}

function assertPatched(source) {
  if (!source.includes(BEGIN) || !source.includes(END)) {
    throw new Error("patched worker.js is missing hard-404 markers");
  }
  if (!source.includes('startsWith("/_next/static/")')) {
    throw new Error("patched worker.js is missing /_next/static/ pathname guard");
  }
  if (!source.includes("text/plain")) {
    throw new Error("patched worker.js hard-404 is not text/plain");
  }
}

function selfTest() {
  const fixtures = [
    `export { DOQueueHandler } from "./.build/durable-objects/queue.js";
export default {
  async fetch(request, env, ctx) {
    return runWithCloudflareRequestContext(request, env, ctx, async () => {
      const reqOrResp = await middlewareHandler(request, env, ctx);
      return reqOrResp;
    });
  },
};
`,
    `export { DOQueueHandler } from "./.build/durable-objects/queue.js";
export default {
 async fetch(request, env, ctx) {
 return runWithCloudflareRequestContext(request, env, ctx, async () => {
 const reqOrResp = await middlewareHandler(request, env, ctx);
 return reqOrResp;
 });
 },
};
`,
  ];
  for (const fixture of fixtures) {
    const once = patchSource(fixture);
    assertPatched(once);
    if (!/^([ \t]*)async fetch\(request, env, ctx\) \{$/m.test(once)) {
      throw new Error("fetch signature must stay on its own line after patch");
    }
    if (!once.includes("export { DOQueueHandler }")) {
      throw new Error("patch dropped Durable Object re-exports");
    }
    const twice = patchSource(once);
    assertPatched(twice);
    const beginCount = twice.split(BEGIN).length - 1;
    if (beginCount !== 1) {
      throw new Error(`expected one hard-404 block, found ${beginCount}`);
    }
    if (!twice.includes("middlewareHandler")) {
      throw new Error("patch dropped OpenNext fetch body");
    }
  }
  const templatePath = path.join(
    root,
    "node_modules/@opennextjs/cloudflare/dist/cli/templates/worker.js"
  );
  if (existsSync(templatePath)) {
    const tpl = readFileSync(templatePath, "utf8");
    const patchedTpl = patchSource(tpl);
    assertPatched(patchedTpl);
    if (!patchedTpl.includes("export { DOQueueHandler }")) {
      throw new Error("patch dropped DOQueueHandler from OpenNext worker template");
    }
    if (!patchedTpl.includes("middlewareHandler")) {
      throw new Error("patch dropped middlewareHandler from OpenNext worker template");
    }
    const twiceTpl = patchSource(patchedTpl);
    if (twiceTpl.split(BEGIN).length - 1 !== 1) {
      throw new Error("re-patching OpenNext template duplicated the hard-404 block");
    }
  }
  console.log("patch-opennext-static-404: self-test OK");
}

if (process.argv.includes("--self-test")) {
  try {
    selfTest();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
  process.exit(0);
}

const workerPath = path.resolve(
  root,
  process.env.OPEN_NEXT_WORKER || ".open-next/worker.js"
);

let source;
try {
  source = readFileSync(workerPath, "utf8");
} catch {
  fail(
    `missing ${path.relative(root, workerPath)}. Run \`opennextjs-cloudflare build\` first.`
  );
}

let patched;
try {
  patched = patchSource(source);
  assertPatched(patched);
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

if (patched === source) {
  console.log(
    `patch-opennext-static-404: already applied (${path.relative(root, workerPath)})`
  );
  process.exit(0);
}

writeFileSync(workerPath, patched);
console.log(
  `patch-opennext-static-404: injected /_next/static hard-404 into ${path.relative(root, workerPath)}`
);
console.log(
  "  ASSETS hit still serves the file; ASSETS miss returns 404 text/plain (never Next HTML)."
);
