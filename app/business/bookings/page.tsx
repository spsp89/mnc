import { BusinessBookingsManager } from "@/components/business-bookings-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessBookingsPage() {
  const user = await requireBncSession("/business/bookings", "business");
  return <BusinessBookingsManager user={user} />;
}
