import { NextRequest, NextResponse } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  for (const key of ["businessId", "from", "to"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }
  const response = await authenticatedApiRequest(`/analytics/business?${query.toString()}`);
  if (response.ok || response.status !== 400) return response;

  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  const [managedResponse, enquiriesResponse, leadsResponse, reviewsResponse] = await Promise.all([
    authenticatedApiRequest(`/businesses/manage/${encodeURIComponent(businessId)}`),
    authenticatedApiRequest(`/enquiries/business?businessId=${encodeURIComponent(businessId)}`),
    authenticatedApiRequest(`/leads?businessId=${encodeURIComponent(businessId)}`),
    authenticatedApiRequest(`/reviews/business/${encodeURIComponent(businessId)}?page=1&pageSize=50`),
  ]);
  const [managedBody, enquiriesBody, leadsBody, reviewsBody] = await Promise.all([
    managedResponse.json().catch(() => null),
    enquiriesResponse.json().catch(() => null),
    leadsResponse.json().catch(() => null),
    reviewsResponse.json().catch(() => null),
  ]) as Array<{ data?: unknown; meta?: { averageRating?: number | null } } | null>;
  const managed = managedBody?.data && typeof managedBody.data === "object"
    ? managedBody.data as { products?: Array<{ status?: string }>; reviewCount?: number; averageRating?: number }
    : {};
  const enquiries = Array.isArray(enquiriesBody?.data) ? enquiriesBody.data : [];
  const leads = Array.isArray(leadsBody?.data) ? leadsBody.data : [];
  const reviews = Array.isArray(reviewsBody?.data) ? reviewsBody.data : [];
  return NextResponse.json({
    data: {
      range: {
        from: request.nextUrl.searchParams.get("from"),
        to: request.nextUrl.searchParams.get("to"),
      },
      events: {},
      enquiries: enquiries.length,
      matchedLeads: leads.length,
      saves: 0,
      reviews: {
        count: reviews.length || managed.reviewCount || 0,
        averageRating: reviewsBody?.meta?.averageRating ?? managed.averageRating ?? null,
      },
      rates: { profileToContact: 0, profileToEnquiry: 0 },
      publishedProducts: managed.products?.filter((product) => product.status === "PUBLISHED").length ?? 0,
      source: "catalog-fallback",
    },
  });
}
