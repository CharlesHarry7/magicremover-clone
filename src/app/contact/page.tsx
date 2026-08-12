import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Contact (stub) | MagicRemover",
  description: "Contact form is not implemented in this clone.",
};

export default function ContactPage() {
  return (
    <StubPage
      title="Contact"
      badge="Stub · no inbox"
      description="There is no contact form or support inbox in this clone. Use the home-page editor to try object removal."
      bullets={[
        "Product surface that works: the object remover on the home page.",
        "If removal fails, the API returns a clear error code (timeout, payload, missing config).",
      ]}
    />
  );
}
