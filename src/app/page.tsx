import type { Metadata } from "next";

import Hero from "@/components/Hero";
import RemoveTypes from "@/components/RemoveTypes";
import AIGeneratorPromo from "@/components/AIGeneratorPromo";
import CoverHookPromo from "@/components/CoverHookPromo";
import FeatureDetail from "@/components/FeatureDetail";
import HowItWorks from "@/components/HowItWorks";
import WhyUs from "@/components/WhyUs";
import Limitations from "@/components/Limitations";
import FAQ from "@/components/FAQ";
import { hrefForDemoTab } from "@/lib/demo-tabs";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const featureSections = [
  {
    tag: "background people remover",
    title: "Background People Remover",
    description:
      "Clear photobombers, tourists, and background pedestrians while your subject stays crisp — the AI fills in sky, water, wall, or sidewalk.",
    bullets: [
      "Single photobombers behind your subject",
      "Dense tourist and concert crowds",
    ],
    ctaLabel: "Try Background People Remover free",
    ctaHref: hrefForDemoTab("People"),
    beforeImage: "/cases/remove-people-before01.webp",
    afterImage: "/cases/remove-people-after01.webp",
  },
  {
    tag: "ai object remover",
    title: "AI Object Remover",
    description:
      "Paint over clutter — cables, trash, parked cars — and MagicRemover rebuilds the background behind it.",
    bullets: [
      "Street clutter, cables, and debris",
      "Parked vehicles and signage posts",
    ],
    ctaLabel: "Try AI Object Remover free",
    ctaHref: hrefForDemoTab("Object"),
    beforeImage: "/cases/remove-object-before02.webp",
    afterImage: "/cases/remove-object-after02.webp",
  },
  {
    tag: "remove text from image",
    title: "Remove Text from Image",
    description:
      "Erase date stamps, captions, subtitles, and burned-in phrases while keeping the original framing.",
    bullets: [
      "Camera date and timestamp overlays",
      "Subtitles, captions, and meme typography",
    ],
    ctaLabel: "Try Remove Text from Image free",
    ctaHref: hrefForDemoTab("Text"),
    beforeImage: "/cases/text-remover-before.webp",
    afterImage: "/cases/text-remover-after.webp",
  },
  {
    tag: "remove watermark from photo",
    title: "Remove Watermark from Photo",
    description:
      "Scrub copyright stamps, diagonal overlays, and signatures from photos you have the right to edit.",
    bullets: [
      "Diagonal text watermarks and © marks",
      "Corner studio signatures and stamps",
    ],
    ctaLabel: "Try Remove Watermark from Photo free",
    ctaHref: hrefForDemoTab("Watermark"),
    beforeImage: "/cases/gemini-watermark-remover-before.webp",
    afterImage: "/cases/gemini-watermark-remover-after.webp",
  },
  {
    tag: "logo and sticker remover",
    title: "Logo & Sticker Remover",
    description:
      "Wipe brand marks, TV bugs, and sticker-like overlays. The demo shows a logo cleanup — upload your own screenshot for stickers and emoji.",
    bullets: [
      "Clothing, packaging, and broadcast logos",
      "Stickers, emoji, and social overlays",
    ],
    ctaLabel: "Try Logo & Sticker Remover free",
    ctaHref: hrefForDemoTab("Sticker"),
    beforeImage: "/cases/logo-remover-before.webp",
    afterImage: "/cases/logo-remover-after.webp",
  },
];

export default function Home() {
  return (
    <main>
      <Hero />
      <RemoveTypes />
      <AIGeneratorPromo />
      <CoverHookPromo />
      {featureSections.map((feature, index) => (
        <FeatureDetail
          key={feature.tag}
          tag={feature.tag}
          title={feature.title}
          description={feature.description}
          bullets={feature.bullets}
          ctaLabel={feature.ctaLabel}
          ctaHref={feature.ctaHref}
          beforeImage={feature.beforeImage}
          afterImage={feature.afterImage}
          reverse={index % 2 === 1}
        />
      ))}
      <HowItWorks />
      <WhyUs />
      <Limitations />
      <FAQ />
    </main>
  );
}
