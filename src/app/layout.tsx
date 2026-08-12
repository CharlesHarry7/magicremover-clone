import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { PRODUCTION_SITE_URL, getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl() || PRODUCTION_SITE_URL;

const title =
  "AI Object Remover Demo — No Signup, No Watermark | MagicRemover";
const description =
  "Erase unwanted objects, people, text, or watermarks from photos. Upload, brush a mask, run AI remove, compare before/after, and download. Free session demo — no signup.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | MagicRemover",
  },
  description,
  applicationName: "MagicRemover",
  keywords: [
    "AI object remover",
    "remove object from photo",
    "remove people from photo",
    "remove watermark",
    "magic eraser",
    "inpainting",
  ],
  authors: [{ name: "MagicRemover" }],
  creator: "MagicRemover",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "MagicRemover",
    title,
    description,
    images: [
      {
        url: "/cases/remove-people-after01.webp",
        width: 1184,
        height: 896,
        alt: "MagicRemover before/after object removal example",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/cases/remove-people-after01.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
  // app/icon.png, app/apple-icon.png, and app/favicon.ico are generated from the brand logo.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#try"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow focus:ring-2 focus:ring-ring"
        >
          Skip to object remover
        </a>
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
