"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";

interface ImageEditorProps {
  onResult?: (resultUrl: string) => void;
}

export default function ImageEditor({ onResult }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string>("");
  const [maskUrl, setMaskUrl] = useState<string>("");
  const [dailyLeft, setDailyLeft] = useState(2);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);

  const drawDot = useCallback(
    (x: number, y: number) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [brushSize]
  );

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
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
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!image) return;
      e.preventDefault();
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) return;

      setDrawingHistory((prev) => [...prev, ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)]);
      setIsDrawing(true);
      const { x, y } = getCanvasCoords(e);
      drawDot(x, y);
    },
    [image, drawDot, getCanvasCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getCanvasCoords(e);
      drawDot(x, y);
    },
    [isDrawing, drawDot, getCanvasCoords]
  );

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
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

  const handleClear = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    setDrawingHistory([]);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
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
    handleClear();

    const reader = new FileReader();
    reader.onload = (e) => {
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

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
        }

        setImage(img);
        setBeforeUrl(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [handleClear]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleRemoveObject = useCallback(async () => {
    const maskCanvas = maskCanvasRef.current;
    const canvas = canvasRef.current;
    if (!maskCanvas || !canvas || !image) return;
    if (dailyLeft <= 0) {
      setError("No free edits left today. Sign in for 2 more.");
      return;
    }

    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    let hasMask = false;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) {
        hasMask = true;
        break;
      }
    }
    if (!hasMask) {
      setError("Please brush over the area you want to remove first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const maskDataUrlStr = maskCanvas.toDataURL("image/png");
      setMaskUrl(maskDataUrlStr);

      const res = await fetch("/api/remove-object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl, mask: maskDataUrlStr }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      setResultUrl(data.result);
      setDailyLeft((prev) => prev - 1);
      onResult?.(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [image, dailyLeft, onResult]);

  const handleDownload = useCallback(async () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "magicremover-result.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultUrl]);

  const handleReset = useCallback(() => {
    setResultUrl(null);
    handleClear();
  }, [handleClear]);

  return (
    <div className="mx-auto max-w-4xl">
      {!image ? (
        <div
          className="rounded-xl border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50 cursor-pointer"
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
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
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
              {maskUrl && (
                <Image
                  src={maskUrl}
                  alt="Mask"
                  width={600}
                  height={450}
                  className="absolute inset-0 h-full w-full object-contain opacity-50"
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
              onClick={handleReset}
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-card"
            >
              Try Another
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="relative mb-4 overflow-hidden rounded-xl bg-gray-100">
            <canvas ref={canvasRef} className="max-h-[500px] w-full object-contain" />
            <canvas
              ref={maskCanvasRef}
              className="absolute inset-0 max-h-[500px] w-full cursor-crosshair object-contain"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-4">
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
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-card transition-colors"
              >
                Undo
              </button>
              <button
                onClick={handleClear}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-card transition-colors"
              >
                Clear
              </button>
            </div>
            <button
              onClick={() => {
                setImage(null);
                handleClear();
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-card transition-colors"
            >
              New Image
            </button>
          </div>

          <button
            onClick={handleRemoveObject}
            disabled={loading || dailyLeft <= 0}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Removing...
              </span>
            ) : (
              "Remove Objects"
            )}
          </button>

          {error && (
            <p className="mt-3 text-center text-sm text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}