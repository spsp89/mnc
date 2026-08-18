export type PortalKind = "customer" | "business" | "admin";

export type BusinessWorkspace = {
  id: string;
  name: string;
  slug: string;
  status: string;
  accessRole: string;
  capabilities: string[];
};

export type BncSessionUser = {
  id: string;
  phone: string | null;
  email: string | null;
  role: string;
  roles: string[];
  preferredLanguage: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    defaultCity: string | null;
  } | null;
  capabilities: {
    customer: boolean;
    business: boolean;
    admin: boolean;
  };
  businesses: BusinessWorkspace[];
};

export function displayNameFor(user: BncSessionUser): string {
  return user.profile?.displayName || user.email || user.phone || "BNC member";
}
