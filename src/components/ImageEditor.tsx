"use client";

import { useRef, useState, useCallback, useEffect, useId } from "react";
import Image from "next/image";
import {
  AlertCircleIcon,
  DownloadIcon,
  EraserIcon,
  ImagePlusIcon,
  Loader2Icon,
  RotateCcwIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  classifyRemoveFailure,
  sanitizeClientError,
  SERVICE_UNAVAILABLE_EN,
  SERVICE_UNAVAILABLE_ZH,
} from "@/lib/remove-errors";
import {
  CLIENT_ABORT_MS,
  FREE_EDITS,
  FREE_EDITS_STORY,
  remainingEditsLabel,
  MAX_IMAGE_DIM,
  OVERALL_BUDGET_MS,
} from "@/lib/remove-limits";
import {
  fileFromDataTransfer,
  imageFileRejectReason,
} from "@/lib/image-file";
import { cn } from "@/lib/utils";
import PhotoDropzone from "@/components/PhotoDropzone";

interface ImageEditorProps {
  initialFile?: File | null;
  onServiceUnavailable?: () => void;
}

const MAX_UNDO = 40;
const BRUSH_PRESETS = [12, 30, 50] as const;

/** Stacked before/after on narrow viewports so the result doesn’t sit in a cramped slider. */
function preferStackedCompare(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 640px)").matches;
}

