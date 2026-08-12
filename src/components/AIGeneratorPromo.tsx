import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AIGeneratorPromo() {
  return (
    <section className="px-4 py-12">
      <Card className="mx-auto max-w-4xl border-2 border-primary/20 bg-gradient-to-br from-primary-light to-background py-0 shadow-none ring-0">
        <CardContent className="p-8 sm:p-12">
          <Badge className="mb-4">New</Badge>
          <h3 className="mb-3 text-xl font-bold sm:text-2xl">
            Need a picture you don&apos;t have? Generate one.
          </h3>
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Describe a scene and get an original image — no watermark and no
            stock licence to worry about. 3 credits an image, or attach
            reference photos to steer the style.
          </p>
          <Button size="lg" render={<Link href="/ai-image-generator" />}>
            Try the AI image generator →
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
