"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/ai-image-generator", label: "AI Image Generator" },
  { href: "/edit-text-in-image", label: "Edit Text" },
  { href: "#try", label: "Image Tools" },
  { href: "#try", label: "Video Tools" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.webp"
            alt="MagicRemover"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-lg font-bold">MagicRemover</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Button
              key={link.label}
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={link.href} />}
              className="text-muted-foreground"
            >
              {link.label}
            </Button>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="outline" size="sm">
            English
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="#try" />}>
            Try free
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
                <Image
                  src="/logo.webp"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
                MagicRemover
              </SheetTitle>
            </SheetHeader>
            <Separator />
            <div className="flex flex-col gap-1 px-2">
              {navLinks.map((link) => (
                <Button
                  key={link.label}
                  variant="ghost"
                  className="justify-start text-muted-foreground"
                  nativeButton={false}
                  render={<Link href={link.href} />}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Button>
              ))}
            </div>
            <Separator />
            <div className="flex flex-col gap-2 px-4 pb-4">
              <Button variant="outline">English</Button>
              <Button
                nativeButton={false}
                render={<Link href="#try" />}
                onClick={() => setMobileOpen(false)}
              >
                Try free
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
