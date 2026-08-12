import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "How to Remove People from a Photo (stub) | MagicRemover",
};

export default function HowToRemovePeoplePage() {
  return (
    <StubPage
      title="How to Remove People from a Photo"
      description="This guide is a stub. On the home page: open Try It, upload a photo, brush the people to erase, then run Remove Objects."
    />
  );
}
