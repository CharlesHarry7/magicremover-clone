import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Blog (stub) | MagicRemover",
  description: "Blog guides are not ported in this clone.",
};

export default function BlogPage() {
  return (
    <StubPage
      title="Blog"
      badge="Stub · guides not ported"
      description="Long-form guides are not included here yet. The shortest path: open the editor and try a removal yourself."
      bullets={[
        "Upload a JPG, PNG, or WebP (about 10 MB max).",
        "Brush the area to erase, then run Remove Objects.",
        "Compare before/after and download the PNG result.",
      ]}
    />
  );
}
