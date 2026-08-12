import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "How to Remove People from a Photo (stub) | MagicRemover",
  description: "Quick stub guide — use the home-page object remover.",
};

export default function HowToRemovePeoplePage() {
  return (
    <StubPage
      title="How to Remove People from a Photo"
      badge="Stub · 3-step recipe"
      description="Full article content is not ported. Use this quick path on the home page editor."
      bullets={[
        "Open Try It and upload a travel or group photo.",
        "Brush over background people (not your main subject).",
        "Tap Remove Objects, wait for the result (usually under ~30s), then download.",
      ]}
    />
  );
}
