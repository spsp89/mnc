import type { Metadata } from "next";
import { CustomerAccountView } from "@/components/customer-account-view";
import { getCustomerPortalData } from "@/lib/portal-data";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireBncSession("/account", "customer");
  const data = await getCustomerPortalData();
  return (
    <CustomerAccountView
      user={user}
      data={data}
      signOutPath="/api/session/logout?returnTo=/"
    />
  );
}
