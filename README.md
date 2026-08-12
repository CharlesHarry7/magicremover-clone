# MagicRemover Clone

Free AI object remover — upload a photo, brush the area to erase, run AI inpainting, compare before/after, and download the result.

Built with **Next.js + Tailwind CSS + shadcn/ui**, deployed to Cloudflare Workers via OpenNext.

## Features

- Upload JPG / PNG / WebP (up to ~10 MB)
- Brush mask with adjustable size, undo, and clear
- AI object removal via Replicate (`dpakkk/image-object-removal`)
- Before / after comparison and download
- Honest error when `REPLICATE_API_TOKEN` is missing (no silent fake success)
- No Stripe / payments

## Setup

```bash
npm install
cp .env.example .env.local
# Put your Replicate token in .env.local for `npm run dev`
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For OpenNext / Wrangler local preview:

```bash
cp .dev.vars.example .dev.vars
# Put the same token in .dev.vars
npm run preview
```

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `REPLICATE_API_TOKEN` | Yes (for AI remove) | Replicate API token. Without it, `/api/remove-object` returns HTTP 503 with a clear message. |

| Runtime | Where to set the token |
| --- | --- |
| `npm run dev` / `next build` | `.env.local` (from `.env.example`) |
| `npm run preview` / Workers | `.dev.vars` (from `.dev.vars.example`) |
| Production Workers | `npx wrangler secret put REPLICATE_API_TOKEN` |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production Next.js build |
| `npm run lint` | ESLint |
| `npm run preview` | OpenNext Cloudflare build + local preview |
| `npm run deploy` | OpenNext Cloudflare build + deploy |
| `npm run cf-typegen` | Regenerate Worker env types |

## Deploy (Cloudflare Workers)

OpenNext config lives in `open-next.config.ts` and `wrangler.jsonc` (`magicremover-clone`).

```bash
npm run deploy
npx wrangler secret put REPLICATE_API_TOKEN
```

## Stack

- Next.js App Router + React 19
- Tailwind CSS v4 + shadcn/ui (`components.json`, `src/components/ui/*`)
- Cloudflare Workers via `@opennextjs/cloudflare`
