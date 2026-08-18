import { hrefForDemoTab } from "@/lib/demo-tabs";

/**
 * Destinations that exist in this clone: homepage demo tabs or StubPage routes.
 * Do not link marketing paths like /magic-eraser or /remove-people-from-photo —
 * those 404 (no page and no stub).
 */
export const NAV_LINKS = [
  { href: "/#try", label: "Object Remover" },
  { href: hrefForDemoTab("People"), label: "Remove People" },
  { href: hrefForDemoTab("Text"), label: "Remove Text" },
  { href: "/ai-image-generator", label: "AI Image Generator" },
] as const;

export const FOOTER_TOOLS = [
  { label: "Remove People from Photo", href: hrefForDemoTab("People") },
  { label: "Remove Watermark from Photo", href: hrefForDemoTab("Watermark") },
  { label: "Remove Object from Photo", href: hrefForDemoTab("Object") },
  { label: "Remove Sticker from Image", href: hrefForDemoTab("Sticker") },
  { label: "Remove Text from Image", href: hrefForDemoTab("Text") },
  { label: "Remove Gemini Watermark", href: hrefForDemoTab("Watermark") },
  { label: "Logo Remover", href: hrefForDemoTab("Sticker") },
  { label: "Magic Eraser", href: hrefForDemoTab("Object") },
  { label: "AI Image Generator", href: "/ai-image-generator" },
  { label: "Edit Text", href: hrefForDemoTab("Text") },
] as const;

export const FOOTER_GUIDES = [
  { label: "Blog", href: "/blog" },
  {
    label: "How to Remove People from a Photo",
    href: "/blog/how-to-remove-people-from-a-photo",
  },
] as const;

export const FOOTER_COMPANY = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
] as const;
