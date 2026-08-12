import Link from "next/link";

import { Button } from "@/components/ui/button";

const coverLinks = [
  {
    label: "AI Album Cover Generator",
    href: "https://coverhook.com/ai-album-cover-generator",
  },
  {
    label: "AI YouTube Thumbnail Generator",
    href: "https://coverhook.com/ai-youtube-thumbnail-generator",
  },
  {
    label: "AI Book Cover Generator",
    href: "https://coverhook.com/ai-book-cover-generator",
  },
  {
    label: "AI TikTok Cover Generator",
    href: "https://coverhook.com/ai-tiktok-cover-generator",
  },
];

export default function CoverHookPromo() {
  return (
    <section className="bg-card px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm text-muted-foreground">
          Need the finished cover rather than raw artwork? A general image model
          sets type badly, so our sister site{" "}
          <Link
            href="https://coverhook.com"
            className="text-primary hover:underline"
            target="_blank"
          >
            CoverHook
          </Link>{" "}
          handles those — the title is typeset into the artwork and the output
          is already the size each platform wants:
        </p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {coverLinks.map((link) => (
            <li key={link.label}>
              <Button
                variant="link"
                className="h-auto px-0"
                nativeButton={false}
                render={<Link href={link.href} target="_blank" />}
              >
                {link.label}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
