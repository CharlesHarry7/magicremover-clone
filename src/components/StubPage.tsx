import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StubPageProps {
  title: string;
  description: string;
  badge?: string;
}

export default function StubPage({
  title,
  description,
  badge = "Stub",
}: StubPageProps) {
  return (
    <main className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
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

        <Card>
          <CardHeader>
            <Badge variant="secondary" className="mb-2 w-fit">
              {badge}
            </Badge>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
          <CardFooter className="border-0 bg-transparent">
            <Button nativeButton={false} render={<Link href="/#try" />}>
              Open object remover
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
