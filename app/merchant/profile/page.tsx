import type { Metadata } from "next";
import { MerchantProfileManager } from "@/components/merchant-profile-manager";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Merchant profile", robots: { index: false, follow: false } };

export default async function MerchantProfilePage() {
  const user = await requireBncSession("/merchant/profile", "business");
  return <MerchantProfileManager user={user} />;
}
