import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { OrdersView } from "@/components/orders-view";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "My marketplace orders", robots: { index: false, follow: false } };

export default async function OrdersPage() {
  await requireBncSession("/orders", "customer");
  return <AppShell><OrdersView /></AppShell>;
}
