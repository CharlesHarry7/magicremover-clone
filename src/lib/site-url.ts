/** Production origin when NEXT_PUBLIC_SITE_URL is unset (never localhost). */
export const PRODUCTION_SITE_URL =
  "https://magicremover-clone.guochao950518.workers.dev";

/**
 * Absolute site origin for canonical / Open Graph / robots / sitemap.
 * Prefers NEXT_PUBLIC_SITE_URL; deployed builds must not fall back to localhost.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }
  return fromEnv || "http://localhost:3000";
}
