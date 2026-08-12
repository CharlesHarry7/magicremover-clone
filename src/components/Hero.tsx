"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { UploadIcon } from "lucide-react";

import ImageEditor from "./ImageEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  const headingId = useId();
  const statusId = useId();
  const fileInputId = useId();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("People");
  const [mode, setMode] = useState<"demo" | "editor">("demo");
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRegionRef = useRef<HTMLDivElement>(null);
  const images = beforeAfterImages[activeTab];

  const openEditor = (file?: File | null) => {
    setInitialFile(file ?? null);
    setEditorKey((k) => k + 1);
    setMode("editor");
    queueMicrotask(() => {
      editorRegionRef.current?.focus();
    });
  };

  return (
    <section
      id="try"
      aria-labelledby={headingId}
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

        <h1
          id={headingId}
          className="mx-auto mb-4 max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
        >
          Free AI Object Remover — Erase Anything from Your Photos
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-muted-foreground">
          Erase anything from your photos in seconds. Brush any object, person,
          text, or watermark out of a photo — no signup, no watermark. Two demo
          edits per browser session.
        </p>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <ToggleGroup
            variant="outline"
            spacing={1}
            aria-label="Demo removal category"
            className="flex flex-wrap justify-center rounded-full bg-muted/80 p-1"
            value={mode === "demo" ? [activeTab] : []}
            onValueChange={(group) => {
              const next = group[0] as (typeof tabs)[number] | undefined;
              if (!next || !tabs.includes(next)) return;
              setActiveTab(next);
              setMode("demo");
            }}
          >
            {tabs.map((tab) => (
              <ToggleGroupItem
                key={tab}
                value={tab}
                aria-label={`Show ${tab} before and after demo`}
                className="rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
              >
                {tab}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            variant={mode === "editor" ? "default" : "outline"}
            className="rounded-full"
            aria-pressed={mode === "editor"}
            onClick={() => openEditor()}
          >
            Try It
          </Button>
        </div>

        <p id={statusId} className="sr-only" aria-live="polite">
          {mode === "editor"
            ? "Object remover editor is open."
            : `${activeTab} before and after demo is showing.`}
        </p>

        <Card className="mx-auto max-w-4xl py-0 shadow-lg ring-border">
          <CardContent className="p-4 sm:p-6">
            {mode === "demo" ? (
              <>
                <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                  <figure className="relative flex-1 overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={images.before}
                      alt={`Example ${activeTab.toLowerCase()} removal — before`}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover"
                    />
                    <Badge className="absolute left-2 top-2 bg-black/60 text-white hover:bg-black/60">
                      Before
                    </Badge>
                  </figure>
                  <figure className="relative flex-1 overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={images.after}
                      alt={`Example ${activeTab.toLowerCase()} removal — after`}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover"
                    />
                    <Badge className="absolute left-2 top-2 bg-success/80 text-white hover:bg-success/80">
                      After
                    </Badge>
                  </figure>
                </div>

                <p className="mb-4 text-center text-sm text-muted-foreground">
                  {images.label}
                </p>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                    >
                      1
                    </span>
                    <label
                      htmlFor={fileInputId}
                      className="text-sm font-medium"
                    >
                      Upload your photo
                    </label>
                  </div>
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) openEditor(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload a photo to open the object remover"
                    aria-describedby={statusId}
                  >
                    <UploadIcon
                      className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40"
                      aria-hidden="true"
                    />
                    <p className="mb-1 text-sm font-medium">Drop a photo here</p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse · JPG / PNG / WebP · up to ~10 MB
                    </p>
                  </button>
                  <input
                    id={fileInputId}
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) openEditor(file);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge
                      variant="secondary"
                      className="bg-success/10 text-success hover:bg-success/10"
                    >
                      Demo edits 2 / 2
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
              <div
                ref={editorRegionRef}
                tabIndex={-1}
                className="outline-none"
                aria-label="Object remover editor"
              >
                <ImageEditor key={editorKey} initialFile={initialFile} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
