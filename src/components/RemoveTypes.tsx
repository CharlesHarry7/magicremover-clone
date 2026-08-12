import Link from "next/link";
import {
  EraserIcon,
  ImageOffIcon,
  ShieldCheckIcon,
  SmileIcon,
  Trash2Icon,
  TypeIcon,
  UsersIcon,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const removeTypes = [
  {
    title: "Background People Remover",
    description:
      "Clear passers-by, tourists, and crowds from your photo without touching the subject.",
    href: "#try",
    icon: UsersIcon,
  },
  {
    title: "AI Object Remover",
    description:
      "Delete unwanted objects — cables, signs, trash, clutter — while the AI rebuilds the background.",
    href: "#try",
    icon: Trash2Icon,
  },
  {
    title: "Remove Text from Image",
    description:
      "Erase captions, date stamps, subtitles, and burned-in labels while keeping the composition.",
    href: "#try",
    icon: TypeIcon,
  },
  {
    title: "Remove Watermark from Photo",
    description:
      "Scrub © stamps, overlays, and signatures off images you own in one brush stroke.",
    href: "#try",
    icon: ShieldCheckIcon,
  },
  {
    title: "Logo Remover",
    description:
      "Wipe brand logos, broadcast bugs, and sponsor badges out of photos and mockups.",
    href: "#try",
    icon: ImageOffIcon,
  },
  {
    title: "Sticker & Emoji Remover",
    description:
      "Scrub stickers, emoji, and overlay graphics off screenshots, memes, and social posts.",
    href: "#try",
    icon: SmileIcon,
  },
];

export default function RemoveTypes() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
          What you can remove
        </h2>
        <h3 className="mb-10 text-center text-lg text-muted-foreground">
          One AI eraser. Every kind of unwanted pixel.
        </h3>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          From tourists in your travel snaps to watermarks on stock photos,
          MagicRemover handles it in one brush stroke.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {removeTypes.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="group">
                <Card className="h-full transition-all hover:ring-primary/30">
                  <CardContent>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="mb-2 text-base font-semibold">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <EraserIcon className="h-3.5 w-3.5" />
          Brush any of these in the editor above
        </p>
      </div>
    </section>
  );
}
