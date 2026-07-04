import { NextRequest, NextResponse } from "next/server";

import { getCatalogData } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const data = await getCatalogData({
    query: params.get("q") ?? undefined,
    category: params.get("category") ?? undefined,
    featured: params.get("featured") === "true",
    popular: params.get("popular") === "true",
    limit: parseLimit(params.get("limit")),
    sort: parseSort(params.get("sort")),
  });

  return NextResponse.json(data);
}

function parseLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSort(value: string | null) {
  return value === "rating" || value === "distance" ? value : undefined;
}
