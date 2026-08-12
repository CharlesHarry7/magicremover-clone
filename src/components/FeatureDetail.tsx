import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FeatureDetailProps {
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  beforeImage: string;
  afterImage: string;
  reverse?: boolean;
}

export default function FeatureDetail({
  tag,
  title,
  description,
  bullets,
  ctaLabel,
  ctaHref,
  beforeImage,
  afterImage,
  reverse = false,
}: FeatureDetailProps) {
  const imageSection = (
    <div className="flex-1">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={beforeImage}
            alt={`${title} — before`}
            width={600}
            height={450}
            className="h-full w-full object-cover"
          />
          <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Before</span>
        </div>
        <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={afterImage}
            alt={`${title} — after`}
            width={600}
            height={450}
            className="h-full w-full object-cover"
          />
          <span className="absolute left-2 top-2 rounded bg-success/80 px-2 py-0.5 text-xs text-white">After</span>
        </div>
      </div>
    </div>
  );

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className={`flex flex-col gap-8 lg:flex-row lg:items-center ${reverse ? "lg:flex-row-reverse" : ""}`}>
          {imageSection}
          <div className="flex-1">
            <Badge variant="secondary" className="mb-3 bg-primary-light text-primary border-primary/20">
              {tag}
            </Badge>
            <h3 className="mb-3 text-2xl font-bold">{title}</h3>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <ul className="mb-5 space-y-2">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {bullet}
                </li>
              ))}
            </ul>
            <Link href={ctaHref}>
              <Button>
                {ctaLabel} →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}