"use client";

import Link from "next/link";

import { handleSamePageHashNav } from "@/lib/scroll-to-id";
import { cn } from "@/lib/utils";

export default function HashNavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onClick={(e) => handleSamePageHashNav(href, e)}
    >
      {children}
    </Link>
  );
}
