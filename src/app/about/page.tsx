import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "About (stub) | MagicRemover",
};

export default function AboutPage() {
  return (
    <StubPage
      title="About"
      description="About content is not ported in this clone. MagicRemover here is a free AI object remover: upload a photo, brush what to erase, and download the result."
    />
  );
}
