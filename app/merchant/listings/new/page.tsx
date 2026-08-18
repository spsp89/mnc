import { DashboardShell } from "@/components/dashboard-shell";
import { BusinessOnboardingView } from "@/components/business-onboarding-view";
import { requireBncSession } from "@/lib/server-auth";
export default async function NewMerchantListingPage() { const user = await requireBncSession("/merchant/listings/new", "business"); return <DashboardShell mode="business" user={user}><BusinessOnboardingView mode="add" requestedPlan="bronze" /></DashboardShell>; }
