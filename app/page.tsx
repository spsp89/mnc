import { AppShell } from "@/components/app-shell";
import { BncHomepage } from "@/components/home/homepage";
import { getHomePageData } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getHomePageData();
  return (
    <AppShell>
      <BncHomepage data={data} />
    </AppShell>
  );
}
