import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Contact (stub) | MagicRemover",
};

export default function ContactPage() {
  return (
    <StubPage
      title="Contact"
      description="Contact form is not implemented in this clone. Use the home-page object remover to try the product."
    />
  );
}
