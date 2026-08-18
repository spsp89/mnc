import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "Your cart", robots: { index: false, follow: false } };

export default async function CartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const product = Array.isArray(params.add) ? params.add[0] : params.add;
  return <AppShell><CartView initialProductId={product} /></AppShell>;
}
