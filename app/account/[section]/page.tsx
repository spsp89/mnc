import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireBncSession } from "@/lib/server-auth";
import { AccountSectionView, type AccountSection } from "@/components/account-section-view";
import { getCustomerPortalData } from "@/lib/portal-data";

const sections: AccountSection[] = ["enquiries", "reviews", "history", "addresses", "blocked", "privacy", "settings"];

export const metadata: Metadata = { title: "Your BNC account" };
export const dynamic = "force-dynamic";

export default async function AccountSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as AccountSection)) notFound();
  const user = await requireBncSession(`/account/${section}`, "customer");
  const data = await getCustomerPortalData();
  return (
    <AccountSectionView
      section={section as AccountSection}
      user={user}
      data={data}
    />
  );
}
