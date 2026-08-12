/** Shared upload picking for Hero + ImageEditor (click, drop, paste). */

import { MAX_UPLOAD_BYTES } from "./remove-limits.ts";

const ALLOWED_TYPE = /^image\/(jpeg|jpg|pjpeg|png|webp)$/i;
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

/** Broad enough that OS / CDP pickers are not silently ignored by `accept`. */
export const IMAGE_FILE_ACCEPT =
  "image/jpeg,image/jpg,image/pjpeg,image/png,image/webp,image/*,.jpg,.jpeg,.png,.webp";

export function isAllowedImageFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (ALLOWED_TYPE.test(type)) return true;
  // Some OS / automation pickers leave `type` empty or use octet-stream.
  if ((!type || type === "application/octet-stream") && ALLOWED_EXT.test(file.name)) {
    return true;
  }
  if (type.startsWith("image/") && ALLOWED_EXT.test(file.name)) return true;
  return false;
}

export function pickFirstFile(
  list: FileList | null | undefined
): File | null {
  return list?.[0] ?? null;
}

/** Prefer `items` (CDP / synthetic drag) then `files`. */
export function fileFromDataTransfer(
  data: DataTransfer | null | undefined
): File | null {
  if (!data) return null;
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file) return file;
  }
  return pickFirstFile(data.files);
}

export function dataTransferLooksLikeFiles(
  data: DataTransfer | null | undefined
): boolean {
  if (!data) return false;
  if (data.files?.length) return true;
  if (Array.from(data.items ?? []).some((item) => item.kind === "file")) {
    return true;
  }
  return Array.from(data.types ?? []).includes("Files");
}

/**
 * Read then clear so the same file can be picked again.
 * Only clear when a file is present — an empty `input` event on some mobile
 * browsers would otherwise wipe a selection that `change` is about to deliver.
 */
export function fileFromInputElement(
  input: HTMLInputElement | null | undefined
): File | null {
  if (!input) return null;
  const file = pickFirstFile(input.files);
  if (file) input.value = "";
  return file;
}

export function imageFileRejectReason(file: File): string | null {
  if (!isAllowedImageFile(file)) {
    return "Please upload a JPG, PNG, or WebP image.";
  }
  if (file.size <= 0) {
    return "That file looks empty. Try another image.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "File size must be under 10 MB.";
  }
  return null;
}

/** Scale so the longest edge is at most `maxDim`. Zero/invalid sizes stay 0. */
export function fitCanvasSize(
  width: number,
  height: number,
  maxDim: number
): { w: number; h: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { w: 0, h: 0 };
  }
  if (!Number.isFinite(maxDim) || maxDim <= 0) {
    return { w: Math.round(width), h: Math.round(height) };
  }
  if (width <= maxDim && height <= maxDim) {
    return { w: Math.round(width), h: Math.round(height) };
  }
  const ratio = Math.min(maxDim / width, maxDim / height);
  const w = Math.round(width * ratio);
  const h = Math.round(height * ratio);
  if (w <= 0 || h <= 0) return { w: 0, h: 0 };
  return { w, h };
}

/**
 * Editor step strip. Brush (2) requires a decoded image AND a non-zero canvas.
 * A successful pick/drop/paste must set both or we stay on Upload (1).
 */
export function editorLoopStep(input: {
  hasImage: boolean;
  canvasWidth: number;
  hasResult: boolean;
  loading: boolean;
}): 1 | 2 | 3 | 4 {
  if (!input.hasImage || input.canvasWidth <= 0) return 1;
  if (input.hasResult) return 4;
  if (input.loading) return 3;
  return 2;
}
