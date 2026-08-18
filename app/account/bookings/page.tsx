import { AccountBookingsView } from "@/components/account-bookings-view";
import { requireBncSession } from "@/lib/server-auth";

export default async function AccountBookingsPage() {
  await requireBncSession("/account/bookings", "customer");
  return <AccountBookingsView />;
}
