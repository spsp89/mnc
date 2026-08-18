import { BusinessManagerView, type BusinessManagerSection } from "@/components/business-manager-view";
import { getBusinessSectionData } from "@/lib/portal-data";
import { requireBncSession } from "@/lib/server-auth";

export async function ProtectedBusinessManagerPage({
  section,
}: {
  section: BusinessManagerSection;
}) {
  const path = section === "profile"
    ? "/business/profile/edit"
    : `/business/${section}`;
  const user = await requireBncSession(path, "business");
  const data = await getBusinessSectionData(user, section);
  return <BusinessManagerView section={section} user={user} data={data} />;
}
