import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "About",
  description: "Stub about page for the MagicRemover clone.",
  robots: { index: false, follow: true },
};

export default function AboutPage() {
  return (
    <StubPage
      title="About"
      description="Full about copy isn’t ported. This clone is a free AI object remover: upload, brush, remove, download."
    />
  );
}
