import "server-only";

import { homeCategories, homeServices } from "@/lib/home-data";
import { hasHomeDelivery } from "@/lib/delivery-options";
import type {
  HomeBusiness,
  HomeCategory,
  HomeJob,
  HomeOffer,
  HomePageData,
  HomeProduct,
  HomeProfessional,
  HomeService,
  HomeWeeklyDraw,
} from "@/lib/home-types";
import type { Business, Category, Offer, Product, SearchFilters, Service } from "@/lib/types";

type ApiRecord = Record<string, unknown>;

const fallbackImage =
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80";

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
const optionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
const boolean = (value: unknown) => value === true;
const safeHttpUrl = (value: unknown) => {
  const candidate = text(value);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};
const oneDecimal = (value: number) => Math.round(value * 10) / 10;
const safePercentage = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));
const offerDiscountLabel = (type: string, value: number) =>
  type === "PERCENTAGE"
    ? `${safePercentage(value)}% off`
    : `₹${Math.max(0, Math.round(value)).toLocaleString("en-IN")} off`;
const apiBaseUrl = () =>
  (process.env.BNC_INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_BNC_API_URL ??
    "http://127.0.0.1:4000/api/v1"
  ).replace(/\/$/, "");

async function apiData(path: string): Promise<unknown> {
  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const body = record(await response.json());
    return body.data ?? null;
  } catch {
    return null;
  }
}

async function allApiRecords(path: string): Promise<ApiRecord[]> {
  const rows: ApiRecord[] = [];
  for (let page = 1; page <= 200; page += 1) {
    try {
      const separator = path.includes("?") ? "&" : "?";
      const response = await fetch(`${apiBaseUrl()}${path}${separator}page=${page}&pageSize=50`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) break;
      const body = record(await response.json());
      const pageRows = records(body.data);
      rows.push(...pageRows);
      const meta = record(body.meta);
      const total = number(meta.total, rows.length);
      if (pageRows.length < 50 || rows.length >= total) break;
    } catch {
      break;
    }
  }
  return rows;
}

export async function getPublicSitemapRecords() {
  const [businessRows, productRows, serviceRows] = await Promise.all([
    allApiRecords("/businesses"),
    allApiRecords("/products"),
    allApiRecords("/services"),
  ]);
  return {
    businesses: businessRows.map((item) => ({ slug: text(item.slug), updatedAt: text(item.updatedAt) })),
    products: productRows.map((item) => ({ id: text(item.id), updatedAt: text(item.updatedAt) })),
    services: serviceRows.map((item) => ({ id: text(item.id), updatedAt: text(item.updatedAt) })),
  };
}

function primaryLocation(source: ApiRecord) {
  const locations = records(source.locations);
  return locations.find((location) => location.isPrimary === true) ?? locations[0] ?? {};
}

function primaryCategory(source: ApiRecord) {
  const links = records(source.categories);
  const primary = links.find((link) => link.isPrimary === true) ?? links[0] ?? {};
  return record(primary.category ?? source.category);
}

function activeSubscription(source: ApiRecord) {
  return records(source.subscriptions).find((subscription) => {
    const periodEnd = text(subscription.currentPeriodEnd);
    return !periodEnd || new Date(periodEnd).getTime() >= Date.now();
  }) ?? {};
}

function bncStarLevel(source: ApiRecord): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const plan = record(activeSubscription(source).plan);
  const value = Math.round(number(source.bncStarLevel, number(plan.starLevel)));
  return Math.max(0, Math.min(6, value)) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

function publicPhone(source: ApiRecord) {
  return text(source.publicPhone, "+91 99000 01000");
}

function whatsappFromPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? `91${digits.slice(-10)}` : "919876543210";
}

function mapService(source: ApiRecord): Service {
  const pricingType = text(source.pricingType, "STARTING_AT");
  const unit = {
    FIXED: "fixed",
    STARTING_AT: "onwards",
    HOURLY: "per hour",
    DAILY: "per day",
    PER_UNIT: "per unit",
    QUOTE: "custom quote",
  }[pricingType] ?? "onwards";
  const duration = number(source.durationMinutes);
  return {
    id: text(source.id),
    name: text(source.name, "Demo service"),
    startingPrice: number(source.startingPrice),
    pricingUnit: unit,
    duration: duration > 0 ? `${duration} minutes` : undefined,
    homeService: boolean(source.homeService),
  };
}

