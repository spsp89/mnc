import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { OrderDetailView } from "@/components/order-detail-view";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Track order", robots: { index: false, follow: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireBncSession(`/orders/${id}`, "customer");
  return <AppShell><OrderDetailView id={id} /></AppShell>;
}
