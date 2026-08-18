import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { BncSessionUser, PortalKind } from "@/lib/auth-types";
import {
  accessCookieName,
  apiRequest,
  refreshCookieName,
  safeRelativePath,
  userCanEnterPortal,
} from "@/lib/session-config";

export async function getBncSession(): Promise<BncSessionUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessCookieName)?.value;
  if (!accessToken) return null;
  const response = await apiRequest("/auth/me", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { data?: BncSessionUser };
  return body.data ?? null;
}

export async function requireBncSession(
  returnTo: string,
  portal: PortalKind,
): Promise<BncSessionUser> {
  const safeReturnTo = safeRelativePath(returnTo) ?? "/";
  const user = await getBncSession();
  if (user && userCanEnterPortal(user, portal)) return user;

  const cookieStore = await cookies();
  if (!user && cookieStore.has(refreshCookieName)) {
    redirect(`/api/session/refresh?returnTo=${encodeURIComponent(safeReturnTo)}&portal=${portal}`);
  }
  if (user && portal === "admin") {
    redirect("/admin/login?error=role");
  }
  if (user && portal === "business" && !user.capabilities.business) {
    redirect("/business/add");
  }
  if (portal === "admin") {
    redirect(`/admin/login?returnTo=${encodeURIComponent(safeReturnTo)}`);
  }
  if (portal === "business" && safeReturnTo.startsWith("/merchant")) {
    redirect(`/merchant/login?returnTo=${encodeURIComponent(safeReturnTo)}`);
  }
  redirect(`/login?portal=${portal}&returnTo=${encodeURIComponent(safeReturnTo)}`);
}
