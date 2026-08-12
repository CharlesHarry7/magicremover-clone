"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import ImageEditor from "./ImageEditor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabKeys = ["People", "Object", "Text", "Watermark", "Sticker"] as const;

const beforeAfterImages: Record<string, { before: string; after: string; label: string }> = {
  People: {
    before: "/cases/remove-people-before01.webp",
    after: "/cases/remove-people-after01.webp",
    label: "Clear people from the background",
  },
  Object: {
    before: "/cases/remove-object-before02.webp",
    after: "/cases/remove-object-after02.webp",
    label: "Clear objects from the background",
  },
  Text: {
    before: "/cases/text-remover-before.webp",
    after: "/cases/text-remover-after.webp",
    label: "Clear text from the image",
  },
  Watermark: {
    before: "/cases/gemini-watermark-remover-before.webp",
    after: "/cases/gemini-watermark-remover-after.webp",
    label: "Clear watermark from the photo",
  },
  Sticker: {
    before: "/cases/logo-remover-before.webp",
    after: "/cases/logo-remover-after.webp",
    label: "Clear stickers from the image",
  },
};

export default function Hero() {
  const [activeTab, setActiveTab] = useState("People");
  const [mode, setMode] = useState<"demo" | "editor">("demo");
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const images = beforeAfterImages[activeTab];

  const openEditor = (file?: File | null) => {
    setInitialFile(file ?? null);
    setEditorKey((k) => k + 1);
    setMode("editor");
  };

  return (
    <section id="try" className="bg-gradient-to-b from-primary-light/50 to-white px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">100% Free</Badge>
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Forever Free</Badge>
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">No Login</Badge>
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">HD Download</Badge>
        </div>

        <h1 className="mx-auto mb-4 max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Free AI Object Remover — Erase Anything from Your Photos
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-muted-foreground">
          Erase anything from your photos in seconds. Brush any object, person, text, or watermark out of a photo — no signup, no watermark. 2 free edits a day.
        </p>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <Tabs value={mode === "demo" ? activeTab : "try"} onValueChange={(v) => {
            if (v === "try") {
              openEditor();
            } else {
              setActiveTab(v);
              setMode("demo");
            }
          }}>
            <TabsList variant="default" className="flex-wrap gap-1">
              {tabKeys.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
              <TabsTrigger value="try">Try It</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="mx-auto max-w-4xl shadow-lg">
          <CardContent className="p-4 sm:p-6">
            {mode === "demo" ? (
              <>
                <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-100">
                    <Image
                      src={images.before}
                      alt={`${activeTab} — before`}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Before</span>
                  </div>
                  <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-100">
                    <Image
                      src={images.after}
                      alt={`${activeTab} — after`}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded bg-success/80 px-2 py-0.5 text-xs text-white">After</span>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Before</span>
                  <span>/</span>
                  <span>After</span>
                </div>

                <p className="mb-4 text-center text-sm text-muted-foreground">{images.label}</p>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      1
                    </span>
                    <span className="text-sm font-medium">Upload your photo</span>
                  </div>
                  <div
                    className="cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) openEditor(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-1 text-sm font-medium">Drop a photo here</p>
                    <p className="text-xs text-muted-foreground">or click to browse · JPG / PNG · up to ~10 MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) openEditor(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      Free today 2 / 2
                    </Badge>
                    <button
                      type="button"
                      onClick={() => openEditor()}
                      className="font-medium text-primary hover:underline"
                    >
                      Open editor →
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <ImageEditor key={editorKey} initialFile={initialFile} />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}