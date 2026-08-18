import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Stub terms page for the MagicRemover clone.",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <StubPage
      title="Terms of Service"
      description="Full terms aren’t included. Only edit images you have the right to modify."
    />
  );
}
