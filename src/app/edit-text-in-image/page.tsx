import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Edit Text in Image",
  description: "Stub page — brush text out with the object remover instead.",
  robots: { index: false, follow: true },
};

export default function EditTextInImagePage() {
  return (
    <StubPage
      title="Edit Text in Image"
      description="Dedicated text editing isn’t implemented here. Brush over captions or stamps in the object remover to erase them."
    />
  );
}
