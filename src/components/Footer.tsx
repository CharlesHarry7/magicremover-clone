import Link from "next/link";
import Image from "next/image";

const allTools = [
  { label: "Remove People from Photo", href: "#try" },
  { label: "Remove Watermark from Photo", href: "#try" },
  { label: "Remove Object from Photo", href: "#try" },
  { label: "Remove Sticker from Image", href: "#try" },
  { label: "Remove Text from Image", href: "#try" },
  { label: "Remove Gemini Watermark", href: "#try" },
  { label: "Logo Remover", href: "#try" },
  { label: "Magic Eraser", href: "#try" },
  { label: "AI Image Generator", href: "#try" },
  { label: "Edit Text", href: "#try" },
];

const guides = [
  { label: "Blog", href: "/blog" },
  { label: "How to Remove People from a Photo", href: "/blog/how-to-remove-people-from-a-photo" },
];

const company = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="mb-3 text-sm font-semibold">All tools</h4>
            <ul className="space-y-1.5">
              {allTools.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Guides</h4>
            <ul className="space-y-1.5">
              {guides.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Company</h4>
            <ul className="space-y-1.5">
              {company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Image src="/logo.webp" alt="MagicRemover" width={28} height={28} className="h-7 w-7" />
              <span className="font-bold">MagicRemover</span>
            </Link>
            <p className="text-xs text-muted-foreground mb-3">
              Powered by{" "}
              <Link href="https://apimodels.app" className="text-primary hover:underline" target="_blank">
                apimodels.app
              </Link>{" "}
              — a unified AI image generation API
            </p>
            <p className="text-xs text-muted-foreground">
              Also from us: CoverHook —{" "}
              <Link href="https://coverhook.com" className="text-primary hover:underline" target="_blank">
                AI social media cover generator
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          2 free removes a day, plus 2 more when you sign in · Results retained 24 hours · We don&apos;t store your originals.
        </div>
      </div>
    </footer>
  );
}