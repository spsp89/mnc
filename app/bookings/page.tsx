import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { BookingDirectory } from "@/components/booking-directory";
import { getPublicServices } from "@/lib/public-api";

export const metadata: Metadata = { title: "Book appointments", description: "Book clinics, doctors, salons and beauty services through BNC." };
export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const all = await getPublicServices({ pageSize: 50 });
  const relevant = all.filter((listing) =>
    /doctor|clinic|dental|health|beauty|salon|spa|hair|makeup|wellness/i.test(
      `${listing.service.name} ${listing.business.category} ${listing.description}`,
    ),
  );
  return <AppShell><BookingDirectory listings={relevant.length ? relevant : all} /></AppShell>;
}
