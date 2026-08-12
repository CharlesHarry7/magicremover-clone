import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Blog (stub) | MagicRemover",
};

export default function BlogPage() {
  return (
    <StubPage
      title="Blog"
      description="Guides are not ported in this clone yet. Jump to the editor to remove people, objects, text, or watermarks from a photo."
    />
  );
}
