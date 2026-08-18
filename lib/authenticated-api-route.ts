import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accessCookieName, apiRequest } from "@/lib/session-config";

export async function authenticatedApiRequest(
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessCookieName)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }
  const upstream = await apiRequest(path, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
  const text = await upstream.text();
  return new NextResponse(text || null, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
