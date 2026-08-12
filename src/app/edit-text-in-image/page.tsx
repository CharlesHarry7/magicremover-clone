import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Edit Text in Image (not implemented) | MagicRemover",
  description:
    "Placeholder — dedicated text editing is not wired. Brush text out with the object remover.",
};

export default function EditTextInImagePage() {
  return (
    <StubPage
      title="Edit Text in Image"
      badge="Stub · use remover instead"
      description="A dedicated “edit text” tool is not implemented in this clone. You can still erase burned-in captions, stamps, and overlays with the brush mask."
      bullets={[
        "Open the object remover and upload your image.",
        "Paint over the text you want gone.",
        "Run Remove Objects — the AI fills the background behind it.",
      ]}
    />
  );
}
