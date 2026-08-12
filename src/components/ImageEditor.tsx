"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  AlertCircleIcon,
  DownloadIcon,
  EraserIcon,
  ImagePlusIcon,
  Loader2Icon,
  RotateCcwIcon,
  UploadIcon,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface ImageEditorProps {
  onResult?: (resultUrl: string) => void;
  initialFile?: File | null;
}

const FREE_EDITS = 2;
const MAX_UNDO = 40;
const BRUSH_PRESETS = [12, 30, 50] as const;

function formatRemoveApiError(
  status: number,
  data: { error?: string; code?: string }
): string {
  const code = data.code;
  if (code === "MISSING_API_KEY") {
    return (
      data.error ||
      "Object removal is not configured on the server (HTTP 503)."
    );
  }
  if (code === "PREDICTION_TIMEOUT" || status === 504) {
    return (
      data.error ||
      "Removal timed out on the Worker (~30s budget). Try a smaller image."
    );
  }
  if (code === "PAYLOAD_TOO_LARGE" || status === 413) {
    return (
      data.error ||
      "That photo is too large for the Worker. Use a file under ~10 MB."
    );
  }
  if (code === "REPLICATE_RATE_LIMIT" || status === 429) {
    return (
      data.error ||
      "Removal provider is rate-limiting requests. Try again shortly."
    );
  }
  return data.error || `Failed to process image (HTTP ${status})`;
}

function BeforeAfterCompare({
  beforeUrl,
  afterUrl,
  maskPreviewUrl,
  showMask,
}: {
  beforeUrl: string;
  afterUrl: string;
  maskPreviewUrl: string;
  showMask: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [width, setWidth] = useState(0);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(96, Math.max(4, next)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const sync = () => setWidth(el.clientWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [updateFromClientX]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-[4/3] w-full max-w-[800px] overflow-hidden rounded-xl bg-muted select-none"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("[data-compare-handle]")) return;
        dragging.current = true;
        updateFromClientX(e.clientX);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt="After"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt="Before"
          className="absolute inset-y-0 left-0 h-full max-w-none object-contain"
          style={{ width: width || "100%" }}
          draggable={false}
        />
        {showMask && maskPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={maskPreviewUrl}
            alt=""
            className="pointer-events-none absolute inset-y-0 left-0 h-full max-w-none object-contain opacity-50"
            style={{ width: width || "100%" }}
            draggable={false}
          />
        ) : null}
      </div>

      <div
        className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
        style={{ left: `${position}%` }}
      >
        <button
          type="button"
          data-compare-handle
          aria-label="Drag to compare before and after"
          className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-border bg-background text-xs font-semibold shadow-md"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragging.current = true;
            updateFromClientX(e.clientX);
          }}
        >
          ↔
        </button>
      </div>

      <Badge className="absolute left-2 top-2 z-20 bg-black/60 text-white hover:bg-black/60">
        Before
      </Badge>
      <Badge className="absolute right-2 top-2 z-20 bg-success/80 text-white hover:bg-success/80">
        After
      </Badge>
    </div>
  );
}

