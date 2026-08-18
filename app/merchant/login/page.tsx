import type { Metadata } from "next";
import { LoginView } from "@/components/login-view";
import { getBncSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Merchant sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MerchantLoginPage() {
  const user = await getBncSession();
  return <LoginView initialPortal="business" lockedPortal signedIn={Boolean(user?.capabilities.business)} returnTo="/merchant/dashboard" />;
}
