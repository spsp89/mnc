import type { NextRequest } from "next/server";

function publicOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall through to reverse-proxy headers.
    }
  }
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}

export function publicAppUrl(request: NextRequest, path: string): URL {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "")
    .trim()
    .replace(/\/+$/, "");
  const appPath =
    basePath &&
    path.startsWith("/") &&
    path !== basePath &&
    !path.startsWith(`${basePath}/`)
      ? `${basePath}${path}`
      : path;
  return new URL(appPath, `${publicOrigin(request)}/`);
}
