"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";

import SafeImage from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { handleSamePageHashNav } from "@/lib/scroll-to-id";
import { NAV_LINKS } from "@/lib/site-links";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const onHashLinkClick = (
    href: string,
    event: React.MouseEvent<HTMLElement>
  ) => {
    const handled = handleSamePageHashNav(href, event);
    if (handled) setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <SafeImage
            src="/logo.webp"
            alt="MagicRemover"
            width={32}
            height={32}
            compact
            className="h-8 w-8"
          />
          <span className="text-lg font-bold">MagicRemover</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.label}
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={link.href} />}
              className="text-muted-foreground"
              onClick={(e) => onHashLinkClick(link.href, e)}
            >
              {link.label}
            </Button>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/#try" />}
            onClick={(e) => onHashLinkClick("/#try", e)}
          >
            Try demo
          </Button>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              />
            }
          >
            <MenuIcon />
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100%,20rem)]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <SafeImage
                  src="/logo.webp"
                  alt=""
                  width={24}
                  height={24}
                  compact
                  className="h-6 w-6"
                />
                MagicRemover
              </SheetTitle>
              <SheetDescription className="sr-only">
                Site navigation
              </SheetDescription>
            </SheetHeader>
            <Separator />
            <div className="flex flex-col gap-1 px-2">
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.label}
                  variant="ghost"
                  className="justify-start text-muted-foreground"
                  nativeButton={false}
                  render={<Link href={link.href} />}
                  onClick={(e) => {
                    onHashLinkClick(link.href, e);
                    setMobileOpen(false);
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </div>
            <Separator />
            <div className="flex flex-col gap-2 px-4 pb-4">
              <Button
                nativeButton={false}
                render={<Link href="/#try" />}
                onClick={(e) => {
                  onHashLinkClick("/#try", e);
                  setMobileOpen(false);
                }}
              >
                Try demo
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
