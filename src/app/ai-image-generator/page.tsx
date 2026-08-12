import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "AI Image Generator (stub) | MagicRemover",
  description:
    "Placeholder page — the AI image generator is not implemented in this clone.",
};

export default function AIImageGeneratorPage() {
  return (
    <StubPage
      title="AI Image Generator"
      description="This marketing page is a stub in the MagicRemover clone. Image generation is not wired up here — use the free AI object remover on the home page instead."
    />
  );
}
