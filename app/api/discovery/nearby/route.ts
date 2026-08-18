import { NextRequest, NextResponse } from "next/server";
import { getPublicProducts, searchPublicBusinesses } from "@/lib/public-api";

const validRadii = new Set([1, 3, 5, 10, 25, 50]);

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("latitude"));
  const longitude = Number(request.nextUrl.searchParams.get("longitude"));
  const requestedRadius = Number(request.nextUrl.searchParams.get("radius") ?? 5);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json({ message: "Valid latitude and longitude are required." }, { status: 400 });
  }
  const radius = validRadii.has(requestedRadius) ? requestedRadius : 5;
  const [businesses, products] = await Promise.all([
    searchPublicBusinesses({
      latitude,
      longitude,
      radius,
      sort: "recommended",
    }),
    getPublicProducts({
      latitude,
      longitude,
      radius,
      sort: "recommended",
      pageSize: 50,
    }),
  ]);
  const insideSelectedRadius = (distanceKm: number | undefined) =>
    distanceKm !== undefined && distanceKm <= radius;
  return NextResponse.json({
    data: businesses
      .filter((business) => insideSelectedRadius(business.distanceKm))
      .map((business) => ({
        business,
        starLevel: business.bncStarLevel,
        featured: business.sponsored,
      })),
    products: products.filter((product) => insideSelectedRadius(product.distanceKm)),
  });
}
