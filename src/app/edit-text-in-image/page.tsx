import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Edit Text in Image (stub) | MagicRemover",
  description:
    "Placeholder page — edit-text-in-image is not implemented in this clone.",
};

export default function EditTextInImagePage() {
  return (
    <StubPage
      title="Edit Text in Image"
      description="This marketing page is a stub in the MagicRemover clone. Text editing is not wired up here — brush unwanted text out with the object remover on the home page."
    />
  );
}
