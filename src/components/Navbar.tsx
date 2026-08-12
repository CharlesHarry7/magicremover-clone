"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";

const navLinks = [
  { href: "/ai-image-generator", label: "AI Image Generator" },
  { href: "/edit-text-in-image", label: "Edit Text" },
  { href: "#", label: "Image Tools" },
  { href: "#", label: "Video Tools" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.webp" alt="MagicRemover" width={32} height={32} className="h-8 w-8" />
          <span className="text-lg font-bold">MagicRemover</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="outline" size="sm">
            English
          </Button>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <button
                className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Toggle menu"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            }
          />
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 mt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button variant="outline" size="sm" className="w-fit">
                English
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}