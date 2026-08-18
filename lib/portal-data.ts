import "server-only";

import { cookies } from "next/headers";
import type { BncSessionUser } from "@/lib/auth-types";
import type { Business, Product } from "@/lib/types";
import { mapBusiness, mapProduct } from "@/lib/public-api";
import {
  accessCookieName,
  apiRequest,
} from "@/lib/session-config";

type ApiRecord = Record<string, unknown>;

const record = (value: unknown): ApiRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as ApiRecord)
    : {};
const records = (value: unknown): ApiRecord[] =>
  Array.isArray(value) ? value.map(record) : [];
const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const number = (value: unknown, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const dateTime = (value: unknown) => {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN");
};

async function authenticatedData(path: string): Promise<unknown> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessCookieName)?.value;
  if (!accessToken) return null;
  const response = await apiRequest(path, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const body = record(await response.json());
  return body.data ?? null;
}

export type CustomerEnquiry = {
  id: string;
  requirement: string;
  status: string;
  urgency: string;
  location: string;
  businessName: string;
  createdAt: string;
};

export type CustomerHistoryItem = {
  id: string;
  query: string;
  location: string;
  time: string;
};

export type CustomerAddress = {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
};

export type CustomerBlockedBusiness = {
  id: string;
  name: string;
  reason: string;
};

export type CustomerReview = {
  id: string;
  body: string;
  rating: number;
  status: string;
  helpfulCount: number;
  createdAt: string;
};

export type CustomerPortalData = {
  savedBusinesses: Business[];
  savedProducts: Product[];
  recentBusinesses: Business[];
  enquiries: CustomerEnquiry[];
  recentBusinessCount: number;
  history: CustomerHistoryItem[];
  addresses: CustomerAddress[];
  blocked: CustomerBlockedBusiness[];
  reviews: CustomerReview[];
};

export async function getCustomerPortalData(): Promise<CustomerPortalData> {
  const [
    savedValue,
    savedProductsValue,
    enquiriesValue,
    recentValue,
    historyValue,
    addressesValue,
    blockedValue,
    exportValue,
  ] = await Promise.all([
    authenticatedData("/users/me/saved-businesses"),
    authenticatedData("/users/me/saved-products"),
    authenticatedData("/enquiries/me"),
    authenticatedData("/users/me/recent-businesses"),
    authenticatedData("/users/me/search-history?limit=30"),
    authenticatedData("/users/me/addresses"),
    authenticatedData("/users/me/blocked-businesses"),
    authenticatedData("/users/me/export"),
  ]);
  const exported = record(exportValue);

  const savedBusinesses = records(savedValue).map((item, index) =>
    mapBusiness(record(item.business), index),
  );
  const savedProducts = records(savedProductsValue).map((item) =>
    mapProduct(record(item.product)),
  );
  const recentBusinesses = records(recentValue).map((item, index) =>
    mapBusiness(record(item.business), index),
  );
  const enquiries = records(enquiriesValue).map((item) => {
    const location = record(item.location);
    return {
      id: text(item.id),
      requirement: text(item.requirement, "Demo customer enquiry"),
      status: text(item.status, "SUBMITTED"),
      urgency: text(item.urgency, "normal"),
      location: [
        text(location.locality),
        text(location.city),
        text(location.district),
      ].filter(Boolean).join(", ") || "Kerala",
      businessName: text(record(item.business).name, "Matched businesses"),
      createdAt: text(item.createdAt),
    };
  });
  const history = records(historyValue).map((item) => {
    const location = record(item.location);
    return {
      id: text(item.id),
      query: text(item.query, "Local search"),
      location:
        text(location.locality, text(location.city, text(location.state, "Kerala"))),
      time: text(item.createdAt),
    };
  });
  const addresses = records(addressesValue).map((item) => ({
    id: text(item.id),
    label: text(item.label, "Saved address"),
    address: [
      text(item.addressLine1),
      text(item.addressLine2),
      text(item.locality),
      text(item.city),
      text(item.state),
      text(item.postalCode),
    ].filter(Boolean).join(", "),
    isDefault: item.isDefault === true,
  }));
  const blocked = records(blockedValue).map((item) => ({
    id: text(item.businessId),
    name: text(record(item.business).name, `Business ${text(item.businessId).slice(-6)}`),
    reason: text(item.reason, "Blocked by this customer"),
  }));
  const reviews = records(exported.reviews).map((item) => ({
    id: text(item.id),
    body: text(item.body, "Demo customer review"),
    rating: number(item.overallRating),
    status: text(item.status),
    helpfulCount: number(item.helpfulCount),
    createdAt: text(item.createdAt),
  }));

  return {
    savedBusinesses,
    savedProducts,
    recentBusinesses,
    enquiries,
    recentBusinessCount: recentBusinesses.length,
    history,
    addresses,
    blocked,
    reviews,
  };
}

