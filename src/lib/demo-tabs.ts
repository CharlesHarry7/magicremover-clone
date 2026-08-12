/** Demo category tabs in the Hero before/after gallery. */

export const DEMO_TABS = [
  "People",
  "Object",
  "Text",
  "Watermark",
  "Sticker",
] as const;

export type DemoTab = (typeof DEMO_TABS)[number];

export const DEMO_TAB_SLUG: Record<DemoTab, string> = {
  People: "people",
  Object: "object",
  Text: "text",
  Watermark: "watermark",
  Sticker: "sticker",
};

const SLUG_TO_TAB: Record<string, DemoTab> = {
  people: "People",
  person: "People",
  object: "Object",
  text: "Text",
  watermark: "Watermark",
  gemini: "Watermark",
  sticker: "Sticker",
  logo: "Sticker",
  eraser: "Object",
};

export function demoTabFromSlug(slug: string | null | undefined): DemoTab | null {
  if (!slug) return null;
  return SLUG_TO_TAB[slug.trim().toLowerCase()] ?? null;
}

/** Deep-link into the Hero demo for a category. */
export function hrefForDemoTab(tab: DemoTab): string {
  return `/?tab=${DEMO_TAB_SLUG[tab]}#try`;
}

export function syncDemoTabInUrl(tab: DemoTab) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("tab", DEMO_TAB_SLUG[tab]);
  url.hash = "try";
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
