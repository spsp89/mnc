import { NextRequest, NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { getCatalogData, type CatalogFilters, type CatalogSort } from "@/lib/catalog";

const validSorts = new Set<CatalogSort>(["default", "rating", "distance", "name"]);

export async function GET(request: NextRequest) {
  try {
    const parsed = parseCatalogFilters(request.nextUrl.searchParams);

    if (!parsed.ok) {
      return apiError("INVALID_QUERY", parsed.message, 400, parsed.details);
    }

    const data = await getCatalogData(parsed.filters);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Catalog API failed", error);
    return apiError("CATALOG_ERROR", "Unable to load catalog data.", 500);
  }
}

function parseCatalogFilters(params: URLSearchParams):
  | { ok: true; filters: CatalogFilters }
  | {
      ok: false;
      message: string;
      details: Record<string, string>;
    } {
  const details: Record<string, string> = {};
  const sort = (params.get("sort") ?? "default").trim().toLowerCase();
  const limit = params.get("limit");
  const featured = parseBooleanParam(params.get("featured"), "featured", details);
  const popular = parseBooleanParam(params.get("popular"), "popular", details);
  const query = validateOptionalText(params.get("q"), "q", 80, details);
  const category = validateOptionalText(params.get("category"), "category", 60, details);

  if (!validSorts.has(sort as CatalogSort)) {
    details.sort = "Use one of: default, rating, distance, name.";
  }

  let parsedLimit: number | undefined;
  if (limit !== null && limit.trim() !== "") {
    const numericLimit = Number(limit);
    if (!Number.isInteger(numericLimit) || numericLimit < 1) {
      details.limit = "Limit must be a positive integer.";
    } else {
      parsedLimit = Math.min(numericLimit, 100);
    }
  }

  if (Object.keys(details).length > 0) {
    return {
      ok: false,
      message: "One or more query parameters are invalid.",
      details,
    };
  }

  return {
    ok: true,
    filters: {
      query,
      category,
      featured,
      popular,
      limit: parsedLimit,
      sort: sort as CatalogSort,
    },
  };
}

function parseBooleanParam(
  value: string | null,
  name: string,
  details: Record<string, string>,
) {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  details[name] = "Use true or false.";
  return undefined;
}

function validateOptionalText(
  value: string | null,
  name: string,
  maxLength: number,
  details: Record<string, string>,
) {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > maxLength) {
    details[name] = `Must be ${maxLength} characters or fewer.`;
    return undefined;
  }

  return normalized;
}
