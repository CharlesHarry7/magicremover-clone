/** Shared upload picking for Hero + ImageEditor (click, drop, paste). */

import { MAX_UPLOAD_BYTES } from "@/lib/remove-limits";

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

/** Read then clear so the same file can be picked again. */
export function fileFromInputElement(
  input: HTMLInputElement | null | undefined
): File | null {
  if (!input) return null;
  const file = pickFirstFile(input.files);
  input.value = "";
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
