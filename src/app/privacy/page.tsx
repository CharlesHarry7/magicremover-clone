import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Privacy Policy (stub) | MagicRemover",
};

export default function PrivacyPage() {
  return (
    <StubPage
      title="Privacy Policy"
      description="Full legal copy is not included in this clone. Uploads for object removal are processed in memory for the request and are not stored by this app."
    />
  );
}
