"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOffIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SafeImageProps = Omit<ImageProps, "onError" | "onLoad"> & {
  /** Shown over the Skeleton while the asset loads (case demos). */
  loadingLabel?: string;
  /** Shown when the asset fails — never leave a broken img. */
  fallbackLabel?: string;
  /** Compact box for logos — text mark fallback instead of caption. */
  compact?: boolean;
  /** Text mark when a compact logo fails (e.g. "MR"). */
  markFallback?: string;
};

export default function SafeImage({
  loadingLabel = "示例加载中",
  fallbackLabel = "示例暂不可用",
  compact = false,
  markFallback = "MR",
  className,
  alt,
  src,
  ...props
}: SafeImageProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [activeSrc, setActiveSrc] = useState(src);

  if (src !== activeSrc) {
    setActiveSrc(src);
    setStatus("loading");
  }

  if (status === "error") {
    if (compact) {
      return (
        <span
          className={cn(
            "inline-flex size-full min-h-6 min-w-6 items-center justify-center rounded-md bg-primary text-[0.65rem] font-bold leading-none text-primary-foreground",
            className
          )}
          role="img"
          aria-label={alt || markFallback}
        >
          {markFallback}
        </span>
      );
    }

    return (
      <div
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl bg-card px-3 py-8 text-muted-foreground ring-1 ring-foreground/10",
          "aspect-[4/3] min-h-[10rem]",
          className
        )}
        role="img"
        aria-label={fallbackLabel}
      >
        <Skeleton
          className="absolute inset-0 h-full w-full rounded-xl opacity-50"
          aria-hidden="true"
        />
        <ImageOffIcon
          className="relative z-[1] size-6 text-muted-foreground/50"
          aria-hidden="true"
        />
        <p className="relative z-[1] text-xs text-muted-foreground">
          {fallbackLabel}
        </p>
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
        compact ? (
          <Skeleton
            className="absolute inset-0 z-[1] h-full w-full rounded-md"
            aria-hidden="true"
          />
        ) : (
          <div
            className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 rounded-xl bg-card ring-1 ring-foreground/10"
            role="status"
            aria-live="polite"
            aria-label={loadingLabel}
          >
            <Skeleton className="absolute inset-0 h-full w-full rounded-xl" />
            <span className="relative z-[1] text-xs font-medium text-muted-foreground">
              {loadingLabel}
            </span>
          </div>
        )
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
