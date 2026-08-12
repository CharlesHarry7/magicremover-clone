import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AIGeneratorPromo() {
  return (
    <section className="px-4 py-12">
      <Card className="mx-auto max-w-4xl border-2 border-primary/20 bg-gradient-to-br from-primary-light to-background py-0 shadow-none ring-0">
        <CardContent className="p-8 sm:p-12">
          <Badge variant="secondary" className="mb-4">
            Stub route
          </Badge>
          <h3 className="mb-3 text-xl font-bold sm:text-2xl">
            Need a picture you don&apos;t have?
          </h3>
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            The AI image generator page exists so nav links do not 404, but it
            is not wired to a model. Clean a photo you already have with the
            object remover instead.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/#try" />}>
              Open object remover →
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/ai-image-generator" />}
            >
              Read generator stub
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
