"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";

interface ImageEditorProps {
  onResult?: (resultUrl: string) => void;
  initialFile?: File | null;
}

const FREE_EDITS = 2;

export default function ImageEditor({ onResult, initialFile }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string>("");
  const [maskPreviewUrl, setMaskPreviewUrl] = useState<string>("");
  const [dailyLeft, setDailyLeft] = useState(FREE_EDITS);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const clearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    setDrawingHistory([]);
  }, []);

  const handleFileUpload = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a JPG or PNG image.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be under 10 MB.");
        return;
      }

      setError(null);
      setResultUrl(null);
      setMaskPreviewUrl("");

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
    },
    []
  );

  useEffect(() => {
    if (!initialFile) return;
    let cancelled = false;
    // Defer so we don't setState synchronously inside the effect body.
    queueMicrotask(() => {
      if (!cancelled) handleFileUpload(initialFile);
    });
    return () => {
      cancelled = true;
    };
  }, [initialFile, handleFileUpload]);

  const strokeBrush = useCallback(
    (x: number, y: number, from: { x: number; y: number } | null) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) return;

      ctx.strokeStyle = "rgba(255, 0, 0, 0.55)";
      ctx.fillStyle = "rgba(255, 0, 0, 0.55)";
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
    },
    [brushSize]
  );

  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return { x: 0, y: 0 };
    const rect = maskCanvas.getBoundingClientRect();
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!image) return;
      e.preventDefault();
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) return;

      setDrawingHistory((prev) => [
        ...prev,
        ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height),
      ]);
      setIsDrawing(true);
      const point = getCanvasCoords(e);
      lastPointRef.current = point;
      strokeBrush(point.x, point.y, null);
    },
    [image, getCanvasCoords, strokeBrush]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const point = getCanvasCoords(e);
      strokeBrush(point.x, point.y, lastPointRef.current);
      lastPointRef.current = point;
    },
    [isDrawing, getCanvasCoords, strokeBrush]
  );

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

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
      return newHistory;
    });
  }, []);

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

    const src = maskCanvas.getContext("2d")!.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const dst = ctx.getImageData(0, 0, out.width, out.height);

    let hasMask = false;
    for (let i = 0; i < src.data.length; i += 4) {
      if (src.data[i + 3] > 10) {
        dst.data[i] = 255;
        dst.data[i + 1] = 255;
        dst.data[i + 2] = 255;
        dst.data[i + 3] = 255;
        hasMask = true;
      }
    }

    if (!hasMask) return null;
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
      setError("No free edits left today.");
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      if (typeof data.result !== "string") {
        throw new Error("Invalid response from remove API");
      }

      setResultUrl(data.result);
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
      // Cross-origin fallback: open in a new tab
      window.open(resultUrl, "_blank", "noopener,noreferrer");
    }
  }, [resultUrl]);

  const handleNewImage = useCallback(() => {
    setImage(null);
    setResultUrl(null);
    setMaskPreviewUrl("");
    clearMask();
    setError(null);
  }, [clearMask]);

  const errorBanner = error ? (
    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-600">
      {error}
    </p>
  ) : null;

  return (
    <div id="editor" className="mx-auto max-w-4xl scroll-mt-24">
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span>Brush the area to erase, then remove</span>
        <span className="rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
          Free today {dailyLeft} / {FREE_EDITS}
        </span>
      </div>

      {!image ? (
        <div
          className="cursor-pointer rounded-xl border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="mx-auto mb-3 h-12 w-12 text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mb-1 text-sm font-medium">Drop a photo here</p>
          <p className="text-xs text-muted">or click to browse · JPG / PNG · up to ~10 MB</p>
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
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={beforeUrl}
                alt="Before"
                width={600}
                height={450}
                className="h-full w-full object-contain"
                unoptimized
              />
              {maskPreviewUrl && (
                <Image
                  src={maskPreviewUrl}
                  alt="Mask"
                  width={600}
                  height={450}
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-50"
                  unoptimized
                />
              )}
              <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Before</span>
            </div>
            <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={resultUrl}
                alt="After"
                width={600}
                height={450}
                className="h-full w-full object-contain"
                unoptimized
              />
              <span className="absolute left-2 top-2 rounded bg-success/80 px-2 py-0.5 text-xs text-white">After</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handleDownload}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Download Result
            </button>
            <button
              onClick={handleNewImage}
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-card"
            >
              Edit Again
            </button>
            <button
              onClick={() => {
                setImage(null);
                setResultUrl(null);
                setBeforeUrl("");
                setMaskPreviewUrl("");
                setError(null);
                clearMask();
              }}
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-card"
            >
              New Image
            </button>
          </div>
          {errorBanner}
        </div>
      ) : (
        <div>
          <div
            className="relative mx-auto mb-4 max-h-[500px] max-w-full overflow-hidden rounded-xl bg-gray-100"
            style={
              canvasSize.w
                ? { aspectRatio: `${canvasSize.w} / ${canvasSize.h}`, width: "min(100%, 800px)" }
                : undefined
            }
          >
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            <canvas
              ref={maskCanvasRef}
              className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Brush size</span>
              <input
                type="range"
                min="5"
                max="80"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="h-1.5 w-24 accent-primary"
              />
              <span className="text-xs font-medium">{brushSize}px</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={drawingHistory.length === 0}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-card disabled:opacity-40"
              >
                Undo
              </button>
              <button
                onClick={clearMask}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-card"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setImage(null);
                  setBeforeUrl("");
                  setError(null);
                  clearMask();
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-card"
              >
                New Image
              </button>
            </div>
          </div>

          <button
            onClick={handleRemoveObject}
            disabled={loading || dailyLeft <= 0}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Removing…
              </span>
            ) : (
              "Remove Objects"
            )}
          </button>

          {errorBanner}
        </div>
      )}
    </div>
  );
}
