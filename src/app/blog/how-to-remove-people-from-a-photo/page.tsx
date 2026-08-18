import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "How to Remove People from a Photo",
  description: "Stub guide — use the home-page object remover.",
  robots: { index: false, follow: true },
};

export default function HowToRemovePeoplePage() {
  return (
    <StubPage
      title="How to Remove People from a Photo"
      description="Upload a photo, brush over background people, run Remove Objects, then download the result."
    />
  );
}
