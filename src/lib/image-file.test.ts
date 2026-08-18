/**
 * Editor upload state-machine tests.
 *
 * P0 reproduction (narrow / mobile, after redeploy):
 * 1. Open workers.dev, hard-refresh, tap Try It / Open editor
 * 2. Pick, drop, or paste a JPG/PNG/WebP
 * 3. Step strip must leave "1 Upload" and show "2 Brush" with toolbar
 * 4. A rejected file must toast — never sit silently on Upload with canvas 0
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_IMAGE_DIM, MAX_UPLOAD_BYTES, remainingEditsLabel } from "./remove-limits.ts";
import {
  createOncePerTurnDeliver,
  editorLoopStep,
  fileFromDataTransfer,
  fileFromInputElement,
  fitCanvasSize,
  imageFileRejectReason,
  isAllowedImageFile,
  acceptImageFile,
  pickFirstFile,
  takeAcceptedInputFile,
} from "./image-file.ts";
import { prepareEditorImage } from "./prepare-editor-image.ts";

function makeFile(
  name: string,
  type: string,
  size = 32
): File {
  return new File([new Uint8Array(size)], name, { type });
}

test("isAllowedImageFile accepts jpeg/png/webp and empty-type extensions", () => {
  assert.equal(isAllowedImageFile(makeFile("a.jpg", "image/jpeg")), true);
  assert.equal(isAllowedImageFile(makeFile("a.jpeg", "image/pjpeg")), true);
  assert.equal(isAllowedImageFile(makeFile("a.png", "image/png")), true);
  assert.equal(isAllowedImageFile(makeFile("a.webp", "image/webp")), true);
  assert.equal(isAllowedImageFile(makeFile("shot.JPG", "")), true);
  assert.equal(isAllowedImageFile(makeFile("shot.png", "application/octet-stream")), true);
  assert.equal(isAllowedImageFile(makeFile("shot.heic", "image/heic")), false);
  assert.equal(isAllowedImageFile(makeFile("notes.txt", "text/plain")), false);
});

test("imageFileRejectReason covers type, empty, and oversize", () => {
  assert.equal(
    imageFileRejectReason(makeFile("x.gif", "image/gif")),
    "Please upload a JPG, PNG, or WebP image."
  );
  assert.equal(
    imageFileRejectReason(makeFile("x.jpg", "image/jpeg", 0)),
    "That file looks empty. Try another image."
  );
  const big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "x.jpg", {
    type: "image/jpeg",
  });
  assert.equal(imageFileRejectReason(big), "File size must be under 10 MB.");
  assert.equal(imageFileRejectReason(makeFile("ok.png", "image/png")), null);
});

test("fitCanvasSize never returns a partial zero; scales to max edge", () => {
  assert.deepEqual(fitCanvasSize(0, 100, MAX_IMAGE_DIM), { w: 0, h: 0 });
  assert.deepEqual(fitCanvasSize(800, 600, MAX_IMAGE_DIM), { w: 800, h: 600 });
  const fitted = fitCanvasSize(4000, 2000, MAX_IMAGE_DIM);
  assert.equal(fitted.w, MAX_IMAGE_DIM);
  assert.equal(fitted.h, Math.round(2000 * (MAX_IMAGE_DIM / 4000)));
  assert.ok(fitted.w > 0 && fitted.h > 0);
});

test("editorLoopStep stays on Upload until image AND non-zero canvas exist", () => {
  assert.equal(
    editorLoopStep({
      hasImage: false,
      canvasWidth: 0,
      hasResult: false,
      loading: false,
    }),
    1
  );
  assert.equal(
    editorLoopStep({
      hasImage: true,
      canvasWidth: 0,
      hasResult: false,
      loading: false,
    }),
    1
  );
  assert.equal(
    editorLoopStep({
      hasImage: true,
      canvasWidth: 800,
      hasResult: false,
      loading: false,
    }),
    2
  );
  assert.equal(
    editorLoopStep({
      hasImage: true,
      canvasWidth: 800,
      hasResult: false,
      loading: true,
    }),
    3
  );
  assert.equal(
    editorLoopStep({
      hasImage: true,
      canvasWidth: 800,
      hasResult: true,
      loading: false,
    }),
    4
  );
});

test("fileFromInputElement only clears the input when a file is present", () => {
  const file = makeFile("ok.jpg", "image/jpeg");
  const withFile = {
    files: { 0: file, length: 1 } as unknown as FileList,
    value: "C:\\fakepath\\ok.jpg",
  };
  assert.equal(fileFromInputElement(withFile as HTMLInputElement), file);
  assert.equal(withFile.value, "");

  const empty = {
    files: { length: 0 } as unknown as FileList,
    value: "pending",
  };
  assert.equal(fileFromInputElement(empty as HTMLInputElement), null);
  assert.equal(empty.value, "pending");

  assert.equal(fileFromInputElement(null), null);
});

test("second consume of the same input is empty (dual change/input race)", () => {
  const file = makeFile("ok.jpg", "image/jpeg");
  const input = {
    files: { 0: file, length: 1 } as unknown as FileList,
    value: "C:\\fakepath\\ok.jpg",
  };
  const first = takeAcceptedInputFile(input as HTMLInputElement);
  assert.deepEqual(first, { ok: true, file });
  assert.equal(input.value, "");
  // Simulate the second React/native handler after the first cleared value.
  input.files = { length: 0 } as unknown as FileList;
  assert.equal(takeAcceptedInputFile(input as HTMLInputElement), null);
});

test("takeAcceptedInputFile toasts-ready reject without calling through", () => {
  const gif = makeFile("x.gif", "image/gif");
  const input = {
    files: { 0: gif, length: 1 } as unknown as FileList,
    value: "C:\\fakepath\\x.gif",
  };
  assert.deepEqual(takeAcceptedInputFile(input as HTMLInputElement), {
    ok: false,
    error: "Please upload a JPG, PNG, or WebP image.",
  });
});

test("createOncePerTurnDeliver ignores a second emit in the same turn", async () => {
  const deliver = createOncePerTurnDeliver();
  const seen: string[] = [];
  assert.equal(
    deliver("first", (v) => {
      seen.push(v);
    }),
    true
  );
  assert.equal(
    deliver("second", (v) => {
      seen.push(v);
    }),
    false
  );
  assert.deepEqual(seen, ["first"]);
  await Promise.resolve();
  assert.equal(
    deliver("third", (v) => {
      seen.push(v);
    }),
    true
  );
  assert.deepEqual(seen, ["first", "third"]);
});

test("pickFirstFile reads index 0", () => {
  const file = makeFile("ok.jpg", "image/jpeg");
  assert.equal(pickFirstFile({ 0: file, length: 1 } as unknown as FileList), file);
  assert.equal(pickFirstFile(undefined), null);
});

test("fileFromDataTransfer prefers items then files (drop path)", () => {
  const fromItems = makeFile("from-items.png", "image/png");
  const fromFiles = makeFile("from-files.jpg", "image/jpeg");
  const withItems = {
    items: [
      { kind: "string", getAsFile: () => null },
      { kind: "file", getAsFile: () => fromItems },
    ],
    files: { 0: fromFiles, length: 1 },
  };
  assert.equal(
    fileFromDataTransfer(withItems as unknown as DataTransfer),
    fromItems
  );

  const filesOnly = {
    items: [],
    files: { 0: fromFiles, length: 1 },
  };
  assert.equal(
    fileFromDataTransfer(filesOnly as unknown as DataTransfer),
    fromFiles
  );
  assert.equal(fileFromDataTransfer(null), null);
  assert.equal(
    fileFromDataTransfer({ items: [], files: { length: 0 } } as unknown as DataTransfer),
    null
  );
});

test("acceptImageFile maps reject reasons for drop/pick callers", () => {
  assert.equal(acceptImageFile(null), null);
  assert.deepEqual(acceptImageFile(makeFile("x.gif", "image/gif")), {
    ok: false,
    error: "Please upload a JPG, PNG, or WebP image.",
  });
  const empty = makeFile("x.jpg", "image/jpeg", 0);
  assert.deepEqual(acceptImageFile(empty), {
    ok: false,
    error: "That file looks empty. Try another image.",
  });
  const ok = makeFile("ok.webp", "image/webp");
  assert.deepEqual(acceptImageFile(ok), { ok: true, file: ok });
});

test("prepareEditorImage rejects bad files before needing a document", async () => {
  await assert.rejects(
    () => prepareEditorImage(makeFile("x.gif", "image/gif")),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.equal(err.message, "Please upload a JPG, PNG, or WebP image.");
      return true;
    }
  );
  await assert.rejects(
    () => prepareEditorImage(makeFile("empty.jpg", "image/jpeg", 0)),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.equal(err.message, "That file looks empty. Try another image.");
      return true;
    }
  );
  const big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.jpg", {
    type: "image/jpeg",
  });
  await assert.rejects(
    () => prepareEditorImage(big),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.equal(err.message, "File size must be under 10 MB.");
      return true;
    }
  );
});

test("remainingEditsLabel EN/ZH quota badge copy", () => {
  assert.equal(remainingEditsLabel(2, 2), "Remaining 2/2 free");
  assert.equal(remainingEditsLabel(1), "Remaining 1/2 free");
  assert.equal(remainingEditsLabel(2, 2, "zh"), "剩余 2/2 次免费");
  assert.equal(remainingEditsLabel(1, 2, "zh"), "剩余 1/2 次免费");
});
