import Link from "next/link";
import { CheckIcon } from "lucide-react";

import SafeImage from "@/components/SafeImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        <div className="relative flex-1 overflow-hidden rounded-xl bg-muted">
          <SafeImage
            src={beforeImage}
            alt={`${title} — before`}
            width={600}
            height={450}
            sizes="(max-width: 640px) 100vw, 400px"
            loadingLabel="示例加载中"
            fallbackLabel="示例暂不可用"
            className="h-full w-full object-cover"
          />
          <Badge className="absolute left-2 top-2 bg-black/60 text-white hover:bg-black/60">
            Before
          </Badge>
        </div>
        <div className="relative flex-1 overflow-hidden rounded-xl bg-muted">
          <SafeImage
            src={afterImage}
            alt={`${title} — after`}
            width={600}
            height={450}
            sizes="(max-width: 640px) 100vw, 400px"
            loadingLabel="示例加载中"
            fallbackLabel="示例暂不可用"
            className="h-full w-full object-cover"
          />
          <Badge className="absolute left-2 top-2 bg-success/80 text-white hover:bg-success/80">
            After
          </Badge>
        </div>
      </div>
    </div>
  );

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div
          className={`flex flex-col gap-8 lg:flex-row lg:items-center ${
            reverse ? "lg:flex-row-reverse" : ""
          }`}
        >
          {imageSection}
          <div className="flex-1">
            <Badge
              variant="secondary"
              className="mb-3 bg-primary-light text-primary hover:bg-primary-light"
            >
              {tag}
            </Badge>
            <h3 className="mb-3 text-2xl font-bold">{title}</h3>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
            <ul className="mb-5 space-y-2">
              {bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  {bullet}
                </li>
              ))}
            </ul>
            <Button size="lg" nativeButton={false} render={<Link href={ctaHref} />}>
              {ctaLabel} →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
