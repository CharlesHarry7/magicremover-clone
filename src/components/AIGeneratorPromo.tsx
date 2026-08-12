import Link from "next/link";

export default function AIGeneratorPromo() {
  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-4xl rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary-light to-white p-8 sm:p-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">New</span>
        </div>
        <h3 className="mb-3 text-xl font-bold sm:text-2xl">
          Need a picture you don&apos;t have? Generate one.
        </h3>
        <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted">
          Describe a scene and get an original image — no watermark and no stock licence to worry about. 3 credits an image, or attach reference photos to steer the style.
        </p>
        <Link
          href="/ai-image-generator"
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Try the AI image generator →
        </Link>
      </div>
    </section>
  );
}