export function mapProduct(source: ApiRecord, fallbackBusiness?: ApiRecord): Product {
  const business = record(source.business ?? fallbackBusiness);
  const category = record(source.category);
  const location = primaryLocation(business);
  const media = records(source.media);
  const galleryImages = media
    .filter((item) => text(item.variant, "gallery") !== "thumbnail")
    .map((item) => text(item.publicUrl))
    .filter(Boolean);
  const allImages = media.map((item) => text(item.publicUrl)).filter(Boolean);
  const images = [...new Set(galleryImages.length ? galleryImages : allImages)];
  const measuredDistance = optionalNumber(source.distanceKm);
  const productStarLevel = Math.max(0, Math.min(6, Math.round(number(source.bncStarLevel))));
  const stockStatus = text(source.stockStatus, "IN_STOCK") as Product["stockStatus"];
  const homeDeliveryAvailable = hasHomeDelivery(source.deliveryOptions);
  return {
    id: text(source.id),
    businessId: text(source.businessId, text(business.id)),
    name: text(source.name, "Demo product"),
    category: text(category.name, "Local product"),
    categorySlug: text(category.slug) || undefined,
    price: number(source.price),
    discountPrice:
      source.discountPrice === null || source.discountPrice === undefined
        ? undefined
        : number(source.discountPrice),
    image: images[0] ?? text(business.coverImageUrl, fallbackImage),
    images: images.length ? images : undefined,
    description: text(source.description) || undefined,
    brand: text(source.brand) || undefined,
    minimumOrderQty: number(source.minimumOrderQty, 1),
    warranty: text(source.warranty) || undefined,
    returnInformation: text(source.returnInformation) || undefined,
    specifications: Object.fromEntries(
      Object.entries(record(source.specifications)).map(([key, value]) => [key, String(value)]),
    ),
    inStock: stockStatus !== "OUT_OF_STOCK",
    stockStatus,
    sellerName: text(business.name, "BNC demo seller"),
    sellerCity: text(location.city, "Kerala"),
    sellerPhone: publicPhone(business),
    sellerWhatsapp: whatsappFromPhone(publicPhone(business)),
    distanceKm: measuredDistance === undefined ? undefined : oneDecimal(measuredDistance),
    sponsored: boolean(source.sponsored),
    bncStarLevel: productStarLevel as Product["bncStarLevel"],
    planName: text(source.planName) || undefined,
    courierAvailable: boolean(source.courierAvailable),
    unitsSold: Math.max(0, Math.round(number(source.unitsSold))),
    homeDeliveryAvailable,
    checkout: true,
  };
}

