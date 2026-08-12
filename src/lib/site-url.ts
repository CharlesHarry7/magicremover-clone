/**
 * Default absolute origin for canonical / Open Graph when env is unset.
 * QA surface is workers.dev (pages.dev dual-track is unreliable for static).
 * Never fall back to localhost:3000.
 */
export const PRODUCTION_SITE_URL =
  "https://magicremover-clone.guochao950518.workers.dev";

/**
 * Absolute site origin for canonical / Open Graph / robots / sitemap.
 * Prefer `NEXT_PUBLIC_SITE_URL` or `SITE_URL` (trailing slash stripped).
 * Otherwise the workers.dev QA host. Rejects localhost / 127.0.0.1 even if set.
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "";
  const fromEnv = raw.replace(/\/$/, "");
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv;
  }
  return PRODUCTION_SITE_URL;
}
