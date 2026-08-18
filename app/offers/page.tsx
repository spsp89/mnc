import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { OffersView } from "@/components/offers-view";
import { getPublicBusinesses, getPublicOffers } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Local offers",
  description: "Discover current offers from verified local businesses across Kerala.",
};

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const [offers, businesses] = await Promise.all([
    getPublicOffers(),
    getPublicBusinesses(),
  ]);
  const businessById = new Map(businesses.map((business) => [business.id, business]));
  const enrichedOffers = offers.map((offer) => {
    const business = businessById.get(offer.businessId);
    return business
      ? {
          ...offer,
          image: business.coverImage,
          category: business.category,
          locality: business.locality,
          city: business.city,
          whatsapp: business.whatsapp,
        }
      : offer;
  });

  return <AppShell><OffersView liveOffers={enrichedOffers} /></AppShell>;
}
