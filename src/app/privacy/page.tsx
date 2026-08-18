import type { Metadata } from "next";

import StubPage from "@/components/StubPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Stub privacy page for the MagicRemover clone.",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <StubPage
      title="Privacy Policy"
      description="Legal copy isn’t included. Uploads are processed for the remove request and aren’t archived by this app."
    />
  );
}
