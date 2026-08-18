import { MerchantListingsManager } from "@/components/merchant-listings-manager";
import { requireBncSession } from "@/lib/server-auth";
export default async function MerchantListingsPage() { const user = await requireBncSession("/merchant/listings", "business"); return <MerchantListingsManager user={user} />; }
