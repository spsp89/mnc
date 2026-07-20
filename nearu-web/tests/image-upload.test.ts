import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";

import {
  resolveUploadPath,
  safePathSegment,
  storeBusinessImage,
  validateImageUpload,
  type UploadLike,
} from "../src/lib/image-upload";

function file(input: Partial<UploadLike> = {}): UploadLike {
  const body = Buffer.from("image-bytes");

  return {
    name: input.name ?? "Cover Image.png",
    size: input.size ?? body.byteLength,
    type: input.type ?? "image/png",
    arrayBuffer: input.arrayBuffer ?? (async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)),
  };
}

describe("image upload helpers", () => {
  test("sanitizes path segments", () => {
    assert.equal(safePathSegment("../My Shop!"), "my-shop");
    assert.equal(safePathSegment(""), "item");
  });

  test("validates image type and size", () => {
    assert.equal(validateImageUpload(file()).ok, true);
    assert.equal(validateImageUpload(file({ type: "text/plain" })).ok, false);
    assert.equal(validateImageUpload(file({ size: 5 * 1024 * 1024 })).ok, false);
  });

  test("prevents upload path traversal", () => {
    const publicDir = join(tmpdir(), "nearu-public");
    assert.throws(() => resolveUploadPath(publicDir, "/uploads/businesses/../escape.png"));
  });

  test("stores a valid image inside public uploads", async () => {
    const publicDir = mkdtempSync(join(tmpdir(), "nearu-public-"));
    const publicPath = await storeBusinessImage({
      file: file(),
      slug: "Spec Runner Cafe",
      slot: "cover",
      publicDir,
    });

    assert.match(publicPath, /^\/uploads\/businesses\/spec-runner-cafe\/cover\/cover-1-/);
    const { target } = resolveUploadPath(publicDir, publicPath);
    assert.equal((await readFile(target)).toString(), "image-bytes");
  });
});
