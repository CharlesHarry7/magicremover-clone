import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "AI Image Generator (not implemented) | MagicRemover",
  description:
    "Placeholder — image generation is not wired in this clone. Use the object remover instead.",
};

export default function AIImageGeneratorPage() {
  return (
    <StubPage
      title="AI Image Generator"
      badge="Stub · not wired"
      description="This page mirrors a marketing route from the live site, but generation is not connected here. No model runs from this screen."
      bullets={[
        "No image-generation API is configured in this clone.",
        "To clean a photo you already have, use the free object remover.",
        "Brush people, clutter, text, or watermarks — then download the result.",
      ]}
    />
  );
}
