/** Production / QA origin when NEXT_PUBLIC_SITE_URL is unset (never localhost). */
export const PRODUCTION_SITE_URL =
  "https://magicremover-clone.guochao950518.workers.dev";

/**
 * Absolute site origin for canonical / Open Graph / robots / sitemap.
 * Prefer NEXT_PUBLIC_SITE_URL (trailing slash stripped). Otherwise the
 * workers.dev QA host. Never localhost — including production builds.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv;
  }
  return PRODUCTION_SITE_URL;
}
