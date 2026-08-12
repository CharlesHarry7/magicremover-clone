import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Privacy Policy (stub) | MagicRemover",
  description: "Privacy stub for the MagicRemover clone.",
};

export default function PrivacyPage() {
  return (
    <StubPage
      title="Privacy Policy"
      badge="Stub · how this clone behaves"
      description="Full legal copy is not included. For this clone’s object remover: uploads and masks are sent to the remove API for processing and are not stored by the app afterward."
      bullets={[
        "Images are processed for the request; this app does not keep a results archive.",
        "When a removal provider token is missing, the API fails honestly with HTTP 503.",
        "Only edit images you have the right to modify.",
      ]}
    />
  );
}
