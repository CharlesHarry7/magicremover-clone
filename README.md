# MagicRemover Clone

Free AI object remover — upload a photo, brush the area to erase, run AI inpainting, compare before/after, and download the result.

Built with **Next.js + Tailwind CSS + shadcn/ui**, deployed to **Cloudflare Workers** via **OpenNext** (`@opennextjs/cloudflare`).

## Features

- Upload JPG / PNG / WebP (up to ~10 MB)
- Brush mask with adjustable size, undo, and clear
- AI object removal via Replicate (`dpakkk/image-object-removal`)
- Before / after comparison and download
- Honest **HTTP 503** when `REPLICATE_API_TOKEN` is missing (`code: MISSING_API_KEY`)
- No Stripe / payments
- Marketing/legal/blog routes are honest stubs that link back to the editor

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 App Router + React 19 |
| UI | Tailwind CSS v4 + shadcn/ui (`components.json`, `src/components/ui/*`) |
| Deploy | Cloudflare Workers via OpenNext (`open-next.config.ts`, `wrangler.jsonc`) |
| Remove API | `POST /api/remove-object` → Replicate |

Vercel is not required; prefer Cloudflare so OpenNext + Wrangler secrets stay the single deploy path.

## Setup (Next.js local)

```bash
npm install
cp .env.example .env.local
# Put your Replicate token in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Next.js reads `.env.local`. It does **not** read `.dev.vars`.

## Setup (OpenNext / Workers preview)

```bash
cp .dev.vars.example .dev.vars
# Put the same token in .dev.vars
npm run preview
```

`npm run preview` runs `opennextjs-cloudflare build` then local Workers preview. Secrets come from `.dev.vars`.

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `REPLICATE_API_TOKEN` | Yes (for AI remove) | Without it, `/api/remove-object` returns **503** `{ code: "MISSING_API_KEY" }`. |
| `NEXT_PUBLIC_SITE_URL` | No | Absolute origin for Open Graph / Twitter / canonical. Production fallback is the workers.dev URL, not localhost. |

| Runtime | Where to set the token |
| --- | --- |
| `npm run dev` | `.env.local` (from `.env.example`) |
| `npm run preview` | `.dev.vars` (from `.dev.vars.example`) |
| Production Workers | `npx wrangler secret put REPLICATE_API_TOKEN` |

Worker binding typings live in slim `cloudflare-env.d.ts`. Regenerate a full dump locally with `npm run cf-typegen` if needed (do not commit the huge workerd runtime file).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production Next.js build |
| `npm run lint` | ESLint (flat config; `eslint-config-next@16` for flat exports while the app stays on Next 15) |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| CI | `lint` → `typecheck` → `check:wrangler` → patch self-test → `build` → `build:worker` → `check:assets` |
| `npm run check:wrangler` | Fail if `assetPrefix`/`basePath` appear, or wrangler lacks OpenNext `main` + `ASSETS` |
| `npm run build:worker` | OpenNext Cloudflare build (Worker + ASSETS) + `/_next/static` hard-404 patch |
| `npm run check:assets` | Fail if built HTML refs / public cases are missing from `.open-next/assets` |
| `npm run preview` | OpenNext build + asset gate + local Workers preview |
| `npm run deploy` | OpenNext build + asset gate + Workers deploy (ASSETS included) |
| `npm run upload` | OpenNext build + asset gate + versions upload (no promote) |
| `npm run deploy:preview` | Versions upload with `--preview-alias preview` |
| `npm run smoke:deployed -- <url>` | Curl-check CSS/JS/media/cases **200** and a known-missing hashed chunk **404** non-HTML |
| `npm run cf-typegen` | Regenerate Worker env types |

## QA preview (do not merge to “fix” production)

Keep QA on a **non-prod** surface. **Merging to `main` does not repair** a broken `pages.dev`.

### Root cause (confirmed): HTML/SSR without OpenNext ASSETS

**Not** a Next `basePath` / `assetPrefix` bug — do **not** add either. Repo `next.config.ts` has none; CI runs `npm run check:wrangler` to keep it that way.

OpenNext on Workers needs **one** publish that includes:

| Piece | Path / config |
| --- | --- |
| SSR Worker | `wrangler.jsonc` → `main: ".open-next/worker.js"` |
| Static assets | `wrangler.jsonc` → `assets.directory: ".open-next/assets"`, `binding: "ASSETS"`, `run_worker_first: false`, `not_found_handling: "none"` |

When live `*.pages.dev` (or a partial Worker) serves HTML/SSR **without** uploading `.open-next/assets`, every `/_next/static/*` **404**s and the page never hydrates. Other broken edges:

- `/` → **empty 404** with `_headers` (ASSETS answering; Worker not bound)
- Mixed static **200**/**404** (stale/partial ASSETS vs current HTML hashes). Confirmed on **workers.dev itself** (not only pages.dev): present hashed JS → **200** `text/javascript`; missing/stale `/_next/static/chunks/app/page-deadbeefdeadbeef.js` → **404** `text/html` Next/OpenNext shell (`x-opennext`). Stale hashes must **hard-404 as non-HTML**, or old cached pages execute HTML as JS.

