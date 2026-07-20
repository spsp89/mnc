import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

export const uploadRootRelative = "/uploads/businesses";
export const maxUploadBytes = 4 * 1024 * 1024;

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

export type UploadLike = {
  name: string;
  size: number;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type UploadSlot = "cover" | "logo" | "gallery";

export function isUploadLike(value: unknown): value is UploadLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    "type" in value &&
    "arrayBuffer" in value &&
    typeof (value as UploadLike).arrayBuffer === "function"
  );
}

export function safePathSegment(value: string, fallback = "item") {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized || fallback;
}

export function validateImageUpload(file: UploadLike) {
  if (file.size <= 0) {
    return { ok: false as const, message: "No file selected." };
  }

  if (file.size > maxUploadBytes) {
    return { ok: false as const, message: "Image must be 4 MB or smaller." };
  }

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    return { ok: false as const, message: "Only JPG, PNG, WebP, or GIF images are allowed." };
  }

  return { ok: true as const, extension };
}

export function uploadPublicPath(slug: string, slot: UploadSlot, filename: string) {
  return `${uploadRootRelative}/${safePathSegment(slug)}/${slot}/${filename}`;
}

export function resolveUploadPath(publicDir: string, publicPath: string) {
  const root = resolve(publicDir, "uploads", "businesses");
  const target = resolve(publicDir, publicPath.replace(/^\/+/, ""));
  const relation = relative(root, target);

  if (relation.startsWith("..") || relation === ".." || relation.includes(`..${sep}`)) {
    throw new Error("Upload path escaped the businesses upload directory.");
  }

  return { root, target };
}

export async function storeBusinessImage({
  file,
  slug,
  slot,
  publicDir = join(process.cwd(), "public"),
  index = 0,
}: {
  file: UploadLike;
  slug: string;
  slot: UploadSlot;
  publicDir?: string;
  index?: number;
}) {
  const validation = validateImageUpload(file);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const sourceExtension = extname(file.name).toLowerCase();
  const extension = allowedTypes.has(file.type) ? allowedTypes.get(file.type) : sourceExtension;
  const timestamp = Date.now();
  const filename = `${slot}-${index + 1}-${timestamp}${extension}`;
  const publicPath = uploadPublicPath(slug, slot, filename);
  const { target } = resolveUploadPath(publicDir, publicPath);

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));

  return publicPath;
}
