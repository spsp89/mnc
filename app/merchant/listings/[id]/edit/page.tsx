import { MerchantProfileManager } from "@/components/merchant-profile-manager";
import { requireBncSession } from "@/lib/server-auth";
export default async function EditMerchantListingPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const user = await requireBncSession(`/merchant/listings/${id}/edit`, "business"); return <MerchantProfileManager user={user} initialBusinessId={id} />; }