export function mapBusiness(source: ApiRecord, index = 0): Business {
  const location = primaryLocation(source);
  const category = primaryCategory(source);
  const media = records(source.media);
  const products = records(source.products).map((item) => mapProduct(item, source));
  const services = records(source.services).map(mapService);
  const offers = records(source.offers);
  const reviews = records(source.reviews);
  const phone = publicPhone(source);
  const attributes = record(source.attributes);
  const socialLinks = record(source.socialLinks);
  const subscription = activeSubscription(source);
  const plan = record(subscription.plan);
  const measuredDistance = optionalNumber(source.distanceKm);
  const gallery = media
    .map((item) => text(item.publicUrl))
    .filter(Boolean);
  const coverImage = text(source.coverImageUrl, gallery[0] ?? fallbackImage);
  const priceRange = Math.max(1, Math.min(4, number(source.priceRange, 2)));
  const categoryName = text(category.name, text(source.categoryName, "Local business"));
  const categorySlug = text(category.slug, text(source.categorySlug, "local-business"));
  const locality = text(location.locality, text(source.locality, "Kerala"));
  const city = text(location.city, text(source.city, "Kochi"));
  const reviewCount = number(source.reviewCount);
  const rating = number(source.averageRating, number(source.rating, reviewCount ? 4 : 0));

  return {
    id: text(source.id),
    slug: text(source.slug),
    name: text(source.name, "BNC demo business"),
    category: categoryName,
    categoryId: text(category.id),
    categorySlug,
    subcategory: categoryName,
    description: text(source.description, text(source.shortDescription, "Fictional BNC demo listing.")),
    shortDescription: text(source.shortDescription, "Fictional BNC demo listing for production testing."),
    coverImage,
    gallery: gallery.length ? gallery : [coverImage],
    logoText: text(source.name, "BNC").split(/\s+/).slice(0, 2).map((part) => part[0]).join(""),
    city,
    district: text(location.district, city),
    locality,
    state: text(location.state, "Kerala"),
    address: [
      text(location.addressLine1),
      text(location.addressLine2),
      locality,
      city,
      text(location.postalCode),
    ].filter(Boolean).join(", "),
    latitude: number(location.latitude, number(source.latitude, 9.9681)),
    longitude: number(location.longitude, number(source.longitude, 76.2999)),
    distanceKm: measuredDistance === undefined ? undefined : oneDecimal(measuredDistance),
    rating,
    reviewCount,
    verified: boolean(source.verified),
    premium: boolean(source.premium),
    sponsored: boolean(source.sponsored),
    bncStarLevel: bncStarLevel(source),
    planName: text(source.planName, text(plan.name)) || undefined,
    status: "open",
    closesAt: "7:30 PM",
    responseTime: number(source.medianResponseMinutes, 15) <= 15 ? "Within 15 minutes" : `Within ${number(source.medianResponseMinutes)} minutes`,
    priceRange: "₹".repeat(priceRange),
    yearsInBusiness: number(source.yearsInBusiness, 2 + (index % 8)),
    phone,
    whatsapp: whatsappFromPhone(phone),
    websiteUrl: safeHttpUrl(source.websiteUrl),
    socialLinks: Object.fromEntries(
      Object.entries(socialLinks)
        .map(([key, value]) => [key, safeHttpUrl(value)])
        .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    ),
    paymentProfile: text(attributes.upiId)
      ? {
          upiId: text(attributes.upiId),
          accountName: text(attributes.paymentAccountName) || undefined,
        }
      : undefined,
    permanentDiscountPercent: optionalNumber(source.permanentDiscountPercent),
    permanentDiscountLabel: text(source.permanentDiscountLabel) || undefined,
    languages: Array.isArray(attributes.languages)
      ? attributes.languages.map(String)
      : ["English", "Malayalam"],
    paymentMethods: ["UPI", "Cards", "Cash"],
    amenities: boolean(attributes.accessibility)
      ? ["Accessible entrance", "Local delivery"]
      : ["Local delivery"],
    tags: [categoryName, locality, boolean(source.verified) ? "Verified" : "Demo listing"],
    services,
    products,
    offer: offers[0]
      ? {
          id: text(offers[0].id),
          title: text(offers[0].title),
          description: text(offers[0].description),
          code: text(offers[0].couponCode) || undefined,
          discount: offerDiscountLabel(
            text(offers[0].type),
            number(offers[0].discountValue),
          ),
          expiresAt: text(offers[0].endsAt),
        }
      : undefined,
    reviews: reviews.map((review, reviewIndex) => ({
      id: text(review.id),
      author: `Demo customer ${reviewIndex + 1}`,
      rating: number(review.overallRating, 4),
      date: text(review.createdAt),
      body: text(review.body),
      verified: boolean(review.verifiedInteraction),
      helpful: number(review.helpfulCount),
    })),
    joinedPlanAt: text(source.joinedPlanAt, text(subscription.startsAt, text(source.publishedAt))),
  };
}

export async function getPublicBusinesses(params: {
  category?: string;
  city?: string;
  verified?: boolean;
  pageSize?: number;
} = {}) {
  const query = new URLSearchParams({
    page: "1",
    pageSize: String(params.pageSize ?? 50),
  });
  if (params.category) query.set("category", params.category);
  if (params.city) query.set("city", params.city);
  if (params.verified !== undefined) query.set("verified", String(params.verified));
  return records(await apiData(`/businesses?${query}`)).map(mapBusiness);
}

