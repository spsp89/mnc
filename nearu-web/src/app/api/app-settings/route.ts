import { NextResponse } from "next/server";

import { getGoAppSettings } from "@/lib/go-api";

export async function GET() {
  try {
    return NextResponse.json({ settings: await getGoAppSettings() });
  } catch {
    return NextResponse.json(
      {
        settings: {
          siteName: "BNC Nearu",
          tagline: "Local shops, services, offers, and bookings in one place.",
          primaryColor: "#0B2F74",
          secondaryColor: "#1C4EA1",
          accentColor: "#F4B227",
          backgroundColor: "#F8F6EF",
          surfaceColor: "#FFFCF7",
          mutedTextColor: "#6B7E9D",
          logoUrl: "/assets/branding/bnc-logo.png",
          defaultCity: "Kozhikode",
          defaultRegion: "Kerala",
          supportPhone: "+91 98765 00000",
          supportWhatsApp: "+91 98765 00000",
          supportEmail: "support@bncnearu.com",
          currencyCode: "INR",
          enableDeals: true,
          enableDoctorBookings: true,
          updateIntervalSeconds: 30,
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  }
}
