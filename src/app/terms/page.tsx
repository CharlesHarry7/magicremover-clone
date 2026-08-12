import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Terms of Service (stub) | MagicRemover",
  description: "Terms stub for the MagicRemover clone.",
};

export default function TermsPage() {
  return (
    <StubPage
      title="Terms of Service"
      badge="Stub · use responsibly"
      description="Full terms are not included in this clone. The demo editor is provided as-is for trying AI object removal."
      bullets={[
        "Only remove content from images you own or have permission to edit.",
        "Do not use the tool to infringe copyrights or erase others’ watermarks without rights.",
        "Service availability depends on the configured removal backend.",
      ]}
    />
  );
}
