import Hero from "@/components/Hero";
import RemoveTypes from "@/components/RemoveTypes";
import AIGeneratorPromo from "@/components/AIGeneratorPromo";
import CoverHookPromo from "@/components/CoverHookPromo";
import FeatureDetail from "@/components/FeatureDetail";
import HowItWorks from "@/components/HowItWorks";
import WhyUs from "@/components/WhyUs";
import Limitations from "@/components/Limitations";
import FAQ from "@/components/FAQ";

const featureSections = [
  {
    tag: "background people remover",
    title: "Background People Remover",
    description:
      "The background people remover clears photobombers, tourists, and background pedestrians from your photo while the subject stays crisp. Brush every unwanted person — even clusters of them — and the AI fills in sky, water, wall, or sidewalk in their place. Great for travel shots, venue photography, and candid portraits.",
    bullets: [
      "Single photobombers behind your subject",
      "Dense tourist and concert crowds",
      "Pedestrians and onlookers along the street",
    ],
    ctaLabel: "Try Background People Remover free",
    ctaHref: "/#try",
    beforeImage: "/cases/remove-people-before01.webp",
    afterImage: "/cases/remove-people-after01.webp",
  },
  {
    tag: "ai object remover",
    title: "AI Object Remover",
    description:
      "An AI object remover erases any unwanted object from a photo in seconds. Paint over the item — a trash can, power line, parked car, or dropped cable — and MagicRemover predicts the pixels that belong behind it, stitching a realistic background back together.",
    bullets: [
      "Street clutter, cables, and construction debris",
      "Dropped gear, bags, and random foreground objects",
      "Parked vehicles, traffic cones, and signage posts",
    ],
    ctaLabel: "Try AI Object Remover free",
    ctaHref: "/#try",
    beforeImage: "/cases/remove-object-before02.webp",
    afterImage: "/cases/remove-object-after02.webp",
  },
  {
    tag: "remove text from image",
    title: "Remove Text from Image",
    description:
      "MagicRemover lets you remove text from any image — date stamps, subtitles, captions, meme text, and burned-in watermark phrases. The AI recovers the pixels underneath so the original framing and subject stay intact. Perfect for cleaning screenshots, scanned memorabilia, and dated family snapshots.",
    bullets: [
      "Camera date and timestamp overlays",
      "Subtitles, captions, and meme typography",
      "Copyright notices and attribution strips",
    ],
    ctaLabel: "Try Remove Text from Image free",
    ctaHref: "/#try",
    beforeImage: "/cases/text-remover-before.webp",
    afterImage: "/cases/text-remover-after.webp",
  },
  {
    tag: "remove watermark from photo",
    title: "Remove Watermark from Photo",
    description:
      "MagicRemover lets you remove the watermark from any photo — copyright stamps, diagonal overlays, artist signatures, and burned-in logos. The AI inpainting model reconstructs the background texture — sky, wall, foliage — so the final photo looks untouched. Only remove watermarks from images you have the right to edit.",
    bullets: [
      "Diagonal text watermarks and © marks",
      "Corner studio signatures and stamps",
      "Semi-transparent overlays across full images",
    ],
    ctaLabel: "Try Remove Watermark from Photo free",
    ctaHref: "/#try",
    beforeImage: "/cases/gemini-watermark-remover-before.webp",
    afterImage: "/cases/gemini-watermark-remover-after.webp",
  },
  {
    tag: "logo remover",
    title: "Logo Remover",
    description:
      "The logo remover tool cleans brand marks, TV bugs, and sponsor patches off photos. It works on clothing, packaging, storefronts, and broadcast stills — ideal for product mockups, royalty-free asset cleanup, and design previews where brand associations must be removed.",
    bullets: [
      "T-shirt, hat, and jersey logos",
      "Live broadcast TV station bugs and tickers",
      "Billboards, storefronts, and packaging brand marks",
    ],
    ctaLabel: "Try Logo Remover free",
    ctaHref: "/#try",
    beforeImage: "/cases/logo-remover-before.webp",
    afterImage: "/cases/logo-remover-after.webp",
  },
  {
    tag: "sticker remover",
    title: "Sticker & Emoji Remover",
    description:
      "A sticker and emoji remover erases pasted-on graphics — Instagram stickers, Snapchat overlays, emoji reactions, chat bubbles, and censor bars — from any screenshot or photo. MagicRemover recovers the pixels underneath so the original content shows through intact. Ideal for recovering clean social media screenshots and cleaning up chat captures.",
    bullets: [
      "Instagram, Snapchat, and TikTok stickers",
      "Emoji reactions pasted over faces",
      "Chat bubble balloons and message overlays",
    ],
    ctaLabel: "Try Sticker & Emoji Remover free",
    ctaHref: "/#try",
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
