"use client";

import { useEffect, type DragEvent, type RefObject } from "react";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

import {
  IMAGE_FILE_ACCEPT,
  dataTransferLooksLikeFiles,
  fileFromDataTransfer,
  fileFromInputElement,
} from "@/lib/image-file";
import { cn } from "@/lib/utils";

type PhotoDropzoneProps = {
  id: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
  size?: "hero" | "editor";
  busy?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

function preventFileDrag(e: DragEvent | globalThis.DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  if ("dataTransfer" in e && e.dataTransfer) {
    e.dataTransfer.dropEffect = "copy";
  }
}

/**
 * Click / drop / CDP file-input target.
 * Not a button element — Chrome often never fires `drop` on buttons, which left
 * the editor stuck on “Upload a photo to start” with no toast.
 */
export default function PhotoDropzone({
  id,
  inputRef,
  onFile,
  size = "editor",
  busy = false,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: PhotoDropzoneProps) {
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onPicked = () => {
      const file = fileFromInputElement(el);
      if (!file) return;
      onFile(file);
    };
    // `change` is the file-input event. Do not listen to `input` — some mobile
    // browsers fire an empty `input` first; clearing then aborted the pick.
    el.addEventListener("change", onPicked);
    return () => {
      el.removeEventListener("change", onPicked);
    };
  }, [inputRef, onFile]);

  useEffect(() => {
    const onDragOver = (e: globalThis.DragEvent) => {
      if (!dataTransferLooksLikeFiles(e.dataTransfer)) return;
      preventFileDrag(e);
    };
    const onDrop = (e: globalThis.DragEvent) => {
      if (!dataTransferLooksLikeFiles(e.dataTransfer) && !fileFromDataTransfer(e.dataTransfer)) {
        return;
      }
      preventFileDrag(e);
      const file = fileFromDataTransfer(e.dataTransfer);
      if (!file) {
        toast.error("Drop a JPG, PNG, or WebP image.");
        return;
      }
      onFile(file);
    };
    window.addEventListener("dragover", onDragOver, true);
    window.addEventListener("drop", onDrop, true);
    return () => {
      window.removeEventListener("dragover", onDragOver, true);
      window.removeEventListener("drop", onDrop, true);
    };
  }, [onFile]);

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    preventFileDrag(e);
    const file = fileFromDataTransfer(e.dataTransfer);
    if (!file) {
      toast.error("Drop a JPG, PNG, or WebP image.");
      return;
    }
    onFile(file);
  };

  return (
    <label
      className={cn(
        "relative block w-full cursor-pointer rounded-xl border-2 border-dashed border-border text-center transition-colors hover:border-primary/50 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        size === "editor" ? "p-12" : "p-8",
        busy && "pointer-events-none"
      )}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={busy || undefined}
      onDragEnter={preventFileDrag}
      onDragOver={preventFileDrag}
      onDrop={onDrop}
    >
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={IMAGE_FILE_ACCEPT}
        disabled={busy}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        onChange={(e) => {
          const file = fileFromInputElement(e.currentTarget);
          if (!file) return;
          onFile(file);
        }}
      />
      <span className="pointer-events-none block">
        {busy ? (
          <Loader2Icon
            className={cn(
              "mx-auto mb-3 animate-spin text-primary",
              size === "editor" ? "h-12 w-12" : "h-10 w-10"
            )}
            aria-hidden="true"
          />
        ) : (
          <UploadIcon
            className={cn(
              "mx-auto mb-3 text-muted-foreground/40",
              size === "editor" ? "h-12 w-12" : "h-10 w-10"
            )}
            aria-hidden="true"
          />
        )}
        <p className="mb-1 text-sm font-medium">
          {busy ? "Opening photo…" : "Drop a photo here"}
        </p>
        <p className="text-xs text-muted-foreground">
          {busy
            ? "Decoding on this device — the brush step opens next."
            : "or click / paste · JPG / PNG / WebP · up to ~10 MB"}
        </p>
      </span>
    </label>
  );
}
