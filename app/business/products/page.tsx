import { BusinessProductsManager } from "@/components/business-products-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessProductsPage() {
  const user = await requireBncSession("/business/products", "business");
  return <BusinessProductsManager user={user} />;
}
