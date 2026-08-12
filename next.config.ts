import type { NextConfig } from "next";

/** Marketing URLs from the original site that have no page/stub here. */
const DEMO_TAB_REDIRECTS: { source: string; tab: string }[] = [
  { source: "/magic-eraser", tab: "object" },
  { source: "/remove-people-from-photo", tab: "people" },
  { source: "/remove-object-from-photo", tab: "object" },
  { source: "/remove-watermark-from-photo", tab: "watermark" },
  { source: "/remove-text-from-image", tab: "text" },
  { source: "/remove-sticker-from-image", tab: "sticker" },
  { source: "/logo-remover", tab: "sticker" },
  { source: "/remove-gemini-watermark", tab: "watermark" },
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return DEMO_TAB_REDIRECTS.map(({ source, tab }) => ({
      source,
      destination: `/?tab=${tab}#try`,
      permanent: false,
    }));
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
