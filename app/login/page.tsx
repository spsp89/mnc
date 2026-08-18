import type { Metadata } from "next";
import { LoginView } from "@/components/login-view";
import { getBncSession } from "@/lib/server-auth";
import type { PortalKind } from "@/lib/auth-types";

export const metadata: Metadata = {
  title: "Login or create an account",
  description: "Sign in to save businesses, track enquiries, manage reviews and control your privacy.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string; returnTo?: string }>;
}) {
  const [{ portal, returnTo }, user] = await Promise.all([
    searchParams,
    getBncSession(),
  ]);
  const initialPortal: PortalKind = ["customer", "business", "admin"].includes(portal ?? "")
    ? portal as PortalKind
    : "customer";
  return (
    <LoginView
      initialPortal={initialPortal}
      lockedPortal={initialPortal === "admin"}
      signedIn={Boolean(user)}
      returnTo={returnTo}
    />
  );
}
