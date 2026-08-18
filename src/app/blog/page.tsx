import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Blog",
  description: "Stub blog index — guides aren’t ported in this clone.",
  robots: { index: false, follow: true },
};

export default function BlogPage() {
  return (
    <StubPage
      title="Blog"
      description="Guides aren’t ported yet. Open the object remover to try a removal yourself."
    />
  );
}
