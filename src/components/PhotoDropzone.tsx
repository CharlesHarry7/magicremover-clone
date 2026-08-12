"use client";

import { useEffect, type DragEvent, type RefObject } from "react";
import { UploadIcon } from "lucide-react";
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
 * Click / drop file-input target.
 * Single onChange handler — no native change/input listeners to avoid
 * duplicate uploads that leave the canvas stuck on step 1.
 */
export default function PhotoDropzone({
  id,
  inputRef,
  onFile,
  size = "editor",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: PhotoDropzoneProps) {
  // Window-level drag/drop so files dropped anywhere on the page are caught.
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

  const handleInputChange = (el: HTMLInputElement) => {
    const file = fileFromInputElement(el);
    if (!file) return;
    onFile(file);
  };

  const onLocalDrop = (e: DragEvent<HTMLLabelElement>) => {
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
        size === "editor" ? "p-12" : "p-8"
      )}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onDragEnter={preventFileDrag}
      onDragOver={preventFileDrag}
      onDrop={onLocalDrop}
    >
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={IMAGE_FILE_ACCEPT}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        onChange={(e) => handleInputChange(e.currentTarget)}
      />
      <span className="pointer-events-none block">
        <UploadIcon
          className={cn(
            "mx-auto mb-3 text-muted-foreground/40",
            size === "editor" ? "h-12 w-12" : "h-10 w-10"
          )}
          aria-hidden="true"
        />
        <p className="mb-1 text-sm font-medium">Drop a photo here</p>
        <p className="text-xs text-muted-foreground">
          or click / paste · JPG / PNG / WebP · up to ~10 MB
        </p>
      </span>
    </label>
  );
}
