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
| `npm run lint` | ESLint |
| `npm run preview` | OpenNext Cloudflare build + local Workers preview |
| `npm run deploy` | OpenNext Cloudflare build + `wrangler` deploy |
| `npm run upload` | OpenNext build + upload (no promote) |
| `npm run cf-typegen` | Regenerate Worker env types |

## Deploy (Cloudflare Workers)

Config: `open-next.config.ts` + `wrangler.jsonc` (worker name `magicremover-clone`, `nodejs_compat`).

```bash
npm run deploy
npx wrangler secret put REPLICATE_API_TOKEN
```

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
