import {
  EraserIcon,
  ImageOffIcon,
  ShieldCheckIcon,
  SmileIcon,
  Trash2Icon,
  TypeIcon,
  UsersIcon,
} from "lucide-react";

import HashNavLink from "@/components/HashNavLink";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { hrefForDemoTab, type DemoTab } from "@/lib/demo-tabs";

const removeTypes: {
  title: string;
  description: string;
  tab: DemoTab;
  icon: typeof UsersIcon;
}[] = [
  {
    title: "Background People Remover",
    description:
      "Clear passers-by, tourists, and crowds from your photo without touching the subject.",
    tab: "People",
    icon: UsersIcon,
  },
  {
    title: "AI Object Remover",
    description:
      "Delete unwanted objects — cables, signs, trash, clutter — while the AI rebuilds the background.",
    tab: "Object",
    icon: Trash2Icon,
  },
  {
    title: "Remove Text from Image",
    description:
      "Erase captions, date stamps, subtitles, and burned-in labels while keeping the composition.",
    tab: "Text",
    icon: TypeIcon,
  },
  {
    title: "Remove Watermark from Photo",
    description:
      "Scrub © stamps, overlays, and signatures off images you own in one brush stroke.",
    tab: "Watermark",
    icon: ShieldCheckIcon,
  },
  {
    title: "Logo Remover",
    description:
      "Wipe brand logos, broadcast bugs, and sponsor badges out of photos and mockups.",
    tab: "Sticker",
    icon: ImageOffIcon,
  },
  {
    title: "Sticker & Emoji Remover",
    description:
      "Scrub stickers, emoji, and overlay graphics off screenshots, memes, and social posts.",
    tab: "Sticker",
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
              <HashNavLink
                key={item.title}
                href={hrefForDemoTab(item.tab)}
                className="group block text-inherit hover:text-inherit"
              >
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
              </HashNavLink>
            );
          })}
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <EraserIcon className="h-3.5 w-3.5" />
          Opens the matching demo tab in the editor above
        </p>
      </div>
    </section>
  );
}
