import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { accessCookieName, apiRequest } from "@/lib/session-config";

export async function GET(request: NextRequest) {
  const objectKey = request.nextUrl.searchParams.get("objectKey");
  const businessId = request.nextUrl.searchParams.get("businessId");
  const purpose = request.nextUrl.searchParams.get("purpose") ?? "product_image";
  if (!objectKey || !businessId) {
    return NextResponse.json({ message: "Media reference is incomplete." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessCookieName)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }
  const downloadResponse = await apiRequest("/media/downloads", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ objectKey, businessId, purpose, disposition: "inline" }),
  });
  const downloadBody = await downloadResponse.json().catch(() => null) as {
    data?: { downloadUrl?: string };
    message?: string;
  } | null;
  if (!downloadResponse.ok || !downloadBody?.data?.downloadUrl) {
    return NextResponse.json(
      { message: downloadBody?.message ?? "Media is unavailable." },
      { status: downloadResponse.status },
    );
  }

  const objectResponse = await fetch(downloadBody.data.downloadUrl, { cache: "no-store" });
  if (!objectResponse.ok || !objectResponse.body) {
    return NextResponse.json({ message: "Media could not be loaded." }, { status: 502 });
  }
  return new NextResponse(objectResponse.body, {
    status: 200,
    headers: {
      "cache-control": "private, no-store",
      "content-type": objectResponse.headers.get("content-type") ?? "application/octet-stream",
      "x-content-type-options": "nosniff",
    },
  });
}
