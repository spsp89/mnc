import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { getBusinessBySlug } from "@/lib/catalog";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const decodedSlug = decodeURIComponent(slug).trim();

    if (!isValidSlug(decodedSlug)) {
      return apiError(
        "INVALID_SLUG",
        "Business slug must contain only lowercase letters, numbers, and hyphens.",
        400,
        { slug: decodedSlug },
      );
    }

    const business = await getBusinessBySlug(decodedSlug);

    if (!business) {
      return apiError(
        "BUSINESS_NOT_FOUND",
        "No business listing was found for this slug.",
        404,
        { slug: decodedSlug },
      );
    }

    return NextResponse.json({
      ok: true,
      business,
    });
  } catch (error) {
    console.error("Business detail API failed", error);

    return apiError("BUSINESS_ERROR", "Unable to load business listing.", 500);
  }
}

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
