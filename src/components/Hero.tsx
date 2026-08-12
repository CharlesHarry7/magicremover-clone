"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadIcon } from "lucide-react";

import ImageEditor from "./ImageEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = ["People", "Object", "Text", "Watermark", "Sticker"] as const;

const beforeAfterImages: Record<
  (typeof tabs)[number],
  { before: string; after: string; label: string }
> = {
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
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("People");
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
    <section
      id="try"
      className="bg-gradient-to-b from-primary-light/60 to-background px-4 py-12 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          <Badge
            variant="secondary"
            className="bg-success/10 text-success hover:bg-success/10"
          >
            100% Free
          </Badge>
          <Badge
            variant="secondary"
            className="bg-success/10 text-success hover:bg-success/10"
          >
            Forever Free
          </Badge>
          <Badge
            variant="secondary"
            className="bg-success/10 text-success hover:bg-success/10"
          >
            No Login
          </Badge>
          <Badge
            variant="secondary"
            className="bg-success/10 text-success hover:bg-success/10"
          >
            HD Download
          </Badge>
        </div>

        <h1 className="mx-auto mb-4 max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Free AI Object Remover — Erase Anything from Your Photos
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-muted-foreground">
          Erase anything from your photos in seconds. Brush any object, person,
          text, or watermark out of a photo — no signup, no watermark. 2 free
          edits a day.
        </p>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              if (typeof value === "string" && tabs.includes(value as (typeof tabs)[number])) {
                setActiveTab(value as (typeof tabs)[number]);
                setMode("demo");
              }
            }}
          >
            <TabsList className="flex h-auto flex-wrap justify-center gap-1 bg-muted/80 p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-full px-4 data-active:bg-primary data-active:text-primary-foreground"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            variant={mode === "editor" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => openEditor()}
          >
            Try It
          </Button>
        </div>

        <Card className="mx-auto max-w-4xl py-0 shadow-lg ring-border">
          <CardContent className="p-4 sm:p-6">
            {mode === "demo" ? (
              <>
                <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1 overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={images.before}
                      alt={`${activeTab} — before`}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover"
                    />
                    <Badge className="absolute left-2 top-2 bg-black/60 text-white hover:bg-black/60">
                      Before
                    </Badge>
                  </div>
                  <div className="relative flex-1 overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={images.after}
                      alt={`${activeTab} — after`}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover"
                    />
                    <Badge className="absolute left-2 top-2 bg-success/80 text-white hover:bg-success/80">
                      After
                    </Badge>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Before</span>
                  <span>/</span>
                  <span>After</span>
                </div>

                <p className="mb-4 text-center text-sm text-muted-foreground">
                  {images.label}
                </p>

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
                    <UploadIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="mb-1 text-sm font-medium">Drop a photo here</p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse · JPG / PNG · up to ~10 MB
                    </p>
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
                    <Badge
                      variant="secondary"
                      className="bg-success/10 text-success hover:bg-success/10"
                    >
                      Free today 2 / 2
                    </Badge>
                    <Button
                      variant="link"
                      className="h-auto px-0"
                      onClick={() => openEditor()}
                    >
                      Open editor →
                    </Button>
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
