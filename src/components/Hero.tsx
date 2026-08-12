"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AlertCircleIcon, UploadIcon } from "lucide-react";

import ImageEditor from "./ImageEditor";
import SafeImage from "@/components/SafeImage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DEMO_TABS,
  type DemoTab,
  demoTabFromSlug,
  syncDemoTabInUrl,
} from "@/lib/demo-tabs";
import {
  SERVICE_UNAVAILABLE_EN,
  SERVICE_UNAVAILABLE_ZH,
} from "@/lib/remove-errors";
import { FREE_EDITS, FREE_EDITS_STORY, remainingEditsLabel } from "@/lib/remove-limits";

const beforeAfterImages: Record<
  DemoTab,
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
    label: "Clear logos or sticker-like overlays",
  },
};

function fileFromClipboard(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of Array.from(data.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }
  const file = data.files?.[0];
  if (file?.type.startsWith("image/")) return file;
  return null;
}

export default function Hero() {
  const headingId = useId();
  const statusId = useId();
  const fileInputId = useId();
  const [activeTab, setActiveTab] = useState<DemoTab>("People");
  const [mode, setMode] = useState<"demo" | "editor">("demo");
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRegionRef = useRef<HTMLDivElement>(null);
  const images = beforeAfterImages[activeTab];

  const selectTab = (tab: DemoTab) => {
    setActiveTab(tab);
    setMode("demo");
    syncDemoTabInUrl(tab);
  };

  const openEditor = useCallback((file?: File | null) => {
    setInitialFile(file ?? null);
    setEditorKey((k) => k + 1);
    setMode("editor");
    queueMicrotask(() => {
      editorRegionRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    const applyTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = demoTabFromSlug(params.get("tab"));
      if (!fromQuery) return;
      queueMicrotask(() => {
        setActiveTab(fromQuery);
        setMode("demo");
      });
    };
    applyTabFromUrl();
    window.addEventListener("popstate", applyTabFromUrl);
    return () => window.removeEventListener("popstate", applyTabFromUrl);
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (mode !== "demo") return;
      const file = fileFromClipboard(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      openEditor(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [mode, openEditor]);

  return (
    <section
      id="try"
      aria-labelledby={headingId}
      className="scroll-mt-24 bg-gradient-to-b from-primary-light/60 to-background px-4 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          <Badge
            variant="secondary"
            className="bg-success/10 text-success hover:bg-success/10"
          >
            {FREE_EDITS_STORY}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-success/10 text-success hover:bg-success/10"
          >
            No signup
          </Badge>
          <Badge
            variant="secondary"
            className="bg-success/10 text-success hover:bg-success/10"
          >
            HD download in demo
          </Badge>
        </div>

        <h1
          id={headingId}
          className="mx-auto mb-4 max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
        >
          AI Object Remover — Erase Anything from Your Photos
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-muted-foreground">
          Brush any object, person, text, or watermark out of a photo — no
          signup and no watermark on the result. This page is a free demo:{" "}
          {FREE_EDITS_STORY}.
        </p>

        <div className="mb-8 flex w-full max-w-full items-center gap-2 sm:justify-center">
          <div className="min-w-0 flex-1 overflow-x-auto sm:flex-none sm:overflow-visible">
            <ToggleGroup
              variant="outline"
              spacing={1}
              aria-label="Demo removal category"
              className="flex w-max flex-nowrap justify-start gap-1 rounded-full bg-muted/80 p-1 sm:w-fit sm:flex-wrap sm:justify-center"
              value={mode === "demo" ? [activeTab] : []}
              onValueChange={(group) => {
                const next = group[0] as DemoTab | undefined;
                if (!next || !DEMO_TABS.includes(next)) return;
                selectTab(next);
              }}
            >
              {DEMO_TABS.map((tab) => (
                <ToggleGroupItem
                  key={tab}
                  value={tab}
                  aria-label={`Show ${tab} before and after demo`}
                  className="shrink-0 rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
                >
                  {tab}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Button
            variant={mode === "editor" ? "default" : "outline"}
            className="shrink-0 rounded-full"
            aria-pressed={mode === "editor"}
            onClick={() => openEditor()}
          >
            Try It
          </Button>
        </div>

        {serviceUnavailable && mode === "demo" ? (
          <Alert
            variant="destructive"
            className="sticky top-[3.25rem] z-40 mx-auto mb-4 max-w-4xl"
          >
            <AlertCircleIcon />
            <AlertTitle>{SERVICE_UNAVAILABLE_ZH}</AlertTitle>
            <AlertDescription>{SERVICE_UNAVAILABLE_EN}</AlertDescription>
          </Alert>
        ) : null}

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
                    <SafeImage
                      src={images.before}
                      alt={`Example ${activeTab.toLowerCase()} removal — before`}
                      width={600}
                      height={450}
                      sizes="(max-width: 640px) 100vw, 400px"
                      priority
                      className="h-full w-full object-cover"
                    />
                    <Badge className="absolute left-2 top-2 bg-black/60 text-white hover:bg-black/60">
                      Before
                    </Badge>
                  </figure>
                  <figure className="relative flex-1 overflow-hidden rounded-xl bg-muted">
                    <SafeImage
                      src={images.after}
                      alt={`Example ${activeTab.toLowerCase()} removal — after`}
                      width={600}
                      height={450}
                      sizes="(max-width: 640px) 100vw, 400px"
                      priority
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
                      or click / paste · JPG / PNG / WebP · up to ~10 MB
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
                      title={FREE_EDITS_STORY}
                    >
                      {remainingEditsLabel(FREE_EDITS)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
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
                <ImageEditor
                  key={editorKey}
                  initialFile={initialFile}
                  onServiceUnavailable={() => setServiceUnavailable(true)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
