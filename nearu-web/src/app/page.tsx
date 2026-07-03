import { PublicHome } from "@/components/nearu/public-home";
import { getCatalogData } from "@/lib/catalog";

export default async function Home() {
  const data = await getCatalogData();

  return <PublicHome data={data} />;
}
