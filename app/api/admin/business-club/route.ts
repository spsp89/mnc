import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET() {
  return authenticatedApiRequest("/admin/business-club");
}

export async function POST(request: Request) {
  return authenticatedApiRequest("/admin/business-club/chapters", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
