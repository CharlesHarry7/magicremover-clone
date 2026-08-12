"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOffIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SafeImageProps = Omit<ImageProps, "onError" | "onLoad"> & {
  fallbackLabel?: string;
  /** Compact box for logos — no “Preview unavailable” caption. */
  compact?: boolean;
};

export default function SafeImage({
  fallbackLabel = "Preview unavailable",
  compact = false,
  className,
  alt,
  src,
  ...props
}: SafeImageProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    setStatus("loading");
  }, [src]);

  if (status === "error") {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground",
          compact ? "size-full min-h-6 min-w-6" : "aspect-[4/3] min-h-[10rem] px-3 py-8",
          className
        )}
        role="img"
        aria-label={fallbackLabel}
      >
        <ImageOffIcon
          className={cn(
            "text-muted-foreground/50",
            compact ? "size-4" : "size-6"
          )}
          aria-hidden="true"
        />
        {!compact ? (
          <p className="text-xs text-muted-foreground">{fallbackLabel}</p>
        ) : null}
      </div>
    );
  }

  return (
    <span
      className={cn(
        "relative",
        compact ? "inline-block" : "block h-full w-full"
      )}
    >
      {status === "loading" ? (
        <Skeleton
          className="absolute inset-0 z-[1] h-full w-full rounded-none"
          aria-hidden="true"
        />
      ) : null}
      <Image
        {...props}
        src={src}
        alt={alt}
        className={cn(status !== "ready" && "opacity-0", className)}
        onLoad={(event) => {
          const img = event.currentTarget;
          if (img.naturalWidth === 0) {
            setStatus("error");
            return;
          }
          setStatus("ready");
        }}
        onError={() => setStatus("error")}
      />
    </span>
  );
}
