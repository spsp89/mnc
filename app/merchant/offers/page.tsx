import { BusinessOffersManager } from "@/components/business-offers-manager";
import { requireBncSession } from "@/lib/server-auth";
export default async function MerchantOffersPage() { const user = await requireBncSession("/merchant/offers", "business"); return <BusinessOffersManager user={user}/>; }
