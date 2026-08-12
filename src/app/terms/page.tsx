import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Terms of Service (stub) | MagicRemover",
};

export default function TermsPage() {
  return (
    <StubPage
      title="Terms of Service"
      description="Full terms are not included in this clone. Only edit images you have the right to modify."
    />
  );
}
