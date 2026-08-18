import type { Metadata } from "next";
import { BusinessOrdersView } from "@/components/business-orders-view";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Business orders", robots: { index: false, follow: false } };

export default async function BusinessOrdersPage() {
  const user = await requireBncSession("/business/orders", "business");
  return <BusinessOrdersView user={user} />;
}
