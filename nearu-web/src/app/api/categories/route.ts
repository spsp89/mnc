import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { getCategoriesData } from "@/lib/catalog";

export async function GET() {
  try {
    const categories = getCategoriesData();

    return NextResponse.json({
      ok: true,
      categories,
      meta: {
        count: categories.length,
      },
    });
  } catch (error) {
    console.error("Categories API failed", error);

    return apiError("CATEGORIES_ERROR", "Unable to load categories.", 500);
  }
}
