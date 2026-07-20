import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const adminSessionCookieName = "nearu_admin_session";
const sessionTtlSeconds = 60 * 60 * 8;

type AdminSessionPayload = {
  user: string;
  exp: number;
};

export function adminLoginConfig() {
  const configuredSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim() || "";

  return {
    username: process.env.ADMIN_USERNAME?.trim() || "admin",
    password,
    secret: configuredSecret || (process.env.NODE_ENV === "production" ? "" : password),
  };
}

export function isAdminPasswordConfigured() {
  return adminLoginConfig().password.length > 0;
}

export function validateAdminCredentials(username: string, password: string) {
  const config = adminLoginConfig();

  if (!config.password) {
    return false;
  }

  return safeEqual(username.trim(), config.username) && safeEqual(password, config.password);
}

export async function createAdminSession(username: string) {
  if (!adminLoginConfig().secret) {
    throw new Error("ADMIN_SESSION_SECRET must be set before creating admin sessions.");
  }

  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, signSession({ user: username, exp: expiresAt() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookieName);
}

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!verifyAdminSessionToken(token)) {
    redirect("/admin/login");
  }
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token) {
    return false;
  }

  const [payloadPart, signature] = token.split(".");
  if (!payloadPart || !signature) {
    return false;
  }

  const expectedSignature = signPayload(payloadPart);
  if (!safeEqual(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8"),
    ) as AdminSessionPayload;

    return typeof payload.user === "string" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function signSession(payload: AdminSessionPayload) {
  const payloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadPart}.${signPayload(payloadPart)}`;
}

function signPayload(payloadPart: string) {
  const secret = adminLoginConfig().secret;
  if (!secret) {
    return "";
  }

  return createHmac("sha256", secret)
    .update(payloadPart)
    .digest("base64url");
}

function expiresAt() {
  return Math.floor(Date.now() / 1000) + sessionTtlSeconds;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
