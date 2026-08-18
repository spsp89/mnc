import "server-only";

import type { NextResponse } from "next/server";
import type { BncSessionUser, PortalKind } from "@/lib/auth-types";

export const accessCookieName = "bnc_access_token";
export const refreshCookieName = "bnc_refresh_token";

export type ApiSession = {
  user: BncSessionUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
};

export function apiBaseUrl(): string {
  return (
    process.env.BNC_INTERNAL_API_URL ||
    process.env.BNC_API_URL ||
    process.env.NEXT_PUBLIC_BNC_API_URL ||
    "http://127.0.0.1:4000/api/v1"
  ).replace(/\/$/, "");
}

function apiRequestTimeoutMs(): number {
  const configured = Number(process.env.BNC_API_REQUEST_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000 && configured <= 120_000
    ? configured
    : 7_000;
}

export async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      signal: init?.signal ?? AbortSignal.timeout(apiRequestTimeoutMs()),
      headers: {
        accept: "application/json",
        ...init?.headers,
      },
    });
  } catch {
    return new Response(
      JSON.stringify({
        message: "The BNC account service is temporarily unavailable.",
      }),
      {
        status: 503,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

export function apiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const value = body as {
    message?: unknown;
    error?: { message?: unknown };
  };
  const message = value.message ?? value.error?.message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === "string").join(" ") || fallback;
  return typeof message === "string" && message.trim() ? message : fallback;
}

export function portalDestination(
  portal: PortalKind,
  user: BncSessionUser,
  requestedReturnTo?: string,
): string {
  const safeReturnTo = safeRelativePath(requestedReturnTo);
  if (portal === "admin") {
    if (!user.capabilities.admin) return "/admin/login?error=role";
    return safeReturnTo?.startsWith("/admin") ? safeReturnTo : "/admin";
  }
  if (portal === "business") {
    if (!user.capabilities.business) return "/business/add";
    return safeReturnTo?.startsWith("/business") || safeReturnTo?.startsWith("/merchant")
      ? safeReturnTo
      : "/business/dashboard";
  }
  return safeReturnTo &&
    !safeReturnTo.startsWith("/admin") &&
    !safeReturnTo.startsWith("/business")
    ? safeReturnTo
    : "/account";
}

export function userCanEnterPortal(user: BncSessionUser, portal: PortalKind): boolean {
  if (portal === "admin") return user.capabilities.admin;
  if (portal === "business") return user.capabilities.business;
  return user.capabilities.customer;
}

export function userCanSignInForPortal(user: BncSessionUser, portal: PortalKind): boolean {
  if (portal === "admin") return user.capabilities.admin;
  return user.capabilities.customer;
}

export function setSessionCookies(response: NextResponse, session: ApiSession): void {
  const secure =
    process.env.NODE_ENV === "production" &&
    process.env.BNC_SECURE_COOKIES !== "false";
  response.cookies.set(accessCookieName, session.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: session.accessTokenExpiresInSeconds,
  });
  response.cookies.set(refreshCookieName, session.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  const secure =
    process.env.NODE_ENV === "production" &&
    process.env.BNC_SECURE_COOKIES !== "false";
  response.cookies.set(accessCookieName, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(refreshCookieName, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function safeRelativePath(value?: string | null): string | null {
  if (!value?.startsWith("/") || value.startsWith("//")) return null;
  try {
    const url = new URL(value, "https://bnc.local");
    if (url.origin !== "https://bnc.local") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
