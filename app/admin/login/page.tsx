import type { Metadata } from "next";
import { LoginView } from "@/components/login-view";
import { getBncSession } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await getBncSession();
  return (
    <LoginView
      initialPortal="admin"
      lockedPortal
      signedIn={Boolean(user?.capabilities.admin)}
      returnTo="/admin/dashboard"
    />
  );
}
