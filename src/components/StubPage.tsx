import Link from "next/link";
import { ArrowLeftIcon, SparklesIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface StubPageProps {
  title: string;
  description: string;
  badge?: string;
  bullets?: string[];
}

export default function StubPage({
  title,
  description,
  badge = "Not built in this clone",
  bullets,
}: StubPageProps) {
  return (
    <main className="bg-gradient-to-b from-primary-light/40 to-background px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-muted-foreground"
          nativeButton={false}
          render={<Link href="/" />}
        >
          <ArrowLeftIcon />
          Home
        </Button>

        <Card className="shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="mb-2 w-fit">
              {badge}
            </Badge>
            <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>

          {bullets && bullets.length > 0 ? (
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {bullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          ) : null}

          <Separator />

          <CardFooter className="flex flex-wrap gap-3 border-0 bg-transparent">
            <Button size="lg" nativeButton={false} render={<Link href="/#try" />}>
              <SparklesIcon />
              Open object remover
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Back to home
            </Button>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Working product on this clone: upload → brush → remove → download.
          Other marketing pages stay stubs on purpose.
        </p>
      </div>
    </main>
  );
}
