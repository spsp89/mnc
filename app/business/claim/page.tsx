import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { BusinessOnboardingView } from "@/components/business-onboarding-view";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Claim a business listing",
  description: "Verify your connection to a BNC business listing and manage its profile.",
};

export default async function ClaimBusinessPage() {
  await requireBncSession("/business/claim", "customer");
  return <AppShell><BusinessOnboardingView mode="claim" /></AppShell>;
}
