/** Smooth-scroll to an element id, accounting for sticky header via scroll-mt. */
export function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Same-page hash navigation for `/#try` and `/?tab=people#try`.
 * App Router often skips scroll when already on `/`.
 * Returns true when the click was handled locally.
 */
export function handleSamePageHashNav(
  href: string,
  event?: { preventDefault: () => void }
): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(href, window.location.origin);
  if (url.pathname !== "/" || !url.hash) return false;
  if (window.location.pathname !== "/") return false;

  event?.preventDefault();
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current !== next) {
    window.history.pushState(null, "", next);
    // Notify listeners (e.g. Hero tab sync) without a full reload.
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  const id = url.hash.slice(1);
  window.setTimeout(() => scrollToId(id), 0);
  return true;
}
