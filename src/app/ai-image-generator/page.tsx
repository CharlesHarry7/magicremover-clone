import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "AI Image Generator",
  description: "Stub page — image generation is not implemented in this clone.",
  robots: { index: false, follow: true },
};

export default function AIImageGeneratorPage() {
  return (
    <StubPage
      title="AI Image Generator"
      description="Not wired in this clone. Use the object remover on the home page to erase unwanted content from a photo you already have."
    />
  );
}