export type PortalRow = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  detail: string;
};

function portalRows(value: unknown): PortalRow[] {
  const source = Array.isArray(value) ? records(value) : [record(value)].filter((item) => Object.keys(item).length);
  return source.map((item, index) => {
    const business = record(item.business);
    const lead = record(item.lead);
    const user = record(item.user);
    const profile = record(item.customerProfile);
    const location = records(item.locations)[0] ?? record(item.location);
    const title =
      text(item.name) ||
      text(item.title) ||
      text(item.subject) ||
      text(item.requirement) ||
      text(lead.requirement) ||
      text(item.action) ||
      text(profile.displayName) ||
      text(item.email) ||
      text(business.name) ||
      `Record ${index + 1}`;
    const status =
      text(item.status) ||
      text(item.type) ||
      (item.active === true ? "ACTIVE" : "");
    const subtitle = [
      text(business.name),
      text(user.email),
      text(item.email),
      text(location.locality),
      text(location.city),
      text(item.category),
    ].filter((part, partIndex, parts) => Boolean(part) && parts.indexOf(part) === partIndex).join(" · ");
    const detail =
      text(item.description) ||
      text(item.body) ||
      text(lead.productQuery) ||
      text(item.reason) ||
      text(item.role) ||
      text(item.channel) ||
      dateTime(item.createdAt);
    return {
      id: text(item.id, `${index}`),
      title,
      subtitle,
      status,
      detail,
    };
  });
}

function pickBusiness(user: BncSessionUser) {
  return user.businesses.find((business) => business.status === "ACTIVE") ??
    user.businesses[0] ??
    null;
}

export type BusinessDashboardData = {
  available: boolean;
  selectedBusinessName: string;
  totalListings: number;
  activeListings: number;
  activeOffers: number;
  leadsReceived: number;
  newLeads: number;
  currentSubscription: string;
  planExpiry: string;
  listingViews: number;
  contactClicks: number;
  whatsappClicks: number;
};

export async function getBusinessDashboardData(
  user: BncSessionUser,
): Promise<BusinessDashboardData> {
  const business = pickBusiness(user);
  if (!business) {
    return {
      available: true, selectedBusinessName: "",
      totalListings: 0, activeListings: 0, activeOffers: 0, leadsReceived: 0, newLeads: 0,
      currentSubscription: "No active plan", planExpiry: "", listingViews: 0, contactClicks: 0, whatsappClicks: 0,
    };
  }
  const businessId = encodeURIComponent(business.id);
  const dashboard = record(await authenticatedData(`/analytics/business/dashboard?businessId=${businessId}`));
  const available = Object.keys(dashboard).length > 0;
  const subscription = record(dashboard.subscription);
  const plan = record(subscription.plan);
  const metrics = record(dashboard.recordedMetrics);
  return {
    available, selectedBusinessName: business.name,
    totalListings: number(dashboard.totalListings),
    activeListings: number(dashboard.activeListings),
    activeOffers: number(dashboard.activeOffers),
    leadsReceived: number(dashboard.leadsReceived),
    newLeads: number(dashboard.newLeads),
    currentSubscription: text(plan.name, "No active plan"),
    planExpiry: text(subscription.currentPeriodEnd),
    listingViews: number(metrics.listingViews),
    contactClicks: number(metrics.contactClicks),
    whatsappClicks: number(metrics.whatsappClicks),
  };
}

export type BusinessSectionData = {
  workspaceName: string;
  rows: PortalRow[];
  available: boolean;
};

export async function getBusinessSectionData(
  user: BncSessionUser,
  section: string,
): Promise<BusinessSectionData> {
  const business = pickBusiness(user);
  if (!business) return { workspaceName: "", rows: [], available: true };
  const businessId = encodeURIComponent(business.id);
  const pathBySection: Record<string, string> = {
    leads: `/leads?businessId=${businessId}`,
    enquiries: `/enquiries/business?businessId=${businessId}`,
    services: `/businesses/manage/${businessId}`,
    reviews: `/reviews/business/${businessId}?page=1&pageSize=50`,
    offers: `/businesses/manage/${businessId}`,
    subscription: `/subscriptions/current?businessId=${businessId}`,
    analytics: `/analytics/business?businessId=${businessId}`,
    messages: "/conversations?page=1&pageSize=50",
    payments: `/orders/business?businessId=${businessId}`,
    notifications: "/notifications?page=1&pageSize=50",
    team: `/businesses/manage/${businessId}/team`,
    profile: `/businesses/manage/${businessId}`,
    settings: `/businesses/manage/${businessId}`,
  };
  const path = pathBySection[section];
  if (!path) return { workspaceName: business.name, rows: [], available: false };
  const value = await authenticatedData(path);
  const source = record(value);
  const listValue =
    section === "subscription"
      ? value
      : section === "services"
        ? source.services
        : section === "offers"
          ? source.offers
          : section === "analytics"
            ? Object.entries(source).map(([name, metric]) => ({
                id: name,
                name: name.replaceAll("_", " "),
                status: "MEASURED",
                description:
                  typeof metric === "object"
                    ? JSON.stringify(metric)
                    : String(metric),
              }))
            : section === "team"
              ? source.members
              : value;
  return {
    workspaceName: business.name,
    rows: portalRows(listValue),
    available: value !== null,
  };
}

