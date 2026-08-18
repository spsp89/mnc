import { NextRequest, NextResponse } from "next/server";
import type { PortalKind } from "@/lib/auth-types";
import { publicAppUrl } from "@/lib/public-request-url";
import {
  apiRequest,
  type ApiSession,
  clearSessionCookies,
  portalDestination,
  refreshCookieName,
  safeRelativePath,
  setSessionCookies,
  userCanSignInForPortal,
} from "@/lib/session-config";

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get(refreshCookieName)?.value;
  const portal = (request.nextUrl.searchParams.get("portal") ?? "customer") as PortalKind;
  const returnTo = safeRelativePath(request.nextUrl.searchParams.get("returnTo"));
  if (!refreshToken) {
    return NextResponse.redirect(publicAppUrl(request, `/login?portal=${portal}`));
  }
  const upstream = await apiRequest("/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const body = (await upstream.json()) as { data?: ApiSession };
  if (!upstream.ok || !body.data || !userCanSignInForPortal(body.data.user, portal)) {
    const response = NextResponse.redirect(publicAppUrl(request, `/login?portal=${portal}`));
    clearSessionCookies(response);
    return response;
  }
  const destination = portalDestination(portal, body.data.user, returnTo ?? undefined);
  const response = NextResponse.redirect(publicAppUrl(request, destination));
  setSessionCookies(response, body.data);
  return response;
}