Fix: `npm run deploy` / `npm run upload` (OpenNext build + ASSETS together). Unbind legacy Pages git/`pages deploy` if it still owns `*.pages.dev`.

### How to open a working preview for QA

**Prefer a version preview URL — not production workers.dev until this Worker is uploaded.** Production `https://magicremover-clone.guochao950518.workers.dev` still returns **404 + HTML** for missing hashed chunks (repro). Present CSS/JS on that host can still 200.

(`npm run smoke:deployed -- <version-preview-url>` → home/CSS/cases **200** and `page-deadbeefdeadbeef.js` **404** non-HTML. Do not use `magicremover-clone.pages.dev` until Pages is unbound + OpenNext redeployed.)

| Goal | Command | Notes |
| --- | --- | --- |
| Shareable Workers QA | open workers.dev URL above | OpenNext Worker + ASSETS; ignore `*.pages.dev` |
| Local Workers QA | `npm run preview` | OpenNext build + `check:assets` + Wrangler; default `http://127.0.0.1:8787` |
| Optional public tunnel | after preview: `cloudflared tunnel --url http://127.0.0.1:8787` | When you need the **PR tip** locally without CF auth |
| Non-prod Workers version | `npm run upload` or `npm run deploy:preview` | Needs `CLOUDFLARE_API_TOKEN` / `wrangler login`; **does not promote** production |
| Smoke CSS/cases/home | `npm run smoke:deployed -- <preview-url>` | Present assets **200**; fake `page-deadbeefdeadbeef.js` **404** non-HTML |

```bash
npm ci
npm run preview
# another terminal (optional public URL):
cloudflared tunnel --url http://127.0.0.1:8787
npm run smoke:deployed -- http://127.0.0.1:8787
# With Cloudflare auth (preferred for shareable Workers preview):
npm run upload
npm run smoke:deployed -- https://<version-preview-or-workers-dev-url>
```

A `*.pages.dev` hostname is usable for QA **only** after `npm run upload` / `npm run deploy` (OpenNext) and `smoke:deployed` shows home + CSS **200**. Until then, use local preview or the tunnel URL.

## Deploy (Cloudflare Workers + OpenNext ASSETS)

Config: `open-next.config.ts` + `wrangler.jsonc` (worker name `magicremover-clone`, `nodejs_compat`, `assets.directory: .open-next/assets`, `ASSETS` binding).

**Production path (manual; not required for PR QA):**

```bash
npm run deploy
# = opennextjs-cloudflare build && npm run check:assets && opennextjs-cloudflare deploy
npx wrangler secret put REPLICATE_API_TOKEN
```

| Command | What it does |
| --- | --- |
| `npm run build:worker` | `opennextjs-cloudflare build` → `.open-next/worker.js` + `.open-next/assets`, then patch Worker so `/_next/static/*` ASSETS misses hard-404 as `text/plain` |
| `npm run check:assets` | Fails if `/_next/static` or `/cases/*` are missing from `.open-next/assets` |
| `npm run deploy` | Build + asset gate + **Workers deploy** (uploads Worker **and** ASSETS) |
| `npm run upload` | Build + asset gate + `wrangler versions upload` (non-promoting preview version) |
| `npm run deploy:preview` | Same as upload with `--preview-alias preview` |
| Post-deploy smoke | `npm run smoke:deployed -- https://YOUR_VERSION_PREVIEW_URL` (present assets 200; `page-deadbeefdeadbeef.js` 404 non-HTML) |