export type AdminOverviewData = {
  users: number;
  businesses: number;
  pendingVerification: number;
  pendingReviews: number;
  openTickets: number;
  capturedPaymentValue: number;
};

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const data = record(await authenticatedData("/admin/overview"));
  return {
    users: number(data.users),
    businesses: number(data.businesses),
    pendingVerification: number(data.pendingVerification),
    pendingReviews: number(data.pendingReviews),
    openTickets: number(data.openTickets),
    capturedPaymentValue: number(data.capturedPaymentValue),
  };
}

export type AdminSectionData = {
  rows: PortalRow[];
  available: boolean;
  payload: ApiRecord | ApiRecord[] | null;
  parentCategories?: ApiRecord[];
};

export async function getAdminVerificationRequest(
  id: string,
): Promise<ApiRecord | null> {
  const value = await authenticatedData(`/verification/${encodeURIComponent(id)}`);
  const request = record(value);
  return Object.keys(request).length ? request : null;
}

export async function getAdminSectionData(
  section: string,
): Promise<AdminSectionData> {
  const pathBySection: Record<string, string> = {
    businesses: "/admin/businesses?page=1&pageSize=50",
    users: "/admin/users?page=1&pageSize=50",
    verification: "/verification/queue?page=1&pageSize=50",
    reviews: "/admin/reviews/moderation?page=1&pageSize=50",
    leads: "/admin/inventory/leads",
    enquiries: "/admin/inventory/enquiries",
    categories: "/admin/inventory/categories",
    subcategories: "/admin/inventory/subcategories",
    products: "/admin/products/moderation?page=1&pageSize=50",
    services: "/admin/inventory/services",
    plans: "/admin/inventory/plans",
    orders: "/admin/inventory/orders",
    offers: "/admin/inventory/offers",
    advertisements: "/admin/inventory/advertisements",
    locations: "/admin/inventory/locations",
    reports: "/admin/inventory/reports",
    support: "/admin/support?page=1",
    notifications: "/admin/inventory/notifications",
    translations: "/admin/inventory/translations",
    "search-analytics": "/analytics/platform",
    ranking: "/admin/ranking",
    content: "/admin/inventory/content",
    "audit-log": "/admin/audit-log?page=1",
    settings: "/admin/inventory/settings",
    system: "/health",
  };
  if (section === "payments" || section === "refunds") {
    const finance = record(await authenticatedData("/admin/finance"));
    const payload = records(section === "payments" ? finance.payments : finance.refunds);
    return {
      rows: portalRows(payload),
      available: true,
      payload,
    };
  }
  const path = pathBySection[section];
  if (!path) return { rows: [], available: false, payload: null };
  let value = await authenticatedData(path);
  if (value === null && section === "categories") {
    value = await authenticatedData("/categories");
  }
  if (value === null && section === "plans") {
    value = await authenticatedData("/subscriptions/plans");
  }
  let parentCategories: ApiRecord[] | undefined;
  if (section === "subcategories" && Array.isArray(value)) {
    const categoryTree = records(await authenticatedData("/categories"));
    parentCategories = categoryTree;
    const parentsByName = new Map(
      categoryTree.map((category) => [text(category.name), category]),
    );
    value = records(value).map((item) => {
      const currentParent = record(item.parent);
      if (text(currentParent.id)) return item;
      const parent = parentsByName.get(text(item.category));
      return parent
        ? { ...item, parentId: text(parent.id), parent: { id: text(parent.id), name: text(parent.name) } }
        : item;
    });
  }
  const payload = Array.isArray(value) ? records(value) : (() => {
    const item = record(value);
    return Object.keys(item).length ? item : null;
  })();
  return {
    rows: portalRows(value),
    available: value !== null,
    payload,
    parentCategories,
  };
}