export async function searchPublicBusinesses(filters: SearchFilters = {}) {
  const query = new URLSearchParams({ page: "1", pageSize: "50" });
  if (filters.query) query.set("query", filters.query);
  if (filters.location) query.set("location", filters.location);
  if (filters.constituency) query.set("constituency", filters.constituency);
  if (filters.district) query.set("district", filters.district);
  if (filters.state) query.set("state", filters.state);
  if (filters.latitude !== undefined) query.set("latitude", String(filters.latitude));
  if (filters.longitude !== undefined) query.set("longitude", String(filters.longitude));
  query.set("radiusKm", String(filters.radius ?? 5));
  if (filters.rating) query.set("rating", String(filters.rating));
  if (filters.openNow) query.set("openNow", "true");
  if (filters.verified) query.set("verified", "true");
  if (filters.premium) query.set("premium", "true");
  if (filters.offers) query.set("offers", "true");
  if (filters.homeService) query.set("homeService", "true");
  if (filters.delivery) query.set("delivery", "true");
  if (filters.fastResponse) query.set("fastResponse", "true");
  if (filters.price) query.set("priceRange", String(filters.price.length));
  if (filters.payment) query.set("payment", filters.payment);
  if (filters.language) query.set("language", filters.language);
  if (filters.minYears) query.set("minYears", String(filters.minYears));
  if (
    filters.sort &&
    [
      "recommended",
      "nearest",
      "rating",
      "reviews",
      "recent",
      "price-low",
      "price-high",
    ].includes(filters.sort)
  ) {
    query.set("sort", filters.sort);
  }
  return records(await apiData(`/search/businesses?${query}`)).map(mapBusiness);
}

export async function getPublicBusiness(slug: string) {
  const data = await apiData(`/businesses/${encodeURIComponent(slug)}`);
  const source = record(data);
  return text(source.id) ? mapBusiness(source) : null;
}

export async function getPublicProducts(filters: SearchFilters & { pageSize?: number } = {}) {
  const query = new URLSearchParams({
    page: "1",
    pageSize: String(filters.pageSize ?? 50),
    radiusKm: String(filters.radius ?? 5),
  });
  if (filters.query) query.set("q", filters.query);
  if (filters.location) query.set("city", filters.location);
  if (filters.constituency) query.set("constituency", filters.constituency);
  if (filters.district) query.set("district", filters.district);
  if (filters.state) query.set("state", filters.state);
  if (filters.category) query.set("category", filters.category);
  if (filters.productStatus) query.set("stock", filters.productStatus);
  if (filters.courier) query.set("courier", "true");
  if (filters.latitude !== undefined) query.set("latitude", String(filters.latitude));
  if (filters.longitude !== undefined) query.set("longitude", String(filters.longitude));
  if (
    filters.sort &&
    ["recommended", "best-selling", "nearest", "newest", "price-low", "price-high", "name", "category", "location", "status"].includes(filters.sort)
  ) {
    query.set("sort", filters.sort);
  }
  return records(await apiData(`/products?${query}`)).map((item) =>
    mapProduct(item),
  );
}

export async function getPublicProduct(id: string) {
  const source = record(await apiData(`/products/${encodeURIComponent(id)}`));
  return text(source.id) ? mapProduct(source) : null;
}

export type PublicServiceListing = {
  service: Service;
  business: Business;
  image: string;
  description: string;
};

function mapServiceListing(source: ApiRecord, index: number): PublicServiceListing {
  const provider = record(source.business);
  const location = primaryLocation(provider);
  const media = records(source.media);
  const providerSource: ApiRecord = {
    ...provider,
    bncStarLevel: source.bncStarLevel,
    planName: source.planName,
    distanceKm: source.distanceKm,
    joinedPlanAt: source.planStartedAt,
    shortDescription: text(source.description),
    coverImageUrl: text(media[0]?.publicUrl, fallbackImage),
    locations: [location],
    categories: [{ isPrimary: true, category: record(source.category) }],
  };
  return {
    service: mapService(source),
    business: mapBusiness(providerSource, index),
    image: text(media[0]?.publicUrl, fallbackImage),
    description: text(source.description),
  };
}

export async function getPublicServices(filters: SearchFilters & { pageSize?: number } = {}) {
  const query = new URLSearchParams({
    page: "1",
    pageSize: String(filters.pageSize ?? 50),
    radiusKm: String(filters.radius ?? 5),
  });
  if (filters.query) query.set("q", filters.query);
  if (filters.constituency) query.set("constituency", filters.constituency);
  if (filters.district) query.set("district", filters.district);
  if (filters.state) query.set("state", filters.state);
  if (filters.location) query.set("city", filters.location);
  if (filters.latitude !== undefined) query.set("latitude", String(filters.latitude));
  if (filters.longitude !== undefined) query.set("longitude", String(filters.longitude));
  if (filters.sort === "top-rated") query.set("sort", "top-rated");
  return records(await apiData(`/services?${query}`)).map(mapServiceListing);
}

export async function getPublicService(id: string) {
  const source = record(await apiData(`/services/${encodeURIComponent(id)}`));
  return text(source.id) ? mapServiceListing(source, 0) : null;
}

