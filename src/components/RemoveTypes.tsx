import Link from "next/link";

const removeTypes = [
  {
    title: "Background People Remover",
    description: "Clear passers-by, tourists, and crowds from your photo without touching the subject.",
    href: "/remove-people-from-photo",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: "AI Object Remover",
    description: "Delete unwanted objects — cables, signs, trash, clutter — while the AI rebuilds the background.",
    href: "/remove-object-from-photo",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  {
    title: "Remove Text from Image",
    description: "Erase captions, date stamps, subtitles, and burned-in labels while keeping the composition.",
    href: "/remove-text-from-image",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    ),
  },
  {
    title: "Remove Watermark from Photo",
    description: "Scrub © stamps, overlays, and signatures off images you own in one brush stroke.",
    href: "/remove-watermark-from-photo",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Logo Remover",
    description: "Wipe brand logos, broadcast bugs, and sponsor badges out of photos and mockups.",
    href: "/logo-remover",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    title: "Sticker & Emoji Remover",
    description: "Scrub stickers, emoji, and overlay graphics off screenshots, memes, and social posts.",
    href: "/remove-sticker-from-image",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function RemoveTypes() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
          What you can remove
        </h2>
        <h3 className="mb-10 text-center text-lg text-muted">
          One AI eraser. Every kind of unwanted pixel.
        </h3>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-relaxed text-muted">
          From tourists in your travel snaps to watermarks on stock photos, MagicRemover handles it in one brush stroke.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {removeTypes.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border border-border bg-white p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                {item.icon}
              </div>
              <h4 className="mb-2 font-semibold">{item.title}</h4>
              <p className="text-sm leading-relaxed text-muted">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}