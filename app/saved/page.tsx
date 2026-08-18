import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { SavedView } from "@/components/saved-view";
import { getCustomerPortalData } from "@/lib/portal-data";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Saved businesses" };

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  await requireBncSession("/saved", "customer");
  const data = await getCustomerPortalData();
  return <AppShell><SavedView data={data} /></AppShell>;
}
