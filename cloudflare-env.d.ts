/**
 * Cloudflare Worker bindings for magicremover-clone.
 * Regenerate runtime types locally with: npm run cf-typegen
 * Keep this file slim in git; do not commit the full workerd runtime dump.
 */
interface CloudflareEnv {
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  REPLICATE_API_TOKEN?: string;
}
