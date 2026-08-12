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
  fileFromInputElement,
  fitCanvasSize,
  imageFileRejectReason,
  isAllowedImageFile,
  pickFirstFile,
  takeAcceptedInputFile,
} from "./image-file.ts";

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

test("remainingEditsLabel uses 剩余 X/Y 次免费", () => {
  assert.equal(remainingEditsLabel(2, 2), "剩余 2/2 次免费");
  assert.equal(remainingEditsLabel(1), "剩余 1/2 次免费");
});
