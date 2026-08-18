import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Stub contact page — no inbox in this clone.",
  robots: { index: false, follow: true },
};

export default function ContactPage() {
  return (
    <StubPage
      title="Contact"
      description="No contact form in this clone. Try the object remover on the home page."
    />
  );
}
