import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { NotificationsView } from "@/components/notifications-view";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <AppShell><NotificationsView /></AppShell>;
}
