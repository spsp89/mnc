import { NextResponse } from "next/server";
import type { PortalKind } from "@/lib/auth-types";
import {
  apiRequest,
  apiErrorMessage,
  type ApiSession,
  portalDestination,
  setSessionCookies,
  userCanSignInForPortal,
} from "@/lib/session-config";

export async function POST(request: Request) {
  const input = (await request.json()) as {
    email?: string;
    code?: string;
    portal?: PortalKind;
    returnTo?: string;
  };
  const portal = input.portal ?? "customer";
  const upstream = await apiRequest("/auth/email/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: input.email, code: input.code }),
  });
  const body = (await upstream.json()) as { data?: ApiSession; message?: string; error?: { message?: string } };
  if (!upstream.ok || !body.data) {
    return NextResponse.json(
      { message: apiErrorMessage(body, "Email verification failed.") },
      { status: upstream.status },
    );
  }
  if (!userCanSignInForPortal(body.data.user, portal)) {
    return NextResponse.json(
      { message: "This account does not have access to the selected workspace." },
      { status: 403 },
    );
  }
  const response = NextResponse.json({
    data: {
      user: body.data.user,
      destination: portalDestination(portal, body.data.user, input.returnTo),
    },
  });
  setSessionCookies(response, body.data);
  return response;
}