export type PublicOffer = Offer & {
  businessId: string;
  businessName: string;
  businessSlug: string;
  category: string;
  locality: string;
  city: string;
  whatsapp: string;
  image: string;
  discountValue: number;
  discountType: string;
  minimumSpend: number;
  featured: boolean;
};

export type PublicSubscriptionPlan = {
  id: string;
  slug: string;
  name: string;
  starLevel: number;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
};

export async function getPublicSubscriptionPlans(): Promise<PublicSubscriptionPlan[]> {
  return records(await apiData("/subscriptions/plans")).map((source) => ({
    id: text(source.id),
    slug: text(source.slug),
    name: text(source.name),
    starLevel: number(source.starLevel),
    monthlyPrice: number(source.monthlyPrice),
    annualPrice: number(source.annualPrice),
    features: Array.isArray(source.features) ? source.features.map(String) : [],
  }));
}

export type PublicJob = {
  id: string;
  title: string;
  description: string;
  employmentType: string;
  workplaceType: string;
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  city: string;
  district: string;
  state: string;
  applicationUrl?: string;
  contactEmail?: string;
  closesAt?: string;
  publishedAt?: string;
  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    coverImageUrl?: string;
    verified: boolean;
  };
};

function mapJob(source: ApiRecord): PublicJob {
  const business = record(source.business);
  return {
    id: text(source.id),
    title: text(source.title, "Local opportunity"),
    description: text(source.description),
    employmentType: text(source.employmentType, "FULL_TIME"),
    workplaceType: text(source.workplaceType, "ON_SITE"),
    skills: Array.isArray(source.skills) ? source.skills.map(String) : [],
    salaryMin: optionalNumber(source.salaryMin),
    salaryMax: optionalNumber(source.salaryMax),
    city: text(source.city, "Kerala"),
    district: text(source.district, text(source.city, "Kerala")),
    state: text(source.state, "Kerala"),
    applicationUrl: safeHttpUrl(source.applicationUrl),
    contactEmail: text(source.contactEmail) || undefined,
    closesAt: text(source.closesAt) || undefined,
    publishedAt: text(source.publishedAt) || undefined,
    business: {
      id: text(business.id),
      name: text(business.name, "BNC business"),
      slug: text(business.slug),
      logoUrl: text(business.logoUrl) || undefined,
      coverImageUrl: text(business.coverImageUrl) || undefined,
      verified: boolean(business.verified),
    },
  };
}

export async function getPublicJobs(params: {
  q?: string;
  city?: string;
  employmentType?: string;
  pageSize?: number;
} = {}): Promise<PublicJob[]> {
  const query = new URLSearchParams({
    page: "1",
    pageSize: String(params.pageSize ?? 50),
  });
  if (params.q) query.set("q", params.q);
  if (params.city) query.set("city", params.city);
  if (params.employmentType) query.set("employmentType", params.employmentType);
  return records(await apiData(`/jobs?${query}`)).map(mapJob);
}

export async function getPublicJob(id: string): Promise<PublicJob | null> {
  const source = record(await apiData(`/jobs/${encodeURIComponent(id)}`));
  return text(source.id) ? mapJob(source) : null;
}

export async function getPublicWeeklyDraws(): Promise<HomeWeeklyDraw[]> {
  return records(await apiData("/weekly-draws")).map((source) => {
    const winner = record(source.winner);
    const audit = record(source.audit);
    return {
      id: text(source.id),
      title: text(source.title, "BNC weekly draw"),
      prizeDescription: text(source.prizeDescription),
      weekStartsAt: text(source.weekStartsAt),
      weekEndsAt: text(source.weekEndsAt),
      status: text(source.status) === "PUBLISHED" ? "PUBLISHED" : "OPEN",
      winner: text(winner.name)
        ? {
            name: text(winner.name),
            city: text(winner.city, "Kerala"),
            orderNumber: text(winner.orderNumber) || undefined,
          }
        : undefined,
      audit: text(audit.selectionHash)
        ? {
            algorithm: text(audit.algorithm) || undefined,
            candidateHash: text(audit.candidateHash) || undefined,
            selectionSeed: text(audit.selectionSeed) || undefined,
            selectionHash: text(audit.selectionHash) || undefined,
            selectionIndex: Number.isFinite(Number(audit.selectionIndex)) ? Number(audit.selectionIndex) : undefined,
            candidateCount: Number.isFinite(Number(audit.candidateCount)) ? Number(audit.candidateCount) : undefined,
            usageEventCount: Number.isFinite(Number(audit.usageEventCount)) ? Number(audit.usageEventCount) : undefined,
          }
        : undefined,
    };
  });
}

