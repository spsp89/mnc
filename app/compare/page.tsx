import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CompareView } from "@/components/compare-view";

export const metadata: Metadata = { title: "Compare businesses" };

export default function ComparePage() {
  return <AppShell><CompareView /></AppShell>;
}
