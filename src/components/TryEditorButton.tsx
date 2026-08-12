"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { handleSamePageHashNav } from "@/lib/scroll-to-id";

export default function TryEditorButton({
  children = "Open the editor",
  href = "/#try",
  className,
}: {
  children?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <Button
      size="lg"
      className={className}
      nativeButton={false}
      render={<Link href={href} />}
      onClick={(e) => handleSamePageHashNav(href, e)}
    >
      {children}
    </Button>
  );
}