export async function getPublicOffers(pageSize = 50): Promise<PublicOffer[]> {
  return records(await apiData(`/offers?page=1&pageSize=${pageSize}`)).map((source, index) => {
    const business = record(source.business);
    const location = primaryLocation(business);
    const type = text(source.type);
    const discountValue = number(source.discountValue);
    return {
      id: text(source.id),
      title: text(source.title),
      description: text(source.description),
      code: text(source.couponCode) || undefined,
      discount: offerDiscountLabel(type, discountValue),
      expiresAt: text(source.endsAt),
      businessId: text(source.businessId),
      businessName: text(business.name, "BNC demo business"),
      businessSlug: text(business.slug),
      category: records(source.products)[0]
        ? "Featured product"
        : records(source.services)[0]
          ? "Local service"
          : "Local offer",
      locality: text(location.locality, "Kerala"),
      city: text(location.city, "Kerala"),
      whatsapp: whatsappFromPhone(`+91 99000 ${String(1000 + index).padStart(5, "0")}`),
      image: fallbackImage,
      discountValue,
      discountType: type,
      minimumSpend: number(source.minimumSpend, 1_000),
      featured: boolean(source.isFeatured),
    };
  });
}

export async function getPublicCategories(): Promise<Array<Category & { businessCount: number; productCount: number }>> {
  return records(await apiData("/categories")).map((source) => ({
    id: text(source.id),
    name: text(source.displayName, text(source.name)),
    slug: text(source.slug),
    icon: text(source.icon, "Store"),
    description: text(source.description),
    accent: "#eef5ff",
    businessCount: number(record(source._count).businessLinks),
    productCount: number(record(source._count).products),
  }));
}

