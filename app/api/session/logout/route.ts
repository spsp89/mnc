import { NextRequest, NextResponse } from "next/server";
import {
  apiRequest,
  clearSessionCookies,
  refreshCookieName,
  safeRelativePath,
} from "@/lib/session-config";
import { publicAppUrl } from "@/lib/public-request-url";

async function logout(request: NextRequest) {
  const refreshToken = request.cookies.get(refreshCookieName)?.value;
  if (refreshToken) {
    await apiRequest("/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
  const requestedReturnTo = safeRelativePath(
    request.nextUrl.searchParams.get("returnTo"),
  );
  const returnTo =
    requestedReturnTo === "/" && basePath
      ? basePath
      : requestedReturnTo ?? (basePath || "/");
  const response = NextResponse.redirect(publicAppUrl(request, returnTo));
  clearSessionCookies(response);
  return response;
}

export const POST = logout;
