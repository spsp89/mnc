"use client";

import { appPath } from "@/lib/client-routing";

export type MediaUploadPurpose =
  | "business_image"
  | "product_image"
  | "service_image"
  | "review_image"
  | "verification_document"
  | "delivery_proof"
  | "banner_image"
  | "advertisement_image";

type CompletedUpload = {
  objectKey: string;
  mediaType: "image" | "document";
  contentType: string;
  sizeBytes: number;
  sha256: string;
  storageState: "private" | "quarantined";
};

export type PreparedProductImage = {
  file: File;
  variant: "gallery" | "thumbnail";
  width: number;
  height: number;
};

async function resizeImage(
  source: ImageBitmap,
  originalName: string,
  maxDimension: number,
  quality: number,
  variant: PreparedProductImage["variant"],
): Promise<PreparedProductImage> {
  const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("This browser cannot optimise product images.");
  context.drawImage(source, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => value ? resolve(value) : reject(new Error("Image compression failed.")),
      "image/webp",
      quality,
    );
  });
  const baseName = originalName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
  return {
    file: new File([blob], `${baseName}-${variant}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    }),
    variant,
    width,
    height,
  };
}

export async function prepareProductImageVariants(
  file: File,
): Promise<PreparedProductImage[]> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image.`);
  }
  const bitmap = await createImageBitmap(file);
  try {
    return await Promise.all([
      resizeImage(bitmap, file.name, 1920, 0.82, "gallery"),
      resizeImage(bitmap, file.name, 480, 0.76, "thumbnail"),
    ]);
  } finally {
    bitmap.close();
  }
}

async function sha256Hex(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function responseMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as {
    message?: unknown;
    error?: string;
  } | null;
  if (Array.isArray(body?.message)) return body.message.join(" ");
  if (typeof body?.message === "string") return body.message;
  if (typeof body?.error === "string") return body.error;
  return fallback;
}

export async function uploadPrivateMedia(
  file: File,
  purpose: MediaUploadPurpose,
  businessId?: string,
): Promise<CompletedUpload> {
  const sha256 = await sha256Hex(file);
  const descriptor = {
    purpose,
    businessId,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    sha256,
  };
  const signingResponse = await fetch(appPath("/api/media/uploads"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(descriptor),
  });
  if (!signingResponse.ok) {
    throw new Error(await responseMessage(
      signingResponse,
      `A secure upload URL could not be created (${signingResponse.status}).`,
    ));
  }
  const signingBody = await signingResponse.json() as {
    data: {
      objectKey: string;
      uploadUrl: string;
      headers: Record<string, string>;
    };
  };
  const signedUploadUrl = new URL(signingBody.data.uploadUrl);
  const usesLocalStorage = signedUploadUrl.hostname === "127.0.0.1"
    || signedUploadUrl.hostname === "localhost";
  const uploadResponse = await fetch(
    usesLocalStorage ? appPath("/api/media/uploads/object") : signingBody.data.uploadUrl,
    {
    method: "PUT",
    headers: {
      ...signingBody.data.headers,
      ...(usesLocalStorage
        ? { "x-bnc-local-upload-target": signingBody.data.uploadUrl }
        : {}),
    },
    body: file,
    },
  );
  if (!uploadResponse.ok) {
    throw new Error(await responseMessage(
      uploadResponse,
      `Secure storage rejected the upload (${uploadResponse.status}).`,
    ));
  }
  const completionResponse = await fetch(appPath("/api/media/uploads/complete"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      purpose,
      businessId,
      objectKey: signingBody.data.objectKey,
      contentType: file.type,
      sizeBytes: file.size,
      sha256,
    }),
  });
  if (!completionResponse.ok) {
    throw new Error(await responseMessage(
      completionResponse,
      `The uploaded file could not be verified (${completionResponse.status}).`,
    ));
  }
  const completed = await completionResponse.json() as { data: CompletedUpload };
  return completed.data;
}