async function readRemoveApiPayload(res: Response): Promise<{
  error?: string;
  code?: string;
  result?: unknown;
}> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as {
      error?: string;
      code?: string;
      result?: unknown;
    };
  } catch {
    return {
      error: `Server returned non-JSON (HTTP ${res.status}).`,
      code: "INVALID_RESPONSE",
    };
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:") || comma < 0) {
    throw new Error("Result is not a valid image data URL.");
  }
  const header = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  const mimeMatch = /data:([^;]+)/.exec(header);
  const mime = mimeMatch?.[1] || "image/png";
  const isBase64 = /;base64/i.test(header);
  if (isBase64) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(data)], { type: mime });
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
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [updateFromClientX]);

  const nudge = useCallback((delta: number) => {
    setPosition((prev) => Math.min(96, Math.max(4, prev + delta)));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-[4/3] w-full max-h-[50vh] max-w-[800px] touch-none overflow-hidden rounded-xl bg-muted select-none sm:max-h-[500px]"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("[data-compare-handle]")) return;
        e.preventDefault();
        dragging.current = true;
        updateFromClientX(e.clientX);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt="After object removal"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${position}%` }}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt=""
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
          role="slider"
          aria-label="Compare before and after"
          aria-valuemin={4}
          aria-valuemax={96}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`${Math.round(position)} percent before, ${Math.round(100 - position)} percent after`}
          className="absolute top-1/2 left-1/2 flex size-12 min-h-12 min-w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-manipulation items-center justify-center rounded-full border border-border bg-background text-xs font-semibold shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:size-11 sm:min-h-11 sm:min-w-11"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragging.current = true;
            (e.currentTarget as HTMLButtonElement).setPointerCapture?.(
              e.pointerId
            );
            updateFromClientX(e.clientX);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              nudge(e.shiftKey ? -10 : -2);
            } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              nudge(e.shiftKey ? 10 : 2);
            } else if (e.key === "Home") {
              e.preventDefault();
              setPosition(4);
            } else if (e.key === "End") {
              e.preventDefault();
              setPosition(96);
            }
          }}
        >
          <span aria-hidden="true">↔</span>
        </button>
      </div>

      <Badge
        aria-hidden="true"
        className="absolute left-2 top-2 z-20 bg-black/60 text-white hover:bg-black/60"
      >
        Before
      </Badge>
      <Badge
        aria-hidden="true"
        className="absolute right-2 top-2 z-20 bg-success/80 text-white hover:bg-success/80"
      >
        After
      </Badge>
    </div>
  );
}

export default function ImageEditor({
  initialFile,
  onServiceUnavailable,
}: ImageEditorProps) {
  const uploadInputId = useId();
  const statusId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const bodyOverflowRef = useRef<string | null>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [brushSize, setBrushSize] = useState(() => {
    if (typeof window === "undefined") return 30;
    return window.matchMedia?.("(pointer: coarse)").matches ? 40 : 30;
  });
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string>("");
  const [maskPreviewUrl, setMaskPreviewUrl] = useState<string>("");
  const [sessionLeft, setSessionLeft] = useState(FREE_EDITS);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [hasMask, setHasMask] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [compareMode, setCompareMode] = useState<"side" | "slider">("slider");
  const [showMaskOnBefore, setShowMaskOnBefore] = useState(true);
  const [stageWidth, setStageWidth] = useState(0);
  const [shareAvailable, setShareAvailable] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  const maskHasPaint = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return false;
    const ctx = maskCanvas.getContext("2d", { willReadFrequently: true });
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
    const reason = imageFileRejectReason(file);
    if (reason) {
      toast.error(reason);
      return;
    }

    setDownloadNote(null);
    setResultUrl(null);
    setMaskPreviewUrl("");
    setHasMask(false);

    const reader = new FileReader();
    reader.onerror = () => {
      toast.error("Could not read that file. Try another image.");
    };
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl !== "string") {
        toast.error("Could not read that file. Try another image.");
        return;
      }
      const img = new window.Image();
      img.onerror = () => {
        toast.error("Could not decode that image. Try JPG, PNG, or WebP.");
      };
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (!w || !h) {
          toast.error("Could not decode that image. Try JPG, PNG, or WebP.");
          return;
        }
        if (w > MAX_IMAGE_DIM || h > MAX_IMAGE_DIM) {
          const ratio = Math.min(MAX_IMAGE_DIM / w, MAX_IMAGE_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        // Decode onto an offscreen canvas. The editor canvases are not mounted
        // until `image` is set (upload step), so drawing on refs here was a
        // silent no-op and left the UI stuck on “1 Upload”.
        const offscreen = document.createElement("canvas");
        offscreen.width = w;
        offscreen.height = h;
        const ctx = offscreen.getContext("2d");
        if (!ctx) {
          toast.error("Could not prepare that image. Try another photo.");
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);

        setDrawingHistory([]);
        setCanvasSize({ w, h });
        setBeforeUrl(offscreen.toDataURL("image/jpeg", 0.92));
        setImage(img);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    if (!initialFile) return;
    queueMicrotask(() => {
      handleFileUpload(initialFile);
    });
  }, [initialFile, handleFileUpload]);

  useEffect(() => {
    if (image) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = fileFromDataTransfer(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      handleFileUpload(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [image, handleFileUpload]);

  useEffect(() => {
    if (!loading) {
      const resetId = window.setTimeout(() => setLoadingSeconds(0), 0);
      return () => window.clearTimeout(resetId);
    }
    const started = Date.now();
    const id = window.setInterval(() => {
      setLoadingSeconds(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [loading]);

  // Paint after canvases mount (first upload, or Edit Again).
  useEffect(() => {
    if (!image || resultUrl || !canvasSize.w) return;
    let cancelled = false;
    let tries = 0;
    let raf = 0;

    const paint = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (!canvas || !maskCanvas) {
        if (tries++ < 8) {
          raf = window.requestAnimationFrame(paint);
          return;
        }
        toast.error("Could not open the editor canvas. Try uploading again.");
        return;
      }

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
    };

    paint();
    return () => {
      cancelled = true;
      if (raf) window.cancelAnimationFrame(raf);
    };
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
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return {
      x: Math.min(maskCanvas.width, Math.max(0, x)),
      y: Math.min(maskCanvas.height, Math.max(0, y)),
    };
  }, []);

  const setBodyScrollLocked = useCallback((locked: boolean) => {
    if (typeof document === "undefined") return;
    if (locked) {
      if (bodyOverflowRef.current === null) {
        bodyOverflowRef.current = document.body.style.overflow;
      }
      document.body.style.overflow = "hidden";
    } else if (bodyOverflowRef.current !== null) {
      document.body.style.overflow = bodyOverflowRef.current;
      bodyOverflowRef.current = null;
    }
  }, []);

  const pushHistory = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    setDrawingHistory((prev) => {
      const next = [
        ...prev,
        ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height),
      ];
      return next.length > MAX_UNDO ? next.slice(next.length - MAX_UNDO) : next;
    });
  }, []);

  const flushPendingPoint = useCallback(() => {
    rafRef.current = null;
    const point = pendingPointRef.current;
    if (!point || !isDrawingRef.current) return;
    strokeBrush(point.x, point.y, lastPointRef.current);
    lastPointRef.current = point;
    pendingPointRef.current = null;
  }, [strokeBrush]);

  const queueDrawPoint = useCallback(
    (point: { x: number; y: number }) => {
      pendingPointRef.current = point;
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(flushPendingPoint);
    },
    [flushPendingPoint]
  );

  const endStroke = useCallback(() => {
    if (!isDrawingRef.current) return;
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingPointRef.current) {
      strokeBrush(
        pendingPointRef.current.x,
        pendingPointRef.current.y,
        lastPointRef.current
      );
      pendingPointRef.current = null;
    }
    isDrawingRef.current = false;
    activePointerIdRef.current = null;
    lastPointRef.current = null;
    setBodyScrollLocked(false);
    setHasMask(maskHasPaint());
  }, [maskHasPaint, setBodyScrollLocked, strokeBrush]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!image || loading) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      // One finger / primary pointer only — ignore extra touches.
      if (activePointerIdRef.current !== null) return;
      e.preventDefault();
      e.stopPropagation();
      activePointerIdRef.current = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Some mobile WebViews reject capture; window listeners still help.
      }
      pushHistory();
      isDrawingRef.current = true;
      setBodyScrollLocked(true);
      const point = getCanvasCoords(e.clientX, e.clientY);
      lastPointRef.current = point;
      strokeBrush(point.x, point.y, null);

      const stage = stageRef.current;
      if (stage) {
        const rect = stage.getBoundingClientRect();
        setCursorPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [
      image,
      loading,
      getCanvasCoords,
      strokeBrush,
      pushHistory,
      setBodyScrollLocked,
    ]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (
        activePointerIdRef.current !== null &&
        e.pointerId !== activePointerIdRef.current
      ) {
        return;
      }

      // Cursor preview only — active strokes are handled by window listeners
      // so drawing continues when the finger slides off the canvas.
      if (isDrawingRef.current) return;

      const stage = stageRef.current;
      if (stage) {
        const rect = stage.getBoundingClientRect();
        setCursorPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (
        activePointerIdRef.current !== null &&
        e.pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      try {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
      endStroke();
    },
    [endStroke]
  );

  // Keep drawing when the finger slides off the canvas (common on mobile).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      if (
        activePointerIdRef.current !== null &&
        e.pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      e.preventDefault();
      const stage = stageRef.current;
      if (stage) {
        const rect = stage.getBoundingClientRect();
        setCursorPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      queueDrawPoint(getCanvasCoords(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      if (
        activePointerIdRef.current !== null &&
        e.pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      endStroke();
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setBodyScrollLocked(false);
    };
  }, [endStroke, getCanvasCoords, queueDrawPoint, setBodyScrollLocked]);

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
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      e.preventDefault();
      handleUndo();
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
      .getContext("2d", { willReadFrequently: true })!
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

  const handleRemoveObject = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    if (sessionLeft <= 0) {
      toast.error(
        `No free edits left in this session. Refresh the page to reset (${FREE_EDITS_STORY}).`
      );
      return;
    }

    const binaryMask = buildBinaryMaskDataUrl();
    if (!binaryMask) {
      toast.error("Please brush over the area you want to remove first.");
      return;
    }

    setLoading(true);
    setDownloadNote(null);
    setMaskPreviewUrl(maskCanvasRef.current?.toDataURL("image/png") || "");

    const controller = new AbortController();
    // Slightly above Worker budget so the server can return 504 first when possible.
    const timeoutId = window.setTimeout(() => controller.abort(), CLIENT_ABORT_MS);

    try {
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);

      const res = await fetch("/api/remove-object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl, mask: binaryMask }),
        signal: controller.signal,
      });

      const data = await readRemoveApiPayload(res);

      if (!res.ok) {
        // Code / 503 first — never show raw data.error (it may name env vars).
        if (
          data.code === "MISSING_API_KEY" ||
          res.status === 503
        ) {
          setServiceUnavailable(true);
          onServiceUnavailable?.();
          return;
        }
        const classified = classifyRemoveFailure(res.status, data);
        if (classified.kind === "service") {
          setServiceUnavailable(true);
          onServiceUnavailable?.();
          return;
        }
        toast.error(classified.message);
        return;
      }

      if (typeof data.result !== "string") {
        toast.error("Invalid response from remove API");
        return;
      }

      setResultUrl(data.result);
      setCompareMode(preferStackedCompare() ? "side" : "slider");
      setSessionLeft((prev) => prev - 1);
      window.setTimeout(() => {
        actionsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 80);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast.error(
          `Request aborted after ~${Math.round(CLIENT_ABORT_MS / 1000)}s with no response. The Worker usually returns HTTP 504 around ${Math.round(OVERALL_BUDGET_MS / 1000)}s — try a smaller image.`
        );
      } else if (err instanceof TypeError) {
        toast.error(
          "Network error talking to /api/remove-object. Check your connection and try again."
        );
      } else {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        const classified = classifyRemoveFailure(0, { error: message });
        if (classified.kind === "service") {
          setServiceUnavailable(true);
          onServiceUnavailable?.();
        } else {
          toast.error(sanitizeClientError(message));
        }
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [image, sessionLeft, buildBinaryMaskDataUrl, onServiceUnavailable]);

  const blobFromResult = useCallback(async (url: string) => {
    if (url.startsWith("data:")) {
      return dataUrlToBlob(url);
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Download failed (HTTP ${res.status}).`);
    }
    return res.blob();
  }, []);

  const canUseShare = useCallback((file: File) => {
    if (typeof navigator === "undefined") return false;
    if (typeof navigator.share !== "function") return false;
    if (typeof navigator.canShare !== "function") return false;
    try {
      return navigator.canShare({ files: [file] });
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!resultUrl) {
      const resetId = window.setTimeout(() => setShareAvailable(false), 0);
      return () => window.clearTimeout(resetId);
    }
    let cancelled = false;
    (async () => {
      try {
        if (typeof navigator.share !== "function") {
          if (!cancelled) setShareAvailable(false);
          return;
        }
        const blob = await blobFromResult(resultUrl);
        const mime = blob.type || "image/png";
        const filename =
          mime.includes("jpeg") || mime.includes("jpg")
            ? "magicremover-result.jpg"
            : "magicremover-result.png";
        const file = new File([blob], filename, { type: mime });
        if (!cancelled) setShareAvailable(canUseShare(file));
      } catch {
        if (!cancelled) setShareAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resultUrl, blobFromResult, canUseShare]);

  const saveBlobWithAnchor = useCallback(async (blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
  }, []);

  const handleShare = useCallback(async () => {
    if (!resultUrl || downloading) return;
    setDownloading(true);
    setDownloadNote(null);
    try {
      const blob = await blobFromResult(resultUrl);
      const mime = blob.type || "image/png";
      const filename =
        mime.includes("jpeg") || mime.includes("jpg")
          ? "magicremover-result.jpg"
          : "magicremover-result.png";
      const file = new File([blob], filename, { type: mime });
      if (!canUseShare(file) || typeof navigator.share !== "function") {
        setDownloadNote(
          "Sharing isn’t available here — use Download, or long-press the After image."
        );
        return;
      }
      await navigator.share({ files: [file], title: "MagicRemover result" });
      setDownloadNote("Opened the system share sheet — save the image from there.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setDownloadNote("Share canceled.");
        return;
      }
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not open the share sheet. Try Download instead."
      );
    } finally {
      setDownloading(false);
    }
  }, [resultUrl, downloading, blobFromResult, canUseShare]);

  const handleDownload = useCallback(async () => {
    if (!resultUrl || downloading) return;
    setDownloading(true);
    setDownloadNote(null);

    try {
      const blob = await blobFromResult(resultUrl);
      const mime = blob.type || "image/png";
      const filename =
        mime.includes("jpeg") || mime.includes("jpg")
          ? "magicremover-result.jpg"
          : "magicremover-result.png";

      await saveBlobWithAnchor(blob, filename);
      const appleTouch =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setDownloadNote(
        appleTouch
          ? "Download started. If the file doesn’t appear, use Share or long-press the After image."
          : "Download started."
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not download the result.";
      if (resultUrl.startsWith("data:")) {
        toast.error(
          `${message} Long-press the After image to save it on this device.`
        );
      } else {
        toast.error(message);
        window.open(resultUrl, "_blank", "noopener,noreferrer");
        setDownloadNote("Opened the result in a new tab as a fallback.");
      }
    } finally {
      setDownloading(false);
    }
  }, [resultUrl, downloading, blobFromResult, saveBlobWithAnchor]);

  const handleOpenResult = useCallback(() => {
    if (!resultUrl) return;
    const opened = window.open(resultUrl, "_blank", "noopener,noreferrer");
    if (!opened && resultUrl.startsWith("data:")) {
      setDownloadNote(
        "Popup blocked. Long-press the After image to save it instead."
      );
      return;
    }
    setDownloadNote(
      "Opened the result in a new tab — use Save Image / long-press if download is blocked."
    );
  }, [resultUrl]);

  const handleNewImage = useCallback(() => {
    setImage(null);
    setResultUrl(null);
    setMaskPreviewUrl("");
    clearMask();
    setDownloadNote(null);
    setCursorPos(null);
  }, [clearMask]);

  const brushPreviewPx =
    canvasSize.w && stageWidth
      ? (brushSize / canvasSize.w) * stageWidth
      : brushSize;

  const nearestPreset = BRUSH_PRESETS.reduce((best, size) =>
    Math.abs(size - brushSize) < Math.abs(best - brushSize) ? size : best
  );

  const loopStep: 1 | 2 | 3 | 4 = !image
    ? 1
    : resultUrl
      ? 4
      : loading
        ? 3
        : 2;

  const statusText = loading
    ? "Removing objects. This usually takes 15 to 30 seconds."
    : serviceUnavailable
      ? SERVICE_UNAVAILABLE_ZH
      : resultUrl
        ? "Removal finished. Compare before and after, then download."
        : image
          ? hasMask
            ? "Mask ready. Press Remove Objects to continue."
            : "Brush over the area you want to erase."
          : "Upload a photo to start.";

  const serviceAlert = serviceUnavailable ? (
    <Alert variant="destructive" className="mb-3">
      <AlertCircleIcon />
      <AlertTitle>{SERVICE_UNAVAILABLE_ZH}</AlertTitle>
      <AlertDescription>{SERVICE_UNAVAILABLE_EN}</AlertDescription>
    </Alert>
  ) : null;

  const stepLabels = ["Upload", "Brush", "Remove", "Download"] as const;

  return (
    <div
      id="editor"
      className="mx-auto max-w-4xl scroll-mt-24"
      aria-busy={loading || undefined}
    >
      <div className="mb-3 flex items-center justify-end gap-3 text-xs text-muted-foreground sm:justify-between">
        <span className="hidden items-center gap-1.5 sm:inline-flex">
          <EraserIcon className="size-3.5" aria-hidden="true" />
          Upload → brush → remove → download
        </span>
        <Badge
          variant="secondary"
          className="bg-success/10 text-success hover:bg-success/10"
          title={FREE_EDITS_STORY}
        >
          {remainingEditsLabel(sessionLeft)}
        </Badge>
      </div>

      {serviceAlert}

      <ol
        className="mb-3 grid w-full grid-cols-4 gap-1 text-xs"
        aria-label="Object remover steps"
      >
        {stepLabels.map((label, index) => {
          const n = (index + 1) as 1 | 2 | 3 | 4;
          const active = loopStep === n;
          const done = loopStep > n;
          return (
            <li
              key={label}
              className={cn(
                "inline-flex items-center justify-center gap-1 rounded-full px-1.5 py-1 text-[11px] sm:gap-1.5 sm:px-2.5 sm:text-xs",
                active && "bg-primary text-primary-foreground",
                done && !active && "bg-success/10 text-success",
                !active && !done && "bg-muted text-muted-foreground"
              )}
              aria-current={active ? "step" : undefined}
              aria-label={label}
            >
              <span className="font-semibold tabular-nums">{n}</span>
              {label === "Download" ? (
                <>
                  <span className="sm:hidden">Save</span>
                  <span className="hidden sm:inline">Download</span>
                </>
              ) : (
                label
              )}
            </li>
          );
        })}
      </ol>

      <p
        id={statusId}
        className="mb-4 text-center text-sm text-muted-foreground"
        aria-live="polite"
      >
        {statusText}
      </p>

      {!image ? (
        <PhotoDropzone
          id={uploadInputId}
          inputRef={fileInputRef}
          onFile={handleFileUpload}
          size="editor"
          aria-describedby={statusId}
          aria-label="Upload a photo to remove objects"
        />
      ) : resultUrl ? (
        <div>
          <Tabs
            value={compareMode}
            onValueChange={(next) => {
              if (next === "slider" || next === "side") setCompareMode(next);
            }}
            className="mb-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <TabsList aria-label="Before and after compare mode">
                <TabsTrigger value="slider" className="px-3">
                  Slider
                </TabsTrigger>
                <TabsTrigger value="side" className="px-3">
                  Side by side
                </TabsTrigger>
              </TabsList>
              <Button
                variant={showMaskOnBefore ? "secondary" : "outline"}
                size="sm"
                aria-pressed={showMaskOnBefore}
                aria-label={
                  showMaskOnBefore
                    ? "Hide brush mask on before image"
                    : "Show brush mask on before image"
                }
                onClick={() => setShowMaskOnBefore((v) => !v)}
              >
                {showMaskOnBefore ? "Mask on" : "Mask off"}
              </Button>
            </div>

            <TabsContent value="slider">
              <BeforeAfterCompare
                beforeUrl={beforeUrl}
                afterUrl={resultUrl}
                maskPreviewUrl={maskPreviewUrl}
                showMask={showMaskOnBefore}
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Drag or slide to compare before and after
              </p>
              <figure className="mx-auto mt-3 max-w-[10rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="After result — long-press to save on mobile"
                  className="w-full rounded-lg border border-border object-contain"
                  draggable={false}
                />
                <figcaption className="mt-1 text-center text-[11px] text-muted-foreground">
                  After · long-press to save
                </figcaption>
              </figure>
            </TabsContent>

            <TabsContent value="side">
              <div className="flex flex-col gap-4 sm:flex-row">
                <figure className="relative max-h-[50vh] flex-1 overflow-hidden rounded-xl bg-muted sm:max-h-[500px]">
                  <Image
                    src={beforeUrl}
                    alt="Original photo before object removal"
                    width={600}
                    height={450}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                  {showMaskOnBefore && maskPreviewUrl ? (
                    <Image
                      src={maskPreviewUrl}
                      alt=""
                      width={600}
                      height={450}
                      className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-50"
                      unoptimized
                    />
                  ) : null}
                  <Badge
                    aria-hidden="true"
                    className="absolute left-2 top-2 bg-black/60 text-white hover:bg-black/60"
                  >
                    Before
                  </Badge>
                </figure>
                <figure className="relative max-h-[50vh] flex-1 overflow-hidden rounded-xl bg-muted sm:max-h-[500px]">
                  <Image
                    src={resultUrl}
                    alt="Photo after object removal — long-press to save on mobile"
                    width={600}
                    height={450}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                  <Badge
                    aria-hidden="true"
                    className="absolute left-2 top-2 bg-success/80 text-white hover:bg-success/80"
                  >
                    After
                  </Badge>
                </figure>
              </div>
            </TabsContent>
          </Tabs>

          <div
            ref={actionsRef}
            className="sticky bottom-3 z-10 flex flex-wrap justify-center gap-3 rounded-xl border border-border/60 bg-background/95 p-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/85"
          >
            <Button
              size="lg"
              className="min-h-11 min-w-[9rem]"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <DownloadIcon />
              )}
              {downloading ? "Preparing…" : "Download"}
            </Button>
            {shareAvailable ? (
              <Button
                size="lg"
                variant="secondary"
                className="min-h-11 min-w-[9rem]"
                onClick={handleShare}
                disabled={downloading}
              >
                Share
              </Button>
            ) : null}
            <Button
              size="lg"
              variant="outline"
              className="min-h-11"
              onClick={handleOpenResult}
              disabled={downloading}
            >
              Open
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setResultUrl(null);
                setMaskPreviewUrl("");
                setDownloadNote(null);
                clearMask();
              }}
            >
              <RotateCcwIcon />
              Edit Again
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-h-11"
              onClick={handleNewImage}
            >
              <ImagePlusIcon />
              New Image
            </Button>
          </div>
          {!downloadNote ? (
            <Alert className="mt-3">
              <DownloadIcon />
              <AlertDescription>
                Removal finished — compare the result, then download.
              </AlertDescription>
            </Alert>
          ) : null}
          {downloadNote ? (
            <Alert className="mt-3">
              <DownloadIcon />
              <AlertDescription>{downloadNote}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : (
        <div>
          <div
            ref={stageRef}
            role="group"
            aria-label="Brush mask editor"
            aria-describedby={statusId}
            className={cn(
              "relative mx-auto mb-4 max-h-[50vh] w-full max-w-full touch-none overflow-hidden overscroll-none rounded-xl bg-muted sm:max-h-[500px]",
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
            onPointerLeave={(e) => {
              // Keep the brush ring while an active stroke continues off-canvas.
              if (isDrawingRef.current) return;
              if (e.pointerType === "mouse") setCursorPos(null);
            }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full touch-none"
              aria-hidden="true"
            />
            <canvas
              ref={maskCanvasRef}
              className="absolute inset-0 h-full w-full touch-none"
              aria-label="Paint mask over areas to remove. Use Undo or Clear to adjust."
              style={{
                cursor: "none",
                touchAction: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
            {cursorPos && !loading ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute z-10 rounded-full border-2 border-red-500/80 bg-red-500/15 shadow-[0_0_0_1px_rgba(255,255,255,0.7)]"
                style={{
                  width: Math.max(12, brushPreviewPx),
                  height: Math.max(12, brushPreviewPx),
                  left: cursorPos.x,
                  top: cursorPos.y,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ) : null}
            {!hasMask && !loading ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
                <span className="rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm ring-1 ring-border">
                  Paint red over what to erase
                </span>
              </div>
            ) : null}
            {loading ? (
              <div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/55 backdrop-blur-[1px]"
                role="status"
                aria-live="polite"
              >
                <Loader2Icon
                  className="size-8 animate-spin text-primary"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium">
                  Removing objects… {loadingSeconds}s
                </p>
                <p className="px-4 text-center text-xs text-muted-foreground">
                  Usually 15–30s. Times out around{" "}
                  {Math.round(OVERALL_BUDGET_MS / 1000)}s with a clear error.
                </p>
              </div>
            ) : null}
          </div>

          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Label
                htmlFor="brush-size"
                className="shrink-0 text-xs text-muted-foreground"
              >
                Brush
              </Label>
              <span
                aria-hidden="true"
                className="inline-flex size-7 shrink-0 items-center justify-center sm:size-8"
                title={`${brushSize}px brush`}
              >
                <span
                  className="rounded-full border-2 border-red-500/80 bg-red-500/15"
                  style={{
                    width: Math.max(8, Math.min(28, brushSize * 0.45)),
                    height: Math.max(8, Math.min(28, brushSize * 0.45)),
                  }}
                />
              </span>
              <Slider
                id="brush-size"
                className="min-w-0 flex-1 sm:max-w-[14rem]"
                min={5}
                max={80}
                step={1}
                value={[brushSize]}
                onValueChange={(value) => {
                  const next = Array.isArray(value) ? value[0] : value;
                  if (typeof next === "number") setBrushSize(next);
                }}
              />
              <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">
                {brushSize}px
              </span>
            </div>

            {/* Narrow: stacked equal-width rows. sm+: presets left, actions right. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <ToggleGroup
                variant="outline"
                size="sm"
                spacing={0}
                aria-label="Brush size presets"
                className="grid w-full grid-cols-3 sm:flex sm:w-auto"
                value={[String(nearestPreset)]}
                onValueChange={(group) => {
                  const raw = group[0];
                  if (raw == null) return;
                  const next = Number(raw);
                  if (
                    (BRUSH_PRESETS as readonly number[]).includes(next)
                  ) {
                    setBrushSize(next);
                  }
                }}
              >
                {BRUSH_PRESETS.map((size) => (
                  <ToggleGroupItem
                    key={size}
                    value={String(size)}
                    className="min-h-9 px-2"
                    aria-label={
                      size === 12
                        ? "Fine brush"
                        : size === 30
                          ? "Medium brush"
                          : "Broad brush"
                    }
                  >
                    {size === 12 ? "Fine" : size === 30 ? "Medium" : "Broad"}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <div className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-9 w-full sm:w-auto"
                  onClick={handleUndo}
                  disabled={drawingHistory.length === 0 || loading}
                >
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-9 w-full sm:w-auto"
                  onClick={clearMask}
                  disabled={!hasMask || loading}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-9 w-full sm:w-auto"
                  disabled={loading}
                  onClick={() => {
                    setImage(null);
                    setBeforeUrl("");
                    clearMask();
                  }}
                >
                  <span className="sm:hidden">New</span>
                  <span className="hidden sm:inline">New Image</span>
                </Button>
              </div>
            </div>
          </div>

          <Button
            className="min-h-11 w-full"
            size="lg"
            onClick={handleRemoveObject}
            disabled={loading || sessionLeft <= 0 || !hasMask}
            aria-describedby={statusId}
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

          {!loading && (sessionLeft <= 0 || !hasMask) ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {sessionLeft <= 0
                ? `No free edits left. ${FREE_EDITS_STORY}.`
                : "Brush a mask first, then remove. One-finger paint; Undo with Ctrl/⌘+Z."}
            </p>
          ) : hasMask && !loading ? (
            <p className="mt-2 text-center text-xs text-success">
              Mask ready — tap Remove Objects.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
