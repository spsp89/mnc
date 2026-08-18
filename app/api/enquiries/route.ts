import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOriginMutation } from "@/lib/request-security";
import { accessCookieName, apiRequest } from "@/lib/session-config";

const enquirySchema = z.object({
  businessId: z.string().min(3).max(100),
  categoryId: z.string().min(3).max(100),
  requirement: z.string().min(4).max(1000),
  locality: z.string().min(2).max(100),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  preferredDate: z.string().date().optional(),
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().min(10).max(16),
  contactPreference: z.enum(["call", "whatsapp", "either", "in_app"]),
  consent: z.literal(true),
});

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ message: "Cross-origin submission blocked." }, { status: 403 });
  }
  const result = enquirySchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json(
      { message: "Please review the enquiry details.", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessCookieName)?.value;
  const upstream = await apiRequest("/enquiries", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      ...result.data,
      phone: result.data.phone.replace(/[^\d+]/g, ""),
      urgency: "STANDARD",
    }),
  });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
