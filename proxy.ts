import { NextRequest, NextResponse } from "next/server";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function proxy(request: NextRequest) {
  if (safeMethods.has(request.method)) return NextResponse.next();

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return NextResponse.json(
      { message: "Cross-site form submissions are not accepted." },
      { status: 403 },
    );
  }

  const origin = request.headers.get("origin");
  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProtocol =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  const allowedOrigins = new Set(
    [
      request.nextUrl.origin,
      process.env.NEXT_PUBLIC_SITE_URL,
      forwardedHost ? `${forwardedProtocol}://${forwardedHost}` : undefined,
    ].filter((value): value is string => Boolean(value)),
  );
  if (origin && !allowedOrigins.has(origin)) {
    return NextResponse.json(
      { message: "Request origin is not allowed." },
      { status: 403 },
    );
  }
  if (!origin && process.env.NODE_ENV === "production") {
    const referer = request.headers.get("referer");
    let refererOrigin: string | null = null;
    try {
      refererOrigin = referer ? new URL(referer).origin : null;
    } catch {
      refererOrigin = null;
    }
    if (
      fetchSite !== "same-origin" ||
      !refererOrigin ||
      !allowedOrigins.has(refererOrigin)
    ) {
      return NextResponse.json(
        { message: "A browser origin is required." },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
