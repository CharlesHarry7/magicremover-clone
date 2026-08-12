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
| CI | `lint` → `typecheck` → `build` → `build:worker` → `check:assets` |
| `npm run build:worker` | OpenNext Cloudflare build (Worker + ASSETS) |
| `npm run check:assets` | Fail if built HTML refs / public cases are missing from `.open-next/assets` |
| `npm run preview` | OpenNext build + asset gate + local Workers preview |
| `npm run deploy` | OpenNext build + asset gate + Workers deploy (ASSETS included) |
| `npm run upload` | OpenNext build + asset gate + versions upload (no promote) |
| `npm run deploy:preview` | Versions upload with `--preview-alias preview` |
| `npm run smoke:deployed -- <url>` | Curl-check CSS/JS/media/cases on a live preview URL |
| `npm run cf-typegen` | Regenerate Worker env types |

## Deploy (Cloudflare Workers + OpenNext ASSETS)

Config: `open-next.config.ts` + `wrangler.jsonc` (worker name `magicremover-clone`, `nodejs_compat`, `assets.directory: .open-next/assets`, `ASSETS` binding).

**Correct path (required):**

```bash
npm run deploy
# = opennextjs-cloudflare build && npm run check:assets && opennextjs-cloudflare deploy
npx wrangler secret put REPLICATE_API_TOKEN
```

| Command | What it does |
| --- | --- |
| `npm run build:worker` | `opennextjs-cloudflare build` → `.open-next/worker.js` + `.open-next/assets` |
| `npm run check:assets` | Fails if `/_next/static` or `/cases/*` are missing from `.open-next/assets` |
| `npm run deploy` | Build + asset gate + **Workers deploy** (uploads Worker **and** ASSETS) |
| `npm run upload` | Build + asset gate + `wrangler versions upload` (non-promoting preview version) |
| `npm run deploy:preview` | Same as upload with `--preview-alias preview` |
| Post-deploy smoke | `node scripts/smoke-deployed-assets.mjs https://YOUR_PREVIEW_URL` |

**Do not** use Cloudflare Pages git integration with `next build` / `pages deploy` alone. That surface often publishes HTML/Worker without the OpenNext `.open-next/assets` bundle, which looks like:

- `/` → HTML **200**
- `/_next/static/css/*.css`, `/_next/static/chunks/*`, `/_next/static/media/*` → **404**
- `/cases/*`, `/logo.webp` → **404**

HTML 200 ≠ usable. Always deploy via `opennextjs-cloudflare deploy` / `npm run deploy` so ASSETS is uploaded with the Worker.

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
