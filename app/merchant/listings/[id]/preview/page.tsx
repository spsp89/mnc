import { MerchantListingPreview } from "@/components/merchant-listing-preview";
import { requireBncSession } from "@/lib/server-auth";
export default async function PreviewMerchantListingPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const user = await requireBncSession(`/merchant/listings/${id}/preview`, "business"); return <MerchantListingPreview user={user} id={id} />; }
