import Link from "next/link";

import { Button } from "@/components/ui/button";

interface StubPageProps {
  title: string;
  description: string;
}

export default function StubPage({ title, description }: StubPageProps) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl flex-col justify-center px-4 py-16">
      <p className="mb-2 text-sm font-medium text-muted-foreground">
        Clone stub
      </p>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mb-8 text-base leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" nativeButton={false} render={<Link href="/#try" />}>
          Try the object remover
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Back home
        </Button>
      </div>
    </main>
  );
}
