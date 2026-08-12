/** Browser-only: decode a picked file onto an offscreen canvas for ImageEditor. */

import { MAX_IMAGE_DIM } from "./remove-limits.ts";
import { fitCanvasSize, imageFileRejectReason } from "./image-file.ts";

export const DECODE_ERROR =
  "Could not decode that image. Try JPG, PNG, or WebP.";
export const PREPARE_ERROR =
  "Could not prepare that image. Try another photo.";
export const DECODE_TIMEOUT_ERROR =
  "Timed out opening that image. Try a smaller JPG, PNG, or WebP.";
export const DECODE_TIMEOUT_MS = 15_000;

export type PreparedEditorImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  beforeUrl: string;
  dispose: () => void;
};

function rasterize(
  source: CanvasImageSource,
  width: number,
  height: number
): string {
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d");
  if (!ctx) throw new Error(PREPARE_ERROR);
  ctx.drawImage(source, 0, 0, width, height);
  return offscreen.toDataURL("image/jpeg", 0.92);
}

async function imageElementFromBlob(blob: Blob): Promise<{
  image: HTMLImageElement;
  dispose: () => void;
}> {
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";

  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(DECODE_ERROR));
  });
  image.src = url;

  try {
    if (typeof image.decode === "function") {
      try {
        await image.decode();
      } catch {
        await loaded;
      }
    } else {
      await loaded;
    }
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(DECODE_ERROR);
  }

  return {
    image,
    dispose: () => URL.revokeObjectURL(url),
  };
}

async function decodeSource(file: File): Promise<{
  source: CanvasImageSource;
  naturalWidth: number;
  naturalHeight: number;
  dispose: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          naturalWidth: bitmap.width,
          naturalHeight: bitmap.height,
          dispose: () => bitmap.close(),
        };
      }
      bitmap.close();
    } catch {
      // HEIC / odd codecs: fall through to HTMLImageElement + object URL.
    }
  }

  const { image, dispose } = await imageElementFromBlob(file);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  return { source: image, naturalWidth, naturalHeight, dispose };
}

async function decodeAndRasterize(file: File): Promise<PreparedEditorImage> {
  const decoded = await decodeSource(file);
  const size = fitCanvasSize(
    decoded.naturalWidth,
    decoded.naturalHeight,
    MAX_IMAGE_DIM
  );
  if (!size.w || !size.h) {
    decoded.dispose();
    throw new Error(DECODE_ERROR);
  }
  try {
    const beforeUrl = rasterize(decoded.source, size.w, size.h);
    return {
      source: decoded.source,
      width: size.w,
      height: size.h,
      beforeUrl,
      dispose: decoded.dispose,
    };
  } catch (err) {
    decoded.dispose();
    throw err instanceof Error ? err : new Error(PREPARE_ERROR);
  }
}

/**
 * Decode a user file to a drawable source + non-zero canvas size.
 * Throws an Error with a toast-ready message; never returns a 0×0 canvas.
 */
export async function prepareEditorImage(
  file: File
): Promise<PreparedEditorImage> {
  if (typeof document === "undefined") {
    throw new Error(PREPARE_ERROR);
  }

  const reason = imageFileRejectReason(file);
  if (reason) throw new Error(reason);

  const work = decodeAndRasterize(file);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(DECODE_TIMEOUT_ERROR)),
      DECODE_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([work, timeout]);
  } catch (err) {
    void work.then((prepared) => prepared.dispose()).catch(() => {});
    throw err instanceof Error ? err : new Error(DECODE_ERROR);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
