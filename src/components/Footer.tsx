import Link from "next/link";

import HashNavLink from "@/components/HashNavLink";
import SafeImage from "@/components/SafeImage";
import { Separator } from "@/components/ui/separator";
import {
  FOOTER_COMPANY,
  FOOTER_GUIDES,
  FOOTER_TOOLS,
} from "@/lib/site-links";
import { FREE_EDITS_STORY } from "@/lib/remove-limits";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="mb-3 text-sm font-semibold">All tools</h4>
            <ul className="space-y-1.5">
              {FOOTER_TOOLS.map((link) => (
                <li key={link.label}>
                  <HashNavLink href={link.href}>{link.label}</HashNavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Guides</h4>
            <ul className="space-y-1.5">
              {FOOTER_GUIDES.map((link) => (
                <li key={link.label}>
                  <HashNavLink href={link.href}>{link.label}</HashNavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Company</h4>
            <ul className="space-y-1.5">
              {FOOTER_COMPANY.map((link) => (
                <li key={link.label}>
                  <HashNavLink href={link.href}>{link.label}</HashNavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Link href="/" className="mb-3 flex items-center gap-2">
              <SafeImage
                src="/logo.webp"
                alt="MagicRemover"
                width={28}
                height={28}
                compact
                className="h-7 w-7"
              />
              <span className="font-bold">MagicRemover</span>
            </Link>
            <p className="mb-3 text-xs text-muted-foreground">
              Powered by{" "}
              <Link
                href="https://apimodels.app"
                className="text-primary hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                apimodels.app
              </Link>{" "}
              — a unified AI image generation API
            </p>
            <p className="text-xs text-muted-foreground">
              Also from us: CoverHook —{" "}
              <Link
                href="https://coverhook.com"
                className="text-primary hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                AI social media cover generator
              </Link>
            </p>
          </div>
        </div>

        <Separator className="mt-10" />
        <div className="pt-6 text-center text-xs text-muted-foreground">
          {FREE_EDITS_STORY} · No signup · Results are not stored · Stub
          marketing pages link back to the editor.
        </div>
      </div>
    </footer>
  );
}
