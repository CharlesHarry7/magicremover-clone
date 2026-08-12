/** Shared upload picking for Hero + ImageEditor (click, drop, paste). */

const ALLOWED_TYPE = /^image\/(jpeg|png|webp)$/i;
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

export function isAllowedImageFile(file: File): boolean {
  if (ALLOWED_TYPE.test(file.type)) return true;
  // Some OS / automation pickers leave `type` empty.
  if (!file.type && ALLOWED_EXT.test(file.name)) return true;
  return false;
}

export function pickFirstFile(
  list: FileList | null | undefined
): File | null {
  return list?.[0] ?? null;
}