export default function ImageEditor({ onResult, initialFile }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string>("");
  const [maskPreviewUrl, setMaskPreviewUrl] = useState<string>("");
  const [dailyLeft, setDailyLeft] = useState(FREE_EDITS);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [hasMask, setHasMask] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [compareMode, setCompareMode] = useState<"side" | "slider">("slider");
  const [showMaskOnBefore, setShowMaskOnBefore] = useState(true);
  const [stageWidth, setStageWidth] = useState(0);

  const maskHasPaint = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return false;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] > 10) return true;
    }
    return false;
  }, []);

  const clearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    setDrawingHistory([]);
    setHasMask(false);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10 MB.");
      return;
    }

    setError(null);
    setResultUrl(null);
    setMaskPreviewUrl("");
    setHasMask(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const maxDim = 1536;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!canvas || !maskCanvas) return;

        canvas.width = w;
        canvas.height = h;
        maskCanvas.width = w;
        maskCanvas.height = h;
        setCanvasSize({ w, h });

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
        }

        const maskCtx = maskCanvas.getContext("2d");
        if (maskCtx) {
          maskCtx.clearRect(0, 0, w, h);
        }

        setDrawingHistory([]);
        setImage(img);
        setBeforeUrl(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    if (!initialFile) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) handleFileUpload(initialFile);
    });
    return () => {
      cancelled = true;
    };
  }, [initialFile, handleFileUpload]);

  // Re-paint after result view unmounts canvases (e.g. Edit Again).
  useEffect(() => {
    if (!image || resultUrl || !canvasSize.w) return;
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    if (canvas.width !== canvasSize.w || canvas.height !== canvasSize.h) {
      canvas.width = canvasSize.w;
      canvas.height = canvasSize.h;
      maskCanvas.width = canvasSize.w;
      maskCanvas.height = canvasSize.h;
    }

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
      ctx.drawImage(image, 0, 0, canvasSize.w, canvasSize.h);
    }
  }, [image, resultUrl, canvasSize.w, canvasSize.h]);

  useEffect(() => {
    if (resultUrl || !image) return;
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setStageWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [image, resultUrl, canvasSize.w]);

  const strokeBrush = useCallback(
    (x: number, y: number, from: { x: number; y: number } | null) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) return;

      ctx.strokeStyle = "rgba(239, 68, 68, 0.55)";
      ctx.fillStyle = "rgba(239, 68, 68, 0.55)";
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (from) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      setHasMask(true);
    },
    [brushSize]
  );

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return { x: 0, y: 0 };
    const rect = maskCanvas.getBoundingClientRect();
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const pushHistory = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;
    setDrawingHistory((prev) => {
      const next = [
        ...prev,
        ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height),
      ];
      return next.length > MAX_UNDO ? next.slice(next.length - MAX_UNDO) : next;
    });
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!image || loading) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      pushHistory();
      isDrawingRef.current = true;
      const point = getCanvasCoords(e.clientX, e.clientY);
      lastPointRef.current = point;
      strokeBrush(point.x, point.y, null);
    },
    [image, loading, getCanvasCoords, strokeBrush, pushHistory]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const stage = stageRef.current;
      if (stage) {
        const rect = stage.getBoundingClientRect();
        setCursorPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }

      if (!isDrawingRef.current) return;
      e.preventDefault();
      const point = getCanvasCoords(e.clientX, e.clientY);
      strokeBrush(point.x, point.y, lastPointRef.current);
      lastPointRef.current = point;
    },
    [getCanvasCoords, strokeBrush]
  );

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    setHasMask(maskHasPaint());
  }, [maskHasPaint]);

  const handleUndo = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;

    setDrawingHistory((prev) => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      const lastState = newHistory.pop()!;
      ctx.putImageData(lastState, 0, 0);
      queueMicrotask(() => setHasMask(maskHasPaint()));
      return newHistory;
    });
  }, [maskHasPaint]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndo]);

  const buildBinaryMaskDataUrl = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return null;

    const out = document.createElement("canvas");
    out.width = maskCanvas.width;
    out.height = maskCanvas.height;
    const ctx = out.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, out.width, out.height);

    const src = maskCanvas
      .getContext("2d")!
      .getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const dst = ctx.getImageData(0, 0, out.width, out.height);

    let painted = false;
    for (let i = 0; i < src.data.length; i += 4) {
      if (src.data[i + 3] > 10) {
        dst.data[i] = 255;
        dst.data[i + 1] = 255;
        dst.data[i + 2] = 255;
        dst.data[i + 3] = 255;
        painted = true;
      }
    }

    if (!painted) return null;
    ctx.putImageData(dst, 0, 0);
    return out.toDataURL("image/png");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleRemoveObject = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    if (dailyLeft <= 0) {
      setError(
        "No demo edits left in this session. Refresh the page to reset the counter."
      );
      return;
    }

    const binaryMask = buildBinaryMaskDataUrl();
    if (!binaryMask) {
      setError("Please brush over the area you want to remove first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMaskPreviewUrl(maskCanvasRef.current?.toDataURL("image/png") || "");

    try {
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);

      const res = await fetch("/api/remove-object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl, mask: binaryMask }),
      });

      const data = (await res.json()) as {
        error?: string;
        code?: string;
        result?: unknown;
      };

      if (!res.ok) {
        throw new Error(formatRemoveApiError(res.status, data));
      }

      if (typeof data.result !== "string") {
        throw new Error("Invalid response from remove API");
      }

      setResultUrl(data.result);
      setCompareMode("slider");
      setDailyLeft((prev) => prev - 1);
      onResult?.(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [image, dailyLeft, onResult, buildBinaryMaskDataUrl]);

  const handleDownload = useCallback(async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "magicremover-result.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(resultUrl, "_blank", "noopener,noreferrer");
    }
  }, [resultUrl]);

  const handleNewImage = useCallback(() => {
    setImage(null);
    setResultUrl(null);
    setMaskPreviewUrl("");
    clearMask();
    setError(null);
    setCursorPos(null);
  }, [clearMask]);

  const brushPreviewPx =
    canvasSize.w && stageWidth
      ? (brushSize / canvasSize.w) * stageWidth
      : brushSize;

  const errorBanner = error ? (
    <Alert variant="destructive" className="mt-3">
      <AlertCircleIcon />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  ) : null;

  return (
    <div id="editor" className="mx-auto max-w-4xl scroll-mt-24">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <EraserIcon className="size-3.5" />
          Brush the area to erase, then remove
        </span>
        <Badge
          variant="secondary"
          className="bg-success/10 text-success hover:bg-success/10"
        >
          Demo edits {dailyLeft} / {FREE_EDITS}
        </Badge>
      </div>

      {!image ? (
        <div
          className="cursor-pointer rounded-xl border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="mb-1 text-sm font-medium">Drop a photo here</p>
          <p className="text-xs text-muted-foreground">
            or click to browse · JPG / PNG / WebP · up to ~10 MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          {errorBanner}
        </div>
      ) : resultUrl ? (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <ToggleGroup
              variant="outline"
              spacing={0}
              value={[compareMode]}
              onValueChange={(group) => {
                const next = group[0] as "side" | "slider" | undefined;
                if (next) setCompareMode(next);
              }}
            >
              <ToggleGroupItem value="slider" className="px-3">
                Slider
              </ToggleGroupItem>
              <ToggleGroupItem value="side" className="px-3">
                Side by side
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              variant={showMaskOnBefore ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowMaskOnBefore((v) => !v)}
            >
              {showMaskOnBefore ? "Mask on" : "Mask off"}
            </Button>
          </div>

          {compareMode === "slider" ? (
            <div className="mb-4">
              <BeforeAfterCompare
                beforeUrl={beforeUrl}
                afterUrl={resultUrl}
                maskPreviewUrl={maskPreviewUrl}
                showMask={showMaskOnBefore}
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Drag the handle to compare before and after
              </p>
            </div>
          ) : (
            <div className="mb-4 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={beforeUrl}
                  alt="Before"
                  width={600}
                  height={450}
                  className="h-full w-full object-contain"
                  unoptimized
                />
                {showMaskOnBefore && maskPreviewUrl ? (
                  <Image
                    src={maskPreviewUrl}
                    alt="Mask"
                    width={600}
                    height={450}
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-50"
                    unoptimized
                  />
                ) : null}
                <Badge className="absolute left-2 top-2 bg-black/60 text-white hover:bg-black/60">
                  Before
                </Badge>
              </div>
              <div className="relative flex-1 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={resultUrl}
                  alt="After"
                  width={600}
                  height={450}
                  className="h-full w-full object-contain"
                  unoptimized
                />
                <Badge className="absolute left-2 top-2 bg-success/80 text-white hover:bg-success/80">
                  After
                </Badge>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={handleDownload}>
              <DownloadIcon />
              Download Result
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setResultUrl(null);
                setMaskPreviewUrl("");
                setError(null);
                clearMask();
              }}
            >
              <RotateCcwIcon />
              Edit Again
            </Button>
            <Button size="lg" variant="outline" onClick={handleNewImage}>
              <ImagePlusIcon />
              New Image
            </Button>
          </div>
          {errorBanner}
        </div>
      ) : (
        <div>
          <div
            ref={stageRef}
            className={cn(
              "relative mx-auto mb-4 max-h-[500px] max-w-full overflow-hidden rounded-xl bg-muted",
              loading && "pointer-events-none opacity-80"
            )}
            style={
              canvasSize.w
                ? {
                    aspectRatio: `${canvasSize.w} / ${canvasSize.h}`,
                    width: "min(100%, 800px)",
                  }
                : undefined
            }
            onPointerLeave={() => setCursorPos(null)}
          >
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            <canvas
              ref={maskCanvasRef}
              className="absolute inset-0 h-full w-full touch-none"
              style={{ cursor: "none" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
            {cursorPos && !loading ? (
              <div
                className="pointer-events-none absolute z-10 rounded-full border-2 border-red-500/80 bg-red-500/10 shadow-[0_0_0_1px_rgba(255,255,255,0.7)]"
                style={{
                  width: brushPreviewPx,
                  height: brushPreviewPx,
                  left: cursorPos.x,
                  top: cursorPos.y,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ) : null}
            {loading ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/55 backdrop-blur-[1px]">
                <Loader2Icon className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Removing objects…</p>
                <p className="px-4 text-center text-xs text-muted-foreground">
                  Usually 15–30s. Times out around 28s with a clear error.
                </p>
              </div>
            ) : null}
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-[14rem] flex-1 flex-col gap-2">
              <div className="flex items-center gap-3">
                <Label
                  htmlFor="brush-size"
                  className="text-xs text-muted-foreground"
                >
                  Brush
                </Label>
                <Slider
                  id="brush-size"
                  className="max-w-[12rem]"
                  min={5}
                  max={80}
                  step={1}
                  value={[brushSize]}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    if (typeof next === "number") setBrushSize(next);
                  }}
                />
                <span className="text-xs font-medium tabular-nums">
                  {brushSize}px
                </span>
              </div>
              <div className="flex gap-1">
                {BRUSH_PRESETS.map((size) => (
                  <Button
                    key={size}
                    size="xs"
                    variant={brushSize === size ? "secondary" : "outline"}
                    onClick={() => setBrushSize(size)}
                  >
                    {size === 12 ? "Fine" : size === 30 ? "Medium" : "Broad"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={drawingHistory.length === 0 || loading}
              >
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearMask}
                disabled={!hasMask || loading}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => {
                  setImage(null);
                  setBeforeUrl("");
                  setError(null);
                  clearMask();
                }}
              >
                New Image
              </Button>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleRemoveObject}
            disabled={loading || dailyLeft <= 0 || !hasMask}
          >
            {loading ? (
              <>
                <Loader2Icon className="animate-spin" />
                Removing…
              </>
            ) : (
              "Remove Objects"
            )}
          </Button>

          {!hasMask && !loading ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Paint a red mask over what to erase. Undo with Ctrl/⌘+Z.
            </p>
          ) : null}

          {errorBanner}
        </div>
      )}
    </div>
  );
}
