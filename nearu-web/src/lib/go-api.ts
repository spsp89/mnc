type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

export type GoCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  accentColor: string;
  isActive: boolean;
  sortOrder: number;
};

export type GoBusiness = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  logoUrl: string | null;
  thumbnailUrl: string | null;
  category: GoCategory;
  flags: {
    featured: boolean;
    popular: boolean;
    favorite: boolean;
  };
  rating: {
    average: number;
    count: number;
  };
  distanceKm: number;
  badge: {
    text: string;
    color: string;
  } | null;
  contact: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
  };
  address: {
    area: string;
    city: string;
    label: string;
    latitude: number | null;
    longitude: number | null;
  };
  images: Array<{
    url: string;
    alt: string;
    variant: string;
    isPrimary: boolean;
  }>;
  tags: string[];
};

export type GoDoctor = {
  id: string;
  slug: string;
  name: string;
  speciality: string;
  experience: string;
  rating: {
    average: number;
    count: number;
  };
  nextSlot: string;
  fee: string;
  imageUrl: string;
  services: string[];
};

export type GoClinic = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  phone: string | null;
  whatsapp: string | null;
  distanceKm: number;
  address: {
    area: string;
    city: string;
    label: string;
    latitude: number | null;
    longitude: number | null;
  };
  doctors: GoDoctor[];
};

export type GoDeal = {
  id: string;
  slug: string;
  title: string;
  description: string;
  code: string;
  imageUrl: string;
  accentColor: string;
  section: string;
  isFeatured: boolean;
  business?: GoBusiness;
};

export type GoAdminData = {
  categories: GoCategory[];
  businesses: GoBusiness[];
  clinics: GoClinic[];
  doctors: Array<GoDoctor & { clinicSlug: string; clinicName: string }>;
  deals: GoDeal[];
};

function apiBaseUrl() {
  return (
    process.env.GO_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080"
  ).replace(/\/$/, "");
}

function adminToken() {
  return process.env.GO_ADMIN_TOKEN ?? process.env.ADMIN_TOKEN ?? "change-me";
}

function apiUrl(path: string, params?: URLSearchParams) {
  const url = new URL(path, apiBaseUrl());
  params?.forEach((value, key) => url.searchParams.set(key, value));
  return url;
}

async function readApi<T>(path: string, params?: URLSearchParams): Promise<T> {
  const response = await fetch(apiUrl(path, params), { cache: "no-store" });
  const json = (await response.json().catch(() => ({}))) as T & ApiErrorResponse;

  if (!response.ok) {
    throw new Error(json.error?.message ?? "Go API request failed.");
  }

  return json;
}

async function writeApi<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${adminToken()}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await response.json().catch(() => ({}))) as T & ApiErrorResponse;

  if (!response.ok) {
    throw new Error(json.error?.message ?? "Go API write failed.");
  }

  return json;
}

export async function getGoCatalogData() {
  const params = new URLSearchParams({ limit: "100" });
  return readApi<{
    categories: GoCategory[];
    featured: GoBusiness[];
    popular: GoBusiness[];
    all: GoBusiness[];
  }>("/api/catalog", params);
}

export async function getGoClinics() {
  const data = await readApi<{ clinics: GoClinic[] }>("/api/clinics");
  return data.clinics;
}

export async function getGoDeals() {
  const data = await readApi<{ deals: GoDeal[] }>("/api/deals");
  return data.deals;
}

export async function getGoAdminData(): Promise<GoAdminData> {
  const [catalog, clinics, deals] = await Promise.all([
    getGoCatalogData(),
    getGoClinics(),
    getGoDeals(),
  ]);

  return {
    categories: catalog.categories,
    businesses: catalog.all,
    clinics,
    doctors: clinics.flatMap((clinic) =>
      clinic.doctors.map((doctor) => ({
        ...doctor,
        clinicSlug: clinic.slug,
        clinicName: clinic.name,
      })),
    ),
    deals,
  };
}

