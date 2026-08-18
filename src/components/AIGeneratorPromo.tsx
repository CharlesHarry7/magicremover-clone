import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AIGeneratorPromo() {
  return (
    <section className="border-y border-border/70 bg-secondary/40 px-4 py-12 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="secondary" className="mb-3">
          Coming soon
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          AI Image Generator
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Text-to-image is not live in this clone. Object removal is the working
          product path.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button size="sm" nativeButton={false} render={<Link href="/#try" />}>
            Use object remover
          </Button>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/ai-image-generator" />}
          >
            Roadmap note
          </Button>
        </div>
      </div>
    </section>
  );
}