export async function getHomePageData(): Promise<HomePageData> {
  const [businesses, products, bestSellerProducts, serviceListings, topServiceListings, offers, categories, jobs, weeklyDraws] = await Promise.all([
    getPublicBusinesses(),
    getPublicProducts(),
    getPublicProducts({ courier: true, sort: "best-selling", pageSize: 12 }),
    getPublicServices(),
    getPublicServices({ sort: "top-rated", pageSize: 10 }),
    getPublicOffers(),
    getPublicCategories(),
    getPublicJobs({ pageSize: 12 }),
    getPublicWeeklyDraws(),
  ]);
  const businessById = new Map(businesses.map((business) => [business.id, business]));
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const mappedCategories: HomeCategory[] = homeCategories.map((category) => {
    const matchingSlug = {
      clinics: "doctors-clinics",
      hotels: "hotels-stays",
      bakery: "bakery-sweets",
      home: "home-services",
      auto: "automobile",
      photo: "event-services",
      beauty: "beauty-wellness",
    }[category.id] ?? category.id;
    const liveCategory = categoryBySlug.get(matchingSlug);
    return {
      ...category,
      catalogueSlug: matchingSlug,
      businessCount: liveCategory?.businessCount ?? 0,
      productCount: liveCategory?.productCount ?? 0,
    };
  });
  const mappedBusinesses: HomeBusiness[] = businesses.map((business) => {
    const offer = offers.find((candidate) => candidate.businessId === business.id);
    return {
      business,
      starLevel: business.bncStarLevel,
      discount: offer?.discount,
      featured: business.premium || business.sponsored,
    };
  });
  const mappedProducts: HomeProduct[] = products.slice(0, 12).map((product) => ({
    ...product,
    shopName: product.sellerName ?? "BNC demo seller",
    distanceKm: product.distanceKm,
  }));
  const bestSellers: HomeProduct[] = bestSellerProducts.map((product) => ({
    ...product,
    shopName: product.sellerName ?? "BNC seller",
    distanceKm: product.distanceKm,
  }));
  const topServices = topServiceListings.map((listing) => ({
    id: listing.service.id,
    name: listing.service.name,
    businessName: listing.business.name,
    businessSlug: listing.business.slug,
    category: listing.business.category,
    image: listing.image,
    city: listing.business.city,
    rating: listing.business.rating,
    reviewCount: listing.business.reviewCount,
    verified: listing.business.verified,
    startingPrice: listing.service.startingPrice,
    pricingUnit: listing.service.pricingUnit,
    planName: listing.business.planName,
  }));
  const mappedOffers: HomeOffer[] = offers.slice(0, 12).map((offer, index) => {
    const business = businessById.get(offer.businessId);
    const originalPrice = Math.max(offer.minimumSpend, 500);
    const percentageDiscount = safePercentage(offer.discountValue);
    const offerPrice =
      offer.discountType === "PERCENTAGE"
        ? Math.max(0, Math.round(originalPrice * (1 - percentageDiscount / 100)))
        : Math.max(0, originalPrice - offer.discountValue);
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(offer.expiresAt).getTime() - Date.now()) / 86_400_000),
    );
    return {
      id: offer.id,
      title: offer.title,
      businessName: offer.businessName,
      category: business?.category ?? offer.category,
      image: business?.coverImage ?? offer.image,
      originalPrice,
      offerPrice,
      discountPercentage:
        offer.discountType === "PERCENTAGE"
          ? percentageDiscount
          : safePercentage((offer.discountValue / originalPrice) * 100),
      distanceKm: business?.distanceKm,
      expiryLabel: daysLeft <= 2 ? "Ending soon" : `${daysLeft} days left`,
      tab: offer.featured ? "Exclusive" : daysLeft <= 7 ? "Ending Soon" : index % 2 ? "Popular" : "Nearby",
    };
  });
  const professionals: HomeProfessional[] = serviceListings.slice(0, 10).map((listing, index) => ({
    id: listing.service.id,
    name: listing.service.name,
    businessName: listing.business.name,
    specialisation: listing.business.category,
    image: listing.image,
    nextAvailable: index % 2 === 0 ? "Today, 3:00 PM" : "Tomorrow, 10:30 AM",
    price: listing.service.startingPrice,
    distanceKm: listing.business.distanceKm,
  }));
  const mappedServices: HomeService[] = homeServices.map((service) => {
    const keywords: Record<string, string[]> = {
      Doctors: ["doctor", "clinic", "dental", "diagnostic", "health"],
      "Beauty parlours": ["beauty", "wellness", "salon", "hair", "makeup", "spa"],
      Consultants: ["consult", "professional", "legal", "tax", "strategy"],
      "Service centres": ["repair", "service", "maintenance", "mechanic", "installation"],
      "Property experts": ["property", "real estate", "rental"],
      "Hotels & stays": ["hotel", "stay", "room", "hospitality"],
      "Home cleaning": ["cleaning", "home care", "plumbing", "electrical", "pest"],
      "Tutors & classes": ["tutor", "class", "course", "training", "education"],
    };
    const matchingKeywords = keywords[service.name] ?? [
      service.name.split(" ")[0].toLowerCase(),
    ];
    return {
      ...service,
      availableProviders: serviceListings.filter((listing) => {
        const searchable =
          `${listing.service.name} ${listing.business.category}`.toLowerCase();
        return matchingKeywords.some((keyword) => searchable.includes(keyword));
      }).length,
    };
  });
  const mappedJobs: HomeJob[] = jobs.map((job) => {
    const salary = job.salaryMin !== undefined || job.salaryMax !== undefined
      ? [
          job.salaryMin !== undefined ? `₹${Math.round(job.salaryMin).toLocaleString("en-IN")}` : null,
          job.salaryMax !== undefined ? `₹${Math.round(job.salaryMax).toLocaleString("en-IN")}` : null,
        ].filter(Boolean).join(" – ")
      : "Salary disclosed on application";
    const publishedAt = job.publishedAt ? new Date(job.publishedAt) : null;
    const daysAgo = publishedAt
      ? Math.max(0, Math.floor((Date.now() - publishedAt.getTime()) / 86_400_000))
      : 0;
    return {
      id: job.id,
      title: job.title,
      companyName: job.business.name,
      companyInitials: job.business.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
      location: `${job.city} · ${job.workplaceType.replaceAll("_", " ").toLowerCase()}`,
      salary,
      employmentType: job.employmentType.replaceAll("_", " ").toLowerCase(),
      posted: daysAgo === 0 ? "Today" : `${daysAgo}d ago`,
      skills: job.skills.slice(0, 4),
    };
  });

  return {
    businesses: mappedBusinesses,
    offers: mappedOffers,
    products: mappedProducts,
    bestSellers,
    topServices,
    professionals,
    jobs: mappedJobs,
    weeklyDraws,
    categories: mappedCategories,
    services: mappedServices,
  };
}