export async function getGoLegacyAdminData() {
  const data = await getGoAdminData();
  const categoryCounts = new Map<string, number>();

  for (const business of data.businesses) {
    categoryCounts.set(
      business.category.slug,
      (categoryCounts.get(business.category.slug) ?? 0) + 1,
    );
  }

  const businesses = data.businesses.map((business) => ({
    id: business.slug,
    slug: business.slug,
    name: business.name,
    subtitle: business.shortDescription,
    description: business.shortDescription,
    location: {
      area: business.address.area,
      city: business.address.city,
      addressLine: business.address.label,
      landmark: "",
      latitude: business.address.latitude,
      longitude: business.address.longitude,
      distanceKm: business.distanceKm,
    },
    contact: business.contact,
    category: {
      id: business.category.slug,
      slug: business.category.slug,
      name: business.category.name,
    },
    rating: {
      score: business.rating.average,
      reviews: business.rating.count,
      reviewCount: business.rating.count,
    },
    distance: business.distanceKm,
    badge: business.badge ?? {
      text: null,
      color: null,
    },
    images: businessImagesForLegacy(business),
    gallery: business.images.map((image) => image.url),
    logo: business.logoUrl,
    payment: {
      upiId: "",
    },
    upiId: "",
    hours: "",
    openingHours: "",
    tags: business.tags,
    flags: business.flags,
    trust: {
      verified: true,
    },
    analytics: {
      total: 0,
      calls: 0,
      whatsapps: 0,
      routes: 0,
      cardViews: 0,
      payments: 0,
    },
  }));

  const deals = data.deals.map((deal, index) => ({
    slug: deal.slug,
    title: deal.title,
    text: deal.description,
    shop: deal.business?.name ?? "",
    category: deal.business?.category.name ?? "Offers",
    badge: deal.code,
    badgeColor: deal.accentColor,
    image: deal.imageUrl,
    gradient: `linear-gradient(135deg,${deal.accentColor},#0b2f74)`,
    validUntil: "Limited time",
    businessSlug: deal.business?.slug ?? "",
    isActive: true,
    sortOrder: index + 1,
    items: [
      {
        name: deal.title,
        text: deal.description,
        image: deal.imageUrl,
        price: deal.code,
      },
    ],
  }));

  const offers = data.deals.map((deal, index) => ({
    slug: deal.slug,
    title: deal.title,
    text: deal.description,
    shop: deal.business?.name ?? "",
    category: deal.business?.category.name ?? "Offers",
    code: deal.code,
    image: deal.imageUrl,
    gradient: `linear-gradient(135deg,${deal.accentColor},#0b2f74)`,
    validUntil: "Limited time",
    businessSlug: deal.business?.slug ?? "",
    isActive: true,
    sortOrder: index + 1,
    items: [
      {
        name: deal.title,
        text: deal.description,
        image: deal.imageUrl,
        label: deal.code,
      },
    ],
  }));

  return {
    categories: data.categories.map((category) => ({
      ...category,
      id: category.slug,
      accent: category.accentColor,
      _count: {
        businesses: categoryCounts.get(category.slug) ?? 0,
      },
    })),
    businesses,
    deals,
    offers,
    reviews: [] as Array<{
      id: string;
      status: "pending" | "approved" | "rejected";
      featured: boolean;
      rating: number;
      text: string;
      createdAt: string;
      customer: {
        name: string;
        email: string;
        phone: string;
      };
      business: {
        name: string;
        slug: string;
      };
    }>,
    analytics: {
      total: 0,
      byType: {
        call_click: 0,
        whatsapp_click: 0,
        route_click: 0,
        business_card_view: 0,
        upi_click: 0,
        payment_click: 0,
      },
      topBusinesses: [] as Array<{
        id: string;
        name: string;
        slug: string;
        total: number;
        calls: number;
        whatsapps: number;
        routes: number;
        cardViews: number;
        payments: number;
      }>,
      recentEvents: [] as Array<{
        id: string;
        eventType: string;
        source: string;
        createdAt: string;
        business: {
          id: string;
          name: string;
          slug: string;
        };
      }>,
    },
  };
}

function businessImagesForLegacy(business: GoBusiness) {
  const images = business.images.length
    ? business.images
    : [
        {
          url: business.thumbnailUrl ?? "/mockup/im-restaurant.jpg",
          alt: business.name,
          variant: "plate",
          isPrimary: true,
        },
      ];

  return images.map((image, index) => ({
    ...image,
    role: index === 0 ? "cover" : "gallery",
  }));
}

export function createGoCategory(input: unknown) {
  return writeApi("/api/admin/categories", "POST", input);
}

export function updateGoCategory(slug: string, input: unknown) {
  return writeApi(`/api/admin/categories/${encodeURIComponent(slug)}`, "PATCH", input);
}

export function deleteGoCategory(slug: string) {
  return writeApi(`/api/admin/categories/${encodeURIComponent(slug)}`, "DELETE");
}

export function createGoBusiness(input: unknown) {
  return writeApi("/api/admin/businesses", "POST", input);
}

export function updateGoBusiness(slug: string, input: unknown) {
  return writeApi(`/api/admin/businesses/${encodeURIComponent(slug)}`, "PATCH", input);
}

export function deleteGoBusiness(slug: string) {
  return writeApi(`/api/admin/businesses/${encodeURIComponent(slug)}`, "DELETE");
}

export function createGoClinic(input: unknown) {
  return writeApi("/api/admin/clinics", "POST", input);
}

export function updateGoClinic(slug: string, input: unknown) {
  return writeApi(`/api/admin/clinics/${encodeURIComponent(slug)}`, "PATCH", input);
}

export function deleteGoClinic(slug: string) {
  return writeApi(`/api/admin/clinics/${encodeURIComponent(slug)}`, "DELETE");
}

export function createGoDoctor(input: unknown) {
  return writeApi("/api/admin/doctors", "POST", input);
}

export function updateGoDoctor(slug: string, input: unknown) {
  return writeApi(`/api/admin/doctors/${encodeURIComponent(slug)}`, "PATCH", input);
}

export function deleteGoDoctor(slug: string) {
  return writeApi(`/api/admin/doctors/${encodeURIComponent(slug)}`, "DELETE");
}

export function createGoDeal(input: unknown) {
  return writeApi("/api/admin/deals", "POST", input);
}

export function updateGoDeal(slug: string, input: unknown) {
  return writeApi(`/api/admin/deals/${encodeURIComponent(slug)}`, "PATCH", input);
}

export function deleteGoDeal(slug: string) {
  return writeApi(`/api/admin/deals/${encodeURIComponent(slug)}`, "DELETE");
}