**Verify on a version preview URL** (does not promote production):

```bash
npm run upload
# wrangler prints a version preview, e.g.
# https://<version-id>-magicremover-clone.<account>.workers.dev
npm run smoke:deployed -- https://<version-preview-url>
# Expect:
#   GET / → 200 text/html
#   current /_next/static/chunks/app/page-*.js → 200 text/javascript
#   /_next/static/chunks/app/page-deadbeefdeadbeef.js → 404 text/plain (NOT text/html)
```

**Do not** use Cloudflare Pages git integration with `next build` / `pages deploy` alone. That surface often publishes HTML/Worker without the OpenNext `.open-next/assets` bundle, which looks like:

- `/` → HTML **200**
- `/_next/static/css/*.css`, `/_next/static/chunks/*`, `/_next/static/media/*` → **404**
- `/cases/*`, `/logo.webp` → **404**

HTML 200 ≠ usable. Always deploy via `opennextjs-cloudflare deploy` / `npm run deploy` so ASSETS is uploaded with the Worker.

### Disconnect legacy Pages (required for `*.pages.dev`)

`magicremover-clone.pages.dev` currently shows the failure mode above (HTML/SSR decoupled from `.open-next/assets`). That hostname is almost certainly still bound to a **legacy Cloudflare Pages** git/static project (or a Worker publish that omitted ASSETS).

In the Cloudflare dashboard:

1. **Workers & Pages** → open any **Pages** project named like `magicremover-clone`
2. Disable **git integration** / stop automatic Pages builds (`next build` / `pages deploy`)
3. Prefer deleting the Pages project **or** disconnecting the `*.pages.dev` route so it cannot shadow Workers
4. Redeploy the app as a **Worker + Assets** via `npm run deploy` (this repo’s `wrangler.jsonc` — not `pages_build_output_dir`)
5. Point custom domains / `*.pages.dev` aliases at the Worker if you still want that hostname — then run `npm run smoke:deployed -- https://…` and require CSS **200**

Acceptance: `/_next/static/css/*.css` → **200** `text/css` (and referenced `/cases/*` → **200**). HTML 200 alone fails.

### One-command preview (real Cloudflare account)

```bash
npm ci && npm run upload
# then smoke the printed workers.dev / version preview URL:
npm run smoke:deployed -- https://<preview-url>
```

Without account auth in CI/agents, an **assets-only** temporary Worker can still prove the ASSETS bundle:

```bash
npm run build:worker && npm run check:assets
npx wrangler deploy --temporary -c wrangler.assets-preview.jsonc
# local proof (no Turnstile): npx wrangler dev -c wrangler.assets-preview.jsonc
```

Expected URL patterns after a Workers deploy:

- `https://magicremover-clone.<account>.workers.dev` (when `workers_dev` is enabled)
- Dashboard preview / version URLs from `npm run upload`
- A `*.pages.dev` hostname may still be attached in the dashboard — treat it as broken unless `smoke-deployed-assets.mjs` shows CSS **200**

Never blindly merge over production to “fix” a Pages git deploy; redeploy with the OpenNext Workers path above.

### Remove API notes (Workers)

- Handler targets a ~28s wall-clock budget (Prefer:wait + short poll) so Workers do not hang.
- Oversized data URLs → **413** `PAYLOAD_TOO_LARGE`
- Upstream timeout → **504** `PREDICTION_TIMEOUT`
- Missing token → **503** `MISSING_API_KEY` (never a fake success)
- Prefer smaller uploads when running on Workers

## Routes

| Path | Status |
| --- | --- |
| `/` | Live object remover |
| `/api/remove-object` | Live remove API |
| `/ai-image-generator`, `/edit-text-in-image`, `/blog`, `/about`, `/contact`, `/privacy`, `/terms` | Honest stubs (not product features yet) |
