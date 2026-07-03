import { NextResponse } from "next/server";

import { getCatalogData } from "@/lib/catalog";

export async function GET() {
  const data = await getCatalogData();
  return NextResponse.json(data);
}
