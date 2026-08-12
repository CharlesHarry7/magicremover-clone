import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "About (stub) | MagicRemover",
  description: "About placeholder for the MagicRemover clone.",
};

export default function AboutPage() {
  return (
    <StubPage
      title="About MagicRemover"
      badge="Stub · short version"
      description="Full about content is not ported. This clone is a free AI object remover: upload a photo, brush what to erase, run inpainting, compare before/after, and download."
      bullets={[
        "Stack: Next.js + Tailwind + shadcn/ui on Cloudflare (OpenNext).",
        "Removal uses Replicate when configured; otherwise the API returns an honest 503.",
        "No Stripe and no fake “success” when the backend is missing.",
      ]}
    />
  );
}
