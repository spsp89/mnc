import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PricingView } from "@/components/pricing-view";
import { getPublicSubscriptionPlans } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Business plans",
  description: "Compare Bronze, Silver, Gold, Platinum, Diamond and Ruby plans for local businesses on BNC.",
};

export default async function PricingPage() {
  const plans = await getPublicSubscriptionPlans();
  return <AppShell headerVariant="immersive"><PricingView plans={plans} /></AppShell>;
}
