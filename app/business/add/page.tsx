import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { BusinessOnboardingView } from "@/components/business-onboarding-view";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "List your business",
  description: "Create a free, useful local business profile on BNC.",
};

export default async function AddBusinessPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const [{ plan = "bronze" }] = await Promise.all([
    searchParams,
    requireBncSession("/business/add", "customer"),
  ]);
  return <AppShell><BusinessOnboardingView mode="add" requestedPlan={plan} /></AppShell>;
}
