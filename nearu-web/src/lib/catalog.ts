import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { spotlightDeals, type SpotlightDealData } from "./deals";
import { topOffers, type TopOfferData } from "./offers";

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  accent: string;
  is_active: number;
  sort_order: number;
};

type DealRow = {
  id: number;
  slug: string;
  title: string;
  text: string;
  shop: string;
  category: string;
  badge: string;
  badge_color: string;
  image: string;
  gradient: string;
  valid_until: string;
  business_slug: string | null;
  is_active: number;
  sort_order: number;
};

type DealItemRow = {
  id: number;
  deal_id: number;
  name: string;
  text: string;
  image: string;
  price: string | null;
  sort_order: number;
};

type OfferRow = {
  id: number;
  slug: string;
  title: string;
  text: string;
  shop: string;
  category: string;
  code: string;
  image: string;
  gradient: string;
  valid_until: string;
  business_slug: string | null;
  is_active: number;
  sort_order: number;
};

type OfferItemRow = {
  id: number;
  offer_id: number;
  name: string;
  text: string;
  image: string;
  label: string;
  sort_order: number;
};

type ReviewRow = {
  id: number;
  business_id: number;
  business_name: string;
  business_slug: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  rating: number;
  text: string;
  photos: string | null;
  status: string;
  is_featured: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
};

type AnalyticsEventRow = {
  id: number;
  business_id: number;
  business_name: string;
  business_slug: string;
  event_type: string;
  source: string;
  metadata: string | null;
  session_id: string | null;
  created_at: string;
};

type BusinessRow = {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  description: string | null;
  area: string;
  city: string;
  address_line: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  rating: number;
  review_count: number;
  distance_km: number;
  badge_text: string | null;
  badge_color: string | null;
  cover_variant: string;
  image_url: string | null;
  logo_url: string | null;
  upi_id: string | null;
  opening_hours: string | null;
  gallery_urls: string | null;
  is_verified: number;
  tags: string | null;
  is_featured: number;
  is_popular: number;
  is_favorite: number;
  category_id: number;
  category_name: string;
  category_slug: string;
};

export type CatalogSort = "default" | "rating" | "distance" | "name";

export type CatalogFilters = {
  query?: string;
  category?: string;
  featured?: boolean;
  popular?: boolean;
  limit?: number;
  sort?: CatalogSort;
};

export type CatalogCategoryData = ReturnType<typeof getCategoriesData>[number];
export type CatalogBusinessData = ReturnType<typeof businessFromRow>;
export type CatalogData = Awaited<ReturnType<typeof getCatalogData>>;
export type BusinessDetailData = Awaited<ReturnType<typeof getBusinessBySlug>>;
export type ReviewStatus = "pending" | "approved" | "rejected";
export type CatalogReviewData = ReturnType<typeof reviewFromRow>;
export type ReviewSummaryData = ReturnType<typeof getReviewSummaryForBusinessId>;
export const analyticsEventTypes = [
  "call_click",
  "whatsapp_click",
  "route_click",
  "business_card_view",
  "business_card_share_click",
  "upi_click",
  "payment_click",
] as const;
export type AnalyticsEventType = (typeof analyticsEventTypes)[number];
export type AnalyticsEventData = ReturnType<typeof analyticsEventFromRow>;

type SeedCategory = {
  name: string;
  slug: string;
  icon: string;
  accent: string;
  isActive: boolean;
  sortOrder: number;
};

type SeedBusiness = {
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  categorySlug: string;
  area: string;
  city: string;
  addressLine: string;
  landmark: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp: string;
  email: string | null;
  website: string | null;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  badgeText: string | null;
  badgeColor: string | null;
  coverVariant: string;
  imageUrl: string | null;
  logoUrl?: string | null;
  upiId: string | null;
  openingHours: string | null;
  galleryUrls: string[];
  isVerified: boolean;
  tags: string[];
  isFeatured: boolean;
  isPopular: boolean;
};

const seedCategories: SeedCategory[] = [
  {
    name: "Grocery",
    slug: "grocery",
    icon: "shopping-cart",
    accent: "#35B44A",
    isActive: false,
    sortOrder: 1,
  },
  {
    name: "Restaurants",
    slug: "restaurants",
    icon: "utensils-crossed",
    accent: "#FFB01E",
    isActive: false,
    sortOrder: 2,
  },
  {
    name: "Tailors",
    slug: "tailors",
    icon: "scissors",
    accent: "#0B285E",
    isActive: true,
    sortOrder: 3,
  },
  {
    name: "Beauty",
    slug: "beauty",
    icon: "sparkles",
    accent: "#FF7186",
    isActive: false,
    sortOrder: 4,
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "monitor-smartphone",
    accent: "#6A66FF",
    isActive: false,
    sortOrder: 5,
  },
  {
    name: "Home Services",
    slug: "home-services",
    icon: "house-plus",
    accent: "#4AB64B",
    isActive: false,
    sortOrder: 6,
  },
  {
    name: "Doctor Booking",
    slug: "doctor-booking",
    icon: "stethoscope",
    accent: "#1E9FB8",
    isActive: false,
    sortOrder: 7,
  },
  {
    name: "More",
    slug: "more",
    icon: "layout-grid",
    accent: "#7183A6",
    isActive: false,
    sortOrder: 8,
  },
];

const seedBusinesses: SeedBusiness[] = [
  {
    name: "Spice Garden",
    slug: "spice-garden",
    subtitle: "Family Restaurant",
    description: "Kerala meals, biryani and evening snacks with weekly dine-in offers.",
    categorySlug: "restaurants",
    area: "Beach Road",
    city: "Kozhikode",
    addressLine: "Beach Road, Calicut",
    landmark: "Near corporation office",
    latitude: 11.2588,
    longitude: 75.7804,
    phone: "+91 98765 43001",
    whatsapp: "+91 98765 43001",
    email: "hello@spicegarden.example",
    website: "https://spicegarden.example",
    rating: 4.6,
    reviewCount: 126,
    distanceKm: 1.2,
    badgeText: "20% OFF",
    badgeColor: "#2961F0",
    coverVariant: "plate",
    imageUrl: null,
    upiId: "spicegarden@upi",
    openingHours: "Mon - Sun, 11:00 AM - 10:30 PM",
    galleryUrls: ["/mockup/im-rest-kerala-meals.jpg", "/mockup/im-rest-biryani.jpg", "/mockup/im-rest-snacks.jpg"],
    isVerified: true,
    tags: ["restaurant", "biryani", "offers", "family"],
    isFeatured: true,
    isPopular: true,
  },
  {
    name: "Royale Tailors",
    slug: "royale-tailors",
    subtitle: "Custom Tailor",
    description: "Formal wear, uniforms and alteration services with fast delivery slots.",
    categorySlug: "tailors",
    area: "SM Street",
    city: "Kozhikode",
    addressLine: "SM Street, Calicut",
    landmark: "Near silk market",
    latitude: 11.2517,
    longitude: 75.7811,
    phone: "+91 98765 43002",
    whatsapp: "+91 98765 43002",
    email: "orders@royaletailors.example",
    website: null,
    rating: 4.7,
    reviewCount: 89,
    distanceKm: 1.5,
    badgeText: "Popular",
    badgeColor: "#FFAC1D",
    coverVariant: "suit",
    imageUrl: null,
    upiId: "royaletailors@upi",
    openingHours: "Mon - Sat, 9:30 AM - 8:00 PM",
    galleryUrls: ["/mockup/im-card_suit.jpg", "/mockup/im-card_fabric.jpg", "/mockup/im-tailor-formal-shirts.jpg"],
    isVerified: true,
    tags: ["tailor", "clothing", "alterations", "uniforms"],
    isFeatured: true,
    isPopular: false,
  },
  {
    name: "Fresh Basket",
    slug: "fresh-basket",
    subtitle: "Grocery & Produce",
    description: "Fresh vegetables, fruits and daily staples with same-day delivery.",
    categorySlug: "grocery",
    area: "Mavoor Road",
    city: "Kozhikode",
    addressLine: "Mavoor Road, Calicut",
    landmark: "Near bus stand",
    latitude: 11.2581,
    longitude: 75.7892,
    phone: "+91 98765 43003",
    whatsapp: "+91 98765 43003",
    email: null,
    website: null,
    rating: 4.5,
    reviewCount: 162,
    distanceKm: 2.1,
    badgeText: "10% OFF",
    badgeColor: "#35B44A",
    coverVariant: "basket",
    imageUrl: null,
    upiId: "freshbasket@upi",
    openingHours: "Mon - Sun, 7:00 AM - 9:30 PM",
    galleryUrls: ["/mockup/im-vegetables.jpg", "/mockup/im-grocery.jpg", "/mockup/im-supermarket.jpg"],
    isVerified: true,
    tags: ["grocery", "vegetables", "fruits", "delivery"],
    isFeatured: true,
    isPopular: true,
  },
  {
    name: "Hair Lounge",
    slug: "hair-lounge",
    subtitle: "Beauty Salon",
    description: "Hair styling, grooming, facials and bridal packages by appointment.",
    categorySlug: "beauty",
    area: "PT Usha Road",
    city: "Kozhikode",
    addressLine: "PT Usha Road, Calicut",
    landmark: "Opposite mall entrance",
    latitude: 11.2622,
    longitude: 75.7758,
    phone: "+91 98765 43004",
    whatsapp: "+91 98765 43004",
    email: null,
    website: null,
    rating: 4.6,
    reviewCount: 98,
    distanceKm: 2.4,
    badgeText: "Featured",
    badgeColor: "#FF7186",
    coverVariant: "salon",
    imageUrl: null,
    upiId: "hairlounge@upi",
    openingHours: "Tue - Sun, 10:00 AM - 8:00 PM",
    galleryUrls: ["/mockup/im-beauty-haircut.png", "/mockup/im-beauty-spa.png", "/mockup/im-beauty-bridal.png"],
    isVerified: true,
    tags: ["beauty", "salon", "grooming", "bridal"],
    isFeatured: true,
    isPopular: false,
  },
  {
    name: "Quick Mart",
    slug: "quick-mart",
    subtitle: "Neighborhood Supermarket",
    description: "Household essentials, snacks, personal care and monthly grocery packs.",
    categorySlug: "grocery",
    area: "Nadakkavu",
    city: "Kozhikode",
    addressLine: "Nadakkavu, Calicut",
    landmark: "Near petrol pump",
    latitude: 11.2765,
    longitude: 75.7752,
    phone: "+91 98765 43005",
    whatsapp: "+91 98765 43005",
    email: null,
    website: null,
    rating: 4.4,
    reviewCount: 74,
    distanceKm: 1.9,
    badgeText: "New",
    badgeColor: "#25A451",
    coverVariant: "shelf",
    imageUrl: null,
    upiId: "quickmart@upi",
    openingHours: "Mon - Sun, 7:30 AM - 10:00 PM",
    galleryUrls: ["/mockup/im-supermarket.jpg", "/mockup/im-grocery.jpg"],
    isVerified: false,
    tags: ["grocery", "supermarket", "essentials"],
    isFeatured: false,
    isPopular: true,
  },
  {
    name: "Maya Beauty Salon",
    slug: "maya-beauty-salon",
    subtitle: "Salon & Spa",
    description: "Hair spa, skincare, makeup and party styling for women.",
    categorySlug: "beauty",
    area: "East Hill",
    city: "Kozhikode",
    addressLine: "East Hill, Calicut",
    landmark: "Near school junction",
    latitude: 11.2859,
    longitude: 75.7708,
    phone: "+91 98765 43006",
    whatsapp: "+91 98765 43006",
    email: null,
    website: null,
    rating: 4.7,
    reviewCount: 76,
    distanceKm: 1.3,
    badgeText: "Top Rated",
    badgeColor: "#D94842",
    coverVariant: "salon",
    imageUrl: null,
    upiId: "mayasalon@upi",
    openingHours: "Tue - Sun, 10:00 AM - 7:30 PM",
    galleryUrls: ["/mockup/im-beauty.jpg", "/mockup/im-beauty-facial.png"],
    isVerified: true,
    tags: ["beauty", "spa", "salon", "makeup"],
    isFeatured: false,
    isPopular: true,
  },
  {
    name: "Tech Hub",
    slug: "tech-hub",
    subtitle: "Mobiles & Electronics",
    description: "Mobiles, accessories, quick repairs and exchange support.",
    categorySlug: "electronics",
    area: "Palayam",
    city: "Kozhikode",
    addressLine: "Palayam, Calicut",
    landmark: "Inside electronics lane",
    latitude: 11.2483,
    longitude: 75.7834,
    phone: "+91 98765 43007",
    whatsapp: "+91 98765 43007",
    email: "support@techhub.example",
    website: null,
    rating: 4.5,
    reviewCount: 124,
    distanceKm: 1.6,
    badgeText: null,
    badgeColor: null,
    coverVariant: "phone",
    imageUrl: null,
    upiId: "techhub@upi",
    openingHours: "Mon - Sat, 10:00 AM - 9:00 PM",
    galleryUrls: ["/mockup/im-mobile.jpg", "/mockup/im-electronics-new-accessories.jpg"],
    isVerified: true,
    tags: ["electronics", "mobile", "repair", "accessories"],
    isFeatured: false,
    isPopular: true,
  },
  {
    name: "HomeFix Pro",
    slug: "homefix-pro",
    subtitle: "Home Services",
    description: "Electrical, plumbing and maintenance visits for homes and small shops.",
    categorySlug: "home-services",
    area: "Eranhipalam",
    city: "Kozhikode",
    addressLine: "Eranhipalam, Calicut",
    landmark: "Service office",
    latitude: 11.2802,
    longitude: 75.7861,
    phone: "+91 98765 43008",
    whatsapp: "+91 98765 43008",
    email: null,
    website: null,
    rating: 4.6,
    reviewCount: 53,
    distanceKm: 2.4,
    badgeText: "Verified",
    badgeColor: "#2469D6",
    coverVariant: "worker",
    imageUrl: null,
    upiId: "homefixpro@upi",
    openingHours: "Mon - Sun, 8:00 AM - 8:00 PM",
    galleryUrls: ["/mockup/im-home-plumbing.jpg", "/mockup/im-home-appliance-repair.jpg"],
    isVerified: true,
    tags: ["home-services", "electrician", "plumbing", "repair"],
    isFeatured: false,
    isPopular: true,
  },
  {
    name: "Foodie's Corner",
    slug: "foodies-corner",
    subtitle: "Cafe & Snacks",
    description: "Tea, snacks, sandwiches and casual dining near the city center.",
    categorySlug: "restaurants",
    area: "Kallai Road",
    city: "Kozhikode",
    addressLine: "Kallai Road, Calicut",
    landmark: "Near railway bridge",
    latitude: 11.2397,
    longitude: 75.7865,
    phone: "+91 98765 43009",
    whatsapp: "+91 98765 43009",
    email: null,
    website: null,
    rating: 4.3,
    reviewCount: 112,
    distanceKm: 1.8,
    badgeText: "Offer",
    badgeColor: "#F4A51C",
    coverVariant: "plate",
    imageUrl: null,
    upiId: "foodiescorner@upi",
    openingHours: "Mon - Sun, 8:00 AM - 10:00 PM",
    galleryUrls: ["/mockup/im-rest-snacks.jpg", "/mockup/im-rest-pizza-burger.jpg"],
    isVerified: false,
    tags: ["restaurant", "cafe", "snacks", "tea"],
    isFeatured: false,
    isPopular: true,
  },
  {
    name: "Stitch Studio",
    slug: "stitch-studio",
    subtitle: "Boutique Tailor",
    description: "Boutique stitching, custom fittings and fabric consultation.",
    categorySlug: "tailors",
    area: "Puthiyara",
    city: "Kozhikode",
    addressLine: "Puthiyara, Calicut",
    landmark: "Near clinic",
    latitude: 11.2524,
    longitude: 75.7945,
    phone: "+91 98765 43010",
    whatsapp: "+91 98765 43010",
    email: null,
    website: null,
    rating: 4.7,
    reviewCount: 68,
    distanceKm: 2.0,
    badgeText: null,
    badgeColor: null,
    coverVariant: "suit",
    imageUrl: null,
    upiId: "stitchstudio@upi",
    openingHours: "Mon - Sat, 10:00 AM - 7:00 PM",
    galleryUrls: ["/mockup/im-card_fabric.jpg", "/mockup/im-card_bridal.jpg"],
    isVerified: true,
    tags: ["tailor", "boutique", "clothing", "fabric"],
    isFeatured: true,
    isPopular: true,
  },
  {
    name: "City Lights Electricals",
    slug: "city-lights-electricals",
    subtitle: "Electrical Store",
    description: "Switches, wiring, LED lights and electrician referrals for local projects.",
    categorySlug: "electronics",
    area: "West Hill",
    city: "Kozhikode",
    addressLine: "West Hill, Calicut",
    landmark: "Opposite post office",
    latitude: 11.2931,
    longitude: 75.7679,
    phone: "+91 98765 43011",
    whatsapp: "+91 98765 43011",
    email: null,
    website: null,
    rating: 4.4,
    reviewCount: 57,
    distanceKm: 3.1,
    badgeText: null,
    badgeColor: null,
    coverVariant: "phone",
    imageUrl: null,
    upiId: "citylights@upi",
    openingHours: "Mon - Sat, 9:00 AM - 8:30 PM",
    galleryUrls: ["/mockup/im-electronics-new-electrical-items.jpg", "/mockup/im-electrical.jpg"],
    isVerified: false,
    tags: ["electronics", "electrical", "lights", "hardware"],
    isFeatured: false,
    isPopular: false,
  },
  {
    name: "Daily Bake House",
    slug: "daily-bake-house",
    subtitle: "Bakery",
    description: "Fresh bread, cakes, puffs and custom celebration orders.",
    categorySlug: "restaurants",
    area: "Kuttichira",
    city: "Kozhikode",
    addressLine: "Kuttichira, Calicut",
    landmark: "Near old mosque",
    latitude: 11.2452,
    longitude: 75.7759,
    phone: "+91 98765 43012",
    whatsapp: "+91 98765 43012",
    email: null,
    website: null,
    rating: 4.5,
    reviewCount: 141,
    distanceKm: 2.7,
    badgeText: "Fresh Today",
    badgeColor: "#D94842",
    coverVariant: "plate",
    imageUrl: null,
    upiId: "dailybake@upi",
    openingHours: "Mon - Sun, 7:00 AM - 9:00 PM",
    galleryUrls: ["/mockup/im-bakery.jpg", "/mockup/im-bakery-sweets.jpg"],
    isVerified: true,
    tags: ["bakery", "cakes", "snacks", "restaurant"],
    isFeatured: true,
    isPopular: false,
  },
  {
    name: "Green Leaf Cleaning",
    slug: "green-leaf-cleaning",
    subtitle: "Cleaning Service",
    description: "Home deep cleaning, kitchen cleaning and move-in cleaning packages.",
    categorySlug: "home-services",
    area: "Civil Station",
    city: "Kozhikode",
    addressLine: "Civil Station, Calicut",
    landmark: "Near collectorate",
    latitude: 11.2728,
    longitude: 75.8085,
    phone: "+91 98765 43013",
    whatsapp: "+91 98765 43013",
    email: null,
    website: null,
    rating: 4.3,
    reviewCount: 44,
    distanceKm: 3.4,
    badgeText: "20% OFF",
    badgeColor: "#35B44A",
    coverVariant: "worker",
    imageUrl: null,
    upiId: "greenleafcleaning@upi",
    openingHours: "Mon - Sat, 8:00 AM - 6:00 PM",
    galleryUrls: ["/mockup/im-home-deep-cleaning.jpg", "/mockup/im-occ_helper.jpg"],
    isVerified: false,
    tags: ["home-services", "cleaning", "maintenance"],
    isFeatured: false,
    isPopular: false,
  },
  {
    name: "Aster Pharmacy",
    slug: "aster-pharmacy",
    subtitle: "Pharmacy",
    description: "Medicines, wellness products and monthly refill reminders.",
    categorySlug: "more",
    area: "Medical College",
    city: "Kozhikode",
    addressLine: "Medical College Road, Calicut",
    landmark: "Near hospital gate",
    latitude: 11.2712,
    longitude: 75.8376,
    phone: "+91 98765 43014",
    whatsapp: "+91 98765 43014",
    email: "care@asterpharmacy.example",
    website: null,
    rating: 4.4,
    reviewCount: 118,
    distanceKm: 4.2,
    badgeText: "Open Late",
    badgeColor: "#2469D6",
    coverVariant: "shelf",
    imageUrl: null,
    upiId: "asterpharmacy@upi",
    openingHours: "Mon - Sun, 8:00 AM - 11:00 PM",
    galleryUrls: ["/mockup/im-pharmacy.jpg", "/mockup/im-gifts.jpg"],
    isVerified: true,
    tags: ["pharmacy", "medicine", "wellness"],
    isFeatured: false,
    isPopular: false,
  },
];

const globalDb = globalThis as unknown as {
  nearuDb?: DatabaseSync;
  nearuInitialized?: boolean;
  nearuDbPath?: string;
};

function database() {
  const dbPath = databasePath();

  if (globalDb.nearuDb && globalDb.nearuDbPath !== dbPath) {
    globalDb.nearuDb.close();
    globalDb.nearuDb = undefined;
    globalDb.nearuInitialized = false;
  }

  if (!globalDb.nearuDb) {
    const dataDir = dirname(dbPath);
    mkdirSync(dataDir, { recursive: true });
    globalDb.nearuDb = new DatabaseSync(dbPath);
    globalDb.nearuDb.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");
    globalDb.nearuDbPath = dbPath;
  }

  if (!globalDb.nearuInitialized) {
    initializeDatabase(globalDb.nearuDb);
    globalDb.nearuInitialized = true;
  }

  return globalDb.nearuDb;
}

function databasePath() {
  return process.env.NEARU_DB_PATH?.trim() || join(process.cwd(), "data", "nearu.db");
}

function initializeDatabase(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      accent TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      subtitle TEXT NOT NULL,
      description TEXT,
      area TEXT NOT NULL,
      city TEXT NOT NULL,
      address_line TEXT,
      landmark TEXT,
      latitude REAL,
      longitude REAL,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      website TEXT,
      rating REAL NOT NULL,
      review_count INTEGER NOT NULL,
      distance_km REAL NOT NULL,
      badge_text TEXT,
      badge_color TEXT,
      cover_variant TEXT NOT NULL,
      image_url TEXT,
      logo_url TEXT,
      upi_id TEXT,
      opening_hours TEXT,
      gallery_urls TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      tags TEXT,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_popular INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      shop TEXT NOT NULL,
      category TEXT NOT NULL,
      badge TEXT NOT NULL,
      badge_color TEXT NOT NULL,
      image TEXT NOT NULL,
      gradient TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      business_slug TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS deal_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      image TEXT NOT NULL,
      price TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(deal_id) REFERENCES deals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      shop TEXT NOT NULL,
      category TEXT NOT NULL,
      code TEXT NOT NULL,
      image TEXT NOT NULL,
      gradient TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      business_slug TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS offer_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      image TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(offer_id) REFERENCES offers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      text TEXT NOT NULL,
      photos TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      is_featured INTEGER NOT NULL DEFAULT 0,
      helpful_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_business_status
      ON reviews (business_id, status, created_at);

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      source TEXT NOT NULL,
      metadata TEXT,
      session_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_business_type
      ON analytics_events (business_id, event_type, created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_created_at
      ON analytics_events (created_at);
  `);

  ensureBusinessColumns(db);

  const categoryCount = db
    .prepare("SELECT COUNT(*) AS count FROM categories")
    .get() as { count: number };

  if (categoryCount.count === 0) {
    seedDatabase(db);
  } else {
    upsertSeedData(db);
  }

  seedPromotions(db);
}

function ensureBusinessColumns(db: DatabaseSync) {
  const columns = new Set(
    (
      db.prepare("PRAGMA table_info(businesses)").all() as Array<{
        name: string;
      }>
    ).map((column) => column.name),
  );

  const additions: Array<[string, string]> = [
    ["description", "TEXT"],
    ["address_line", "TEXT"],
    ["landmark", "TEXT"],
    ["latitude", "REAL"],
    ["longitude", "REAL"],
    ["phone", "TEXT"],
    ["whatsapp", "TEXT"],
    ["email", "TEXT"],
    ["website", "TEXT"],
    ["image_url", "TEXT"],
    ["logo_url", "TEXT"],
    ["upi_id", "TEXT"],
    ["opening_hours", "TEXT"],
    ["gallery_urls", "TEXT"],
    ["is_verified", "INTEGER NOT NULL DEFAULT 0"],
    ["tags", "TEXT"],
  ];

  for (const [name, definition] of additions) {
    if (!columns.has(name)) {
      db.exec(`ALTER TABLE businesses ADD COLUMN ${name} ${definition}`);
    }
  }
}

function seedDatabase(db: DatabaseSync) {
  upsertSeedData(db);
}

function seedPromotions(db: DatabaseSync) {
  const dealCount = db.prepare("SELECT COUNT(*) AS count FROM deals").get() as { count: number };
  const offerCount = db.prepare("SELECT COUNT(*) AS count FROM offers").get() as { count: number };

  if (dealCount.count === 0) {
    for (const [index, deal] of spotlightDeals.entries()) {
      upsertDealRecord(db, { ...deal, businessSlug: businessSlugForShop(deal.shop), isActive: true, sortOrder: index + 1 });
    }
  }

  if (offerCount.count === 0) {
    for (const [index, offer] of topOffers.entries()) {
      upsertOfferRecord(db, { ...offer, businessSlug: businessSlugForShop(offer.shop), isActive: true, sortOrder: index + 1 });
    }
  }
}

function businessSlugForShop(shop: string) {
  return shop
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function upsertSeedData(db: DatabaseSync) {
  const categoryInsert = db.prepare(`
    INSERT INTO categories (name, slug, icon, accent, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      icon = excluded.icon,
      accent = excluded.accent,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order
  `);

  const businessInsert = db.prepare(`
    INSERT INTO businesses (
      name, slug, subtitle, description, area, city, address_line, landmark,
      latitude, longitude, phone, whatsapp, email, website, rating, review_count,
      distance_km, badge_text, badge_color, cover_variant, image_url, logo_url, upi_id,
      opening_hours, gallery_urls, tags, is_verified, is_featured, is_popular, category_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      subtitle = excluded.subtitle,
      description = excluded.description,
      area = excluded.area,
      city = excluded.city,
      address_line = excluded.address_line,
      landmark = excluded.landmark,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      phone = excluded.phone,
      whatsapp = excluded.whatsapp,
      email = excluded.email,
      website = excluded.website,
      rating = excluded.rating,
      review_count = excluded.review_count,
      distance_km = excluded.distance_km,
      badge_text = excluded.badge_text,
      badge_color = excluded.badge_color,
      cover_variant = excluded.cover_variant,
      image_url = excluded.image_url,
      logo_url = excluded.logo_url,
      upi_id = excluded.upi_id,
      opening_hours = excluded.opening_hours,
      gallery_urls = excluded.gallery_urls,
      tags = excluded.tags,
      is_verified = excluded.is_verified,
      is_featured = excluded.is_featured,
      is_popular = excluded.is_popular,
      category_id = excluded.category_id
  `);

  const categoryIds = new Map<string, number>();
  for (const category of seedCategories) {
    categoryInsert.run(
      category.name,
      category.slug,
      category.icon,
      category.accent,
      category.isActive ? 1 : 0,
      category.sortOrder,
    );
    const row = db
      .prepare("SELECT id FROM categories WHERE slug = ?")
      .get(category.slug) as { id: number };
    categoryIds.set(category.slug, row.id);
  }

  const getCategoryId = (slug: string) => {
    const categoryId = categoryIds.get(slug);

    if (categoryId === undefined) {
      throw new Error(`Missing category id for ${slug}`);
    }

    return categoryId;
  };

  for (const business of seedBusinesses) {
    businessInsert.run(
      business.name,
      business.slug,
      business.subtitle,
      business.description,
      business.area,
      business.city,
      business.addressLine,
      business.landmark,
      business.latitude,
      business.longitude,
      business.phone,
      business.whatsapp,
      business.email,
      business.website,
      business.rating,
      business.reviewCount,
      business.distanceKm,
      business.badgeText,
      business.badgeColor,
      business.coverVariant,
      business.imageUrl,
      business.logoUrl ?? null,
      business.upiId,
      business.openingHours,
      business.galleryUrls.join("\n"),
      business.tags.join(","),
      business.isVerified ? 1 : 0,
      business.isFeatured ? 1 : 0,
      business.isPopular ? 1 : 0,
      getCategoryId(business.categorySlug),
    );
  }
}

export function getCategoriesData() {
  const db = database();
  const rows = db
    .prepare("SELECT * FROM categories ORDER BY sort_order ASC")
    .all() as CategoryRow[];

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    accent: row.accent,
    sortOrder: row.sort_order,
    isActive: Boolean(row.is_active),
  }));
}

function businessSelectSql() {
  return `
    SELECT
      businesses.*,
      categories.name AS category_name,
      categories.slug AS category_slug
    FROM businesses
    INNER JOIN categories ON categories.id = businesses.category_id
  `;
}

function getBusinesses(filters: CatalogFilters = {}) {
  const db = database();
  const query = buildBusinessQuery(filters);
  const rows = db
    .prepare(`${businessSelectSql()} ${query.whereSql} ${query.orderSql} ${query.limitSql}`)
    .all(...query.params) as BusinessRow[];

  return rows.map(businessFromRow);
}

function getBusinessCount(filters: CatalogFilters = {}) {
  const db = database();
  const query = buildBusinessQuery({ ...filters, limit: undefined });
  const row = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM businesses
      INNER JOIN categories ON categories.id = businesses.category_id
      ${query.whereSql}
    `)
    .get(...query.params) as { count: number };

  return row.count;
}

function buildBusinessQuery(filters: CatalogFilters) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (filters.category) {
    const category = filters.category.toLowerCase().trim();
    clauses.push("(lower(categories.slug) = ? OR lower(categories.name) = ?)");
    params.push(category, category);
  }

  if (filters.featured !== undefined) {
    clauses.push("businesses.is_featured = ?");
    params.push(filters.featured ? 1 : 0);
  }

  if (filters.popular !== undefined) {
    clauses.push("businesses.is_popular = ?");
    params.push(filters.popular ? 1 : 0);
  }

  const terms = searchTerms(filters.query);
  for (const term of terms) {
    const like = `%${escapeLike(term)}%`;
    clauses.push(`(
      lower(businesses.name) LIKE ? ESCAPE '\\'
      OR lower(businesses.subtitle) LIKE ? ESCAPE '\\'
      OR lower(coalesce(businesses.description, '')) LIKE ? ESCAPE '\\'
      OR lower(businesses.area) LIKE ? ESCAPE '\\'
      OR lower(businesses.city) LIKE ? ESCAPE '\\'
      OR lower(coalesce(businesses.tags, '')) LIKE ? ESCAPE '\\'
      OR lower(categories.name) LIKE ? ESCAPE '\\'
      OR lower(categories.slug) LIKE ? ESCAPE '\\'
    )`);
    params.push(like, like, like, like, like, like, like, like);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const orderSql = orderSqlForSort(filters.sort ?? "default");
  const limitSql = filters.limit ? "LIMIT ?" : "";

  if (filters.limit) {
    params.push(filters.limit);
  }

  return { whereSql, orderSql, limitSql, params };
}

function searchTerms(query?: string) {
  return (query ?? "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function orderSqlForSort(sort: CatalogSort) {
  switch (sort) {
    case "rating":
      return "ORDER BY businesses.rating DESC, businesses.review_count DESC, businesses.id ASC";
    case "distance":
      return "ORDER BY businesses.distance_km ASC, businesses.rating DESC, businesses.id ASC";
    case "name":
      return "ORDER BY lower(businesses.name) ASC, businesses.id ASC";
    case "default":
    default:
      return "ORDER BY businesses.id ASC";
  }
}

function businessFromRow(row: BusinessRow) {
  const tags = parseTags(row.tags);
  const images = businessImagesForRow(row);
  const gallery = parseGalleryUrls(row.gallery_urls, images[0]?.url);
  const reviewSummary = getReviewSummaryForBusinessId(String(row.id), {
    score: row.rating,
    reviewCount: row.review_count,
  });

  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description ?? "",
    category: {
      id: String(row.category_id),
      name: row.category_name,
      slug: row.category_slug,
    },
    flags: {
      featured: Boolean(row.is_featured),
      popular: Boolean(row.is_popular),
      favorite: Boolean(row.is_favorite),
    },
    rating: {
      score: reviewSummary.average,
      reviewCount: reviewSummary.total,
      breakdown: reviewSummary.breakdown,
      moderatedCount: reviewSummary.approvedTotal,
    },
    location: {
      area: row.area,
      city: row.city,
      addressLine: row.address_line ?? "",
      landmark: row.landmark ?? "",
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm: row.distance_km,
    },
    contact: {
      phone: row.phone ?? "",
      whatsapp: row.whatsapp ?? "",
      email: row.email ?? "",
      website: row.website ?? "",
    },
    payment: {
      upiId: row.upi_id ?? "",
    },
    hours: row.opening_hours ?? "",
    trust: {
      verified: Boolean(row.is_verified),
    },
    images,
    gallery,
    tags,
    badge: {
      text: row.badge_text,
      color: row.badge_color,
    },
    searchFields: {
      categorySlug: row.category_slug,
      categoryName: row.category_name,
      area: row.area,
      city: row.city,
      tags,
    },
  };
}

function reviewSelectSql() {
  return `
    SELECT
      reviews.*,
      businesses.name AS business_name,
      businesses.slug AS business_slug
    FROM reviews
    INNER JOIN businesses ON businesses.id = reviews.business_id
  `;
}

function reviewFromRow(row: ReviewRow) {
  return {
    id: String(row.id),
    business: {
      id: String(row.business_id),
      name: row.business_name,
      slug: row.business_slug,
    },
    customer: {
      name: row.customer_name,
      email: row.customer_email ?? "",
      phone: row.customer_phone ?? "",
    },
    rating: row.rating,
    text: row.text,
    photos: parseGalleryUrls(row.photos, undefined),
    status: normalizeReviewStatus(row.status),
    featured: Boolean(row.is_featured),
    helpfulCount: row.helpful_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeReviewStatus(value: string): ReviewStatus {
  return value === "approved" || value === "rejected" ? value : "pending";
}

function getReviewSummaryForBusinessId(
  businessId: string,
  fallback: { score: number; reviewCount: number } = { score: 0, reviewCount: 0 },
) {
  const db = database();
  const rows = db
    .prepare(`
      SELECT rating, COUNT(*) AS count
      FROM reviews
      WHERE business_id = ? AND status = 'approved'
      GROUP BY rating
    `)
    .all(Number(businessId)) as Array<{ rating: number; count: number }>;
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let approvedTotal = 0;
  let ratingSum = 0;

  for (const row of rows) {
    const rating = clampReviewRating(row.rating);
    breakdown[rating as keyof typeof breakdown] = row.count;
    approvedTotal += row.count;
    ratingSum += rating * row.count;
  }

  if (approvedTotal === 0) {
    return {
      average: fallback.score,
      total: fallback.reviewCount,
      approvedTotal,
      breakdown,
    };
  }

  return {
    average: Math.round((ratingSum / approvedTotal) * 10) / 10,
    total: approvedTotal,
    approvedTotal,
    breakdown,
  };
}

function clampReviewRating(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}

function businessImagesForRow(row: BusinessRow) {
  const coverUrl = normalizeImageUrl(row.image_url) || imageUrlForVariant(row.cover_variant);
  const thumbnailUrl = thumbnailUrlForImage(coverUrl);
  const logoUrl = normalizeImageUrl(row.logo_url) || logoUrlForBusiness(row);
  const altBase = `${row.name} ${row.subtitle}`.trim();

  return [
    {
      url: coverUrl,
      variant: row.cover_variant,
      alt: altBase,
      role: "cover",
      isPrimary: true,
    },
    {
      url: thumbnailUrl,
      variant: row.cover_variant,
      alt: `${row.name} thumbnail`,
      role: "thumbnail",
      isPrimary: false,
    },
    {
      url: logoUrl,
      variant: "logo",
      alt: `${row.name} logo`,
      role: "logo",
      isPrimary: false,
    },
  ];
}

function normalizeImageUrl(value: string | null) {
  const normalized = value?.trim() ?? "";
  if (!normalized) {
    return null;
  }

  return normalized;
}

function thumbnailUrlForImage(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("pexels.com")) {
      parsed.searchParams.set("w", "600");
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
}

function logoUrlForBusiness(row: BusinessRow) {
  const initial = encodeURIComponent(row.name.trim().slice(0, 2).toUpperCase() || "BN");
  const accent = row.badge_color?.replace("#", "") || "0B2F74";
  return `https://placehold.co/160x160/${accent}/FFFFFF/png?text=${initial}`;
}

function parseTags(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseGalleryUrls(value: string | null, fallback?: string) {
  const gallery = (value ?? "")
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (gallery.length > 0) {
    return gallery;
  }

  return fallback ? [fallback] : [];
}

function imageUrlForVariant(variant: string) {
  switch (variant) {
    case "plate":
      return "https://images.pexels.com/photos/20418288/pexels-photo-20418288.jpeg?auto=compress&cs=tinysrgb&w=1200";
    case "suit":
      return "https://images.pexels.com/photos/6766299/pexels-photo-6766299.jpeg?auto=compress&cs=tinysrgb&w=1200";
    case "basket":
      return "https://images.pexels.com/photos/9070106/pexels-photo-9070106.jpeg?auto=compress&cs=tinysrgb&w=1200";
    case "salon":
      return "https://images.pexels.com/photos/13068359/pexels-photo-13068359.jpeg?auto=compress&cs=tinysrgb&w=1200";
    case "shelf":
      return "https://images.pexels.com/photos/16211537/pexels-photo-16211537.jpeg?auto=compress&cs=tinysrgb&w=1200";
    case "phone":
      return "https://images.pexels.com/photos/2818118/pexels-photo-2818118.jpeg?auto=compress&cs=tinysrgb&w=1200";
    case "worker":
      return "https://images.pexels.com/photos/4981802/pexels-photo-4981802.jpeg?auto=compress&cs=tinysrgb&w=1200";
    default:
      return "https://images.pexels.com/photos/30729159/pexels-photo-30729159.jpeg?auto=compress&cs=tinysrgb&w=1200";
  }
}

export async function getCatalogData(filters: CatalogFilters = {}) {
  const normalizedFilters = normalizeCatalogFilters(filters);
  const categories = getCategoriesData();
  const filtered = getBusinesses(normalizedFilters);
  const featured = getBusinesses({ ...normalizedFilters, featured: true, limit: 5 });
  const popular = getBusinesses({ ...normalizedFilters, popular: true, limit: 8 });
  const total = getBusinessCount(normalizedFilters);

  return {
    ok: true,
    categories,
    featured,
    popular,
    all: filtered,
    filters: {
      query: normalizedFilters.query ?? "",
      category: normalizedFilters.category ?? "",
      featured: normalizedFilters.featured ?? null,
      popular: normalizedFilters.popular ?? null,
      sort: normalizedFilters.sort ?? "default",
      limit: normalizedFilters.limit ?? null,
    },
    stats: {
      categories: categories.length,
      businesses: filtered.length,
      totalBusinesses: total,
      trusted: popular.length,
      happyUsers: "10K+",
    },
    meta: {
      count: filtered.length,
      total,
      hasMore:
        normalizedFilters.limit !== undefined &&
        normalizedFilters.limit > 0 &&
        total > filtered.length,
    },
  };
}

function normalizeCatalogFilters(filters: CatalogFilters) {
  return {
    query: filters.query?.trim() || undefined,
    category: filters.category?.trim().toLowerCase() || undefined,
    featured: filters.featured,
    popular: filters.popular,
    sort: filters.sort ?? "default",
    limit: filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : undefined,
  } satisfies CatalogFilters;
}

export async function getBusinessBySlug(slug: string) {
  const normalizedSlug = slug.toLowerCase().trim();

  if (!normalizedSlug) {
    return null;
  }

  const db = database();
  const row = db
    .prepare(`${businessSelectSql()} WHERE lower(businesses.slug) = ? LIMIT 1`)
    .get(normalizedSlug) as BusinessRow | undefined;

  return row ? businessFromRow(row) : null;
}

export function getReviewSummaryForBusinessSlug(slug: string) {
  const db = database();
  const row = db
    .prepare("SELECT id, rating, review_count FROM businesses WHERE lower(slug) = ? LIMIT 1")
    .get(slug.toLowerCase().trim()) as Pick<BusinessRow, "id" | "rating" | "review_count"> | undefined;

  if (!row) {
    return null;
  }

  return getReviewSummaryForBusinessId(String(row.id), {
    score: row.rating,
    reviewCount: row.review_count,
  });
}

export function getApprovedReviewsForBusiness(slug: string) {
  const db = database();
  const rows = db
    .prepare(`
      ${reviewSelectSql()}
      WHERE lower(businesses.slug) = ? AND reviews.status = 'approved'
      ORDER BY reviews.is_featured DESC, reviews.created_at DESC, reviews.id DESC
    `)
    .all(slug.toLowerCase().trim()) as ReviewRow[];

  return rows.map(reviewFromRow);
}

export function getBusinessReviewData(slug: string) {
  return {
    summary: getReviewSummaryForBusinessSlug(slug),
    reviews: getApprovedReviewsForBusiness(slug),
  };
}

export function getAdminReviews({
  status,
  query,
}: {
  status?: ReviewStatus | "all";
  query?: string;
} = {}) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (status && status !== "all") {
    clauses.push("reviews.status = ?");
    params.push(status);
  }

  for (const term of searchTerms(query)) {
    const like = `%${escapeLike(term)}%`;
    clauses.push(`(
      lower(reviews.customer_name) LIKE ? ESCAPE '\\'
      OR lower(reviews.text) LIKE ? ESCAPE '\\'
      OR lower(businesses.name) LIKE ? ESCAPE '\\'
      OR lower(businesses.slug) LIKE ? ESCAPE '\\'
    )`);
    params.push(like, like, like, like);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = database()
    .prepare(`
      ${reviewSelectSql()}
      ${whereSql}
      ORDER BY
        CASE reviews.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
        reviews.created_at DESC,
        reviews.id DESC
    `)
    .all(...params) as ReviewRow[];

  return rows.map(reviewFromRow);
}

export async function addReview(input: {
  businessSlug: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  rating: number;
  text: string;
  photos?: string[];
  status?: ReviewStatus;
  featured?: boolean;
}) {
  const db = database();
  const business = db
    .prepare("SELECT id FROM businesses WHERE lower(slug) = ? LIMIT 1")
    .get(input.businessSlug.toLowerCase().trim()) as { id: number } | undefined;

  if (!business) {
    return { ok: false, id: null, message: "Business was not found." };
  }

  const result = db
    .prepare(`
      INSERT INTO reviews (
        business_id, customer_name, customer_email, customer_phone, rating,
        text, photos, status, is_featured, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .run(
      business.id,
      input.customerName,
      input.customerEmail ?? null,
      input.customerPhone ?? null,
      clampReviewRating(input.rating),
      input.text,
      (input.photos ?? []).slice(0, 4).join("\n") || null,
      normalizeReviewStatus(input.status ?? "pending"),
      input.featured ? 1 : 0,
    );

  return { ok: true, id: String(result.lastInsertRowid), message: "Review submitted." };
}

export async function setReviewStatus(id: string, status: ReviewStatus) {
  const result = database()
    .prepare("UPDATE reviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(status, Number(id));

  return { ok: result.changes > 0 };
}

export async function setReviewFeaturedStatus(id: string, featured: boolean) {
  const result = database()
    .prepare("UPDATE reviews SET is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(featured ? 1 : 0, Number(id));

  return { ok: result.changes > 0 };
}

export async function removeReview(id: string) {
  const result = database()
    .prepare("DELETE FROM reviews WHERE id = ?")
    .run(Number(id));

  return { ok: result.changes > 0 };
}

function analyticsSelectSql() {
  return `
    SELECT
      analytics_events.*,
      businesses.name AS business_name,
      businesses.slug AS business_slug
    FROM analytics_events
    INNER JOIN businesses ON businesses.id = analytics_events.business_id
  `;
}

function analyticsEventFromRow(row: AnalyticsEventRow) {
  return {
    id: String(row.id),
    business: {
      id: String(row.business_id),
      name: row.business_name,
      slug: row.business_slug,
    },
    eventType: normalizeAnalyticsEventType(row.event_type),
    source: row.source,
    metadata: parseAnalyticsMetadata(row.metadata),
    sessionId: row.session_id ?? "",
    createdAt: row.created_at,
  };
}

function normalizeAnalyticsEventType(value: string): AnalyticsEventType {
  return isAnalyticsEventType(value) ? value : "call_click";
}

export function isAnalyticsEventType(value: string): value is AnalyticsEventType {
  return analyticsEventTypes.includes(value as AnalyticsEventType);
}

function parseAnalyticsMetadata(value: string | null) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, string | number | boolean>)
      : {};
  } catch {
    return {};
  }
}

function sanitizeAnalyticsSource(value: string) {
  return value.trim().replace(/[^\w#/:?.=&-]+/g, " ").slice(0, 180) || "unknown";
}

function sanitizeAnalyticsMetadata(value: Record<string, unknown> | undefined) {
  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, raw] of Object.entries(value ?? {}).slice(0, 12)) {
    const safeKey = key.replace(/[^\w-]/g, "").slice(0, 40);
    if (!safeKey) {
      continue;
    }

    if (typeof raw === "string") {
      sanitized[safeKey] = raw.trim().slice(0, 160);
    } else if (typeof raw === "number" && Number.isFinite(raw)) {
      sanitized[safeKey] = raw;
    } else if (typeof raw === "boolean") {
      sanitized[safeKey] = raw;
    }
  }

  return sanitized;
}

function sanitizeSessionId(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return /^[a-zA-Z0-9_-]{8,80}$/.test(normalized) ? normalized : null;
}

export async function recordAnalyticsEvent(input: {
  businessSlug: string;
  eventType: AnalyticsEventType | string;
  source?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string | null;
}) {
  if (!isAnalyticsEventType(input.eventType)) {
    return { ok: false, message: "Invalid analytics event type." };
  }

  const db = database();
  const business = db
    .prepare("SELECT id FROM businesses WHERE lower(slug) = ? LIMIT 1")
    .get(input.businessSlug.toLowerCase().trim()) as { id: number } | undefined;

  if (!business) {
    return { ok: false, message: "Business was not found." };
  }

  const metadata = sanitizeAnalyticsMetadata(input.metadata);
  const result = db
    .prepare(`
      INSERT INTO analytics_events (business_id, event_type, source, metadata, session_id)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      business.id,
      input.eventType,
      sanitizeAnalyticsSource(input.source ?? "unknown"),
      Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
      sanitizeSessionId(input.sessionId),
    );

  return { ok: true, id: String(result.lastInsertRowid), message: "Analytics event recorded." };
}

export function getAnalyticsEvents({
  eventType,
  businessSlug,
  limit = 25,
}: {
  eventType?: AnalyticsEventType | "all";
  businessSlug?: string;
  limit?: number;
} = {}) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (eventType && eventType !== "all") {
    clauses.push("analytics_events.event_type = ?");
    params.push(eventType);
  }

  if (businessSlug) {
    clauses.push("lower(businesses.slug) = ?");
    params.push(businessSlug.toLowerCase().trim());
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const rows = database()
    .prepare(`
      ${analyticsSelectSql()}
      ${whereSql}
      ORDER BY analytics_events.created_at DESC, analytics_events.id DESC
      LIMIT ?
    `)
    .all(...params, safeLimit) as AnalyticsEventRow[];

  return rows.map(analyticsEventFromRow);
}

export function getAnalyticsSummary() {
  const db = database();
  const byTypeRows = db
    .prepare(`
      SELECT event_type, COUNT(*) AS count
      FROM analytics_events
      GROUP BY event_type
    `)
    .all() as Array<{ event_type: string; count: number }>;
  const byType = Object.fromEntries(analyticsEventTypes.map((type) => [type, 0])) as Record<AnalyticsEventType, number>;

  for (const row of byTypeRows) {
    if (isAnalyticsEventType(row.event_type)) {
      byType[row.event_type] = row.count;
    }
  }

  const topBusinesses = db
    .prepare(`
      SELECT
        businesses.id,
        businesses.name,
        businesses.slug,
        COUNT(analytics_events.id) AS total,
        SUM(CASE WHEN analytics_events.event_type = 'call_click' THEN 1 ELSE 0 END) AS calls,
        SUM(CASE WHEN analytics_events.event_type = 'whatsapp_click' THEN 1 ELSE 0 END) AS whatsapps,
        SUM(CASE WHEN analytics_events.event_type = 'route_click' THEN 1 ELSE 0 END) AS routes,
        SUM(CASE WHEN analytics_events.event_type = 'business_card_view' THEN 1 ELSE 0 END) AS card_views,
        SUM(CASE WHEN analytics_events.event_type IN ('upi_click', 'payment_click') THEN 1 ELSE 0 END) AS payments
      FROM businesses
      LEFT JOIN analytics_events ON analytics_events.business_id = businesses.id
      GROUP BY businesses.id
      HAVING total > 0
      ORDER BY total DESC, businesses.name ASC
      LIMIT 10
    `)
    .all() as Array<{
      id: number;
      name: string;
      slug: string;
      total: number;
      calls: number;
      whatsapps: number;
      routes: number;
      card_views: number;
      payments: number;
    }>;
  const total = Object.values(byType).reduce((sum, count) => sum + count, 0);

  return {
    total,
    byType,
    topBusinesses: topBusinesses.map((row) => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      total: row.total,
      calls: row.calls,
      whatsapps: row.whatsapps,
      routes: row.routes,
      cardViews: row.card_views,
      payments: row.payments,
    })),
    recentEvents: getAnalyticsEvents({ limit: 12 }),
  };
}

export function getBusinessAnalyticsCounts(slug: string) {
  const row = database()
    .prepare(`
      SELECT
        businesses.id,
        businesses.name,
        businesses.slug,
        COUNT(analytics_events.id) AS total,
        SUM(CASE WHEN analytics_events.event_type = 'call_click' THEN 1 ELSE 0 END) AS calls,
        SUM(CASE WHEN analytics_events.event_type = 'whatsapp_click' THEN 1 ELSE 0 END) AS whatsapps,
        SUM(CASE WHEN analytics_events.event_type = 'route_click' THEN 1 ELSE 0 END) AS routes,
        SUM(CASE WHEN analytics_events.event_type = 'business_card_view' THEN 1 ELSE 0 END) AS card_views,
        SUM(CASE WHEN analytics_events.event_type IN ('upi_click', 'payment_click') THEN 1 ELSE 0 END) AS payments
      FROM businesses
      LEFT JOIN analytics_events ON analytics_events.business_id = businesses.id
      WHERE lower(businesses.slug) = ?
      GROUP BY businesses.id
      LIMIT 1
    `)
    .get(slug.toLowerCase().trim()) as {
      id: number;
      name: string;
      slug: string;
      total: number;
      calls: number;
      whatsapps: number;
      routes: number;
      card_views: number;
      payments: number;
    } | undefined;

  if (!row) {
    return {
      id: "",
      name: "",
      slug,
      total: 0,
      calls: 0,
      whatsapps: 0,
      routes: 0,
      cardViews: 0,
      payments: 0,
    };
  }

  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    total: row.total,
    calls: row.calls,
    whatsapps: row.whatsapps,
    routes: row.routes,
    cardViews: row.card_views,
    payments: row.payments,
  };
}

export function getBusinessesForSitemap() {
  return getBusinesses();
}

export type DealInput = SpotlightDealData & {
  businessSlug?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type OfferInput = TopOfferData & {
  businessSlug?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export function getDealsData({ includeInactive = false } = {}) {
  const db = database();
  const rows = db
    .prepare(`SELECT * FROM deals ${includeInactive ? "" : "WHERE is_active = 1"} ORDER BY sort_order ASC, id ASC`)
    .all() as DealRow[];

  return rows.map((row) => dealFromRow(db, row));
}

export function getDealBySlugData(slug: string, { includeInactive = false } = {}) {
  const db = database();
  const row = db
    .prepare(`SELECT * FROM deals WHERE lower(slug) = ? ${includeInactive ? "" : "AND is_active = 1"} LIMIT 1`)
    .get(slug.toLowerCase().trim()) as DealRow | undefined;

  return row ? dealFromRow(db, row) : null;
}

export function getOffersData({ includeInactive = false } = {}) {
  const db = database();
  const rows = db
    .prepare(`SELECT * FROM offers ${includeInactive ? "" : "WHERE is_active = 1"} ORDER BY sort_order ASC, id ASC`)
    .all() as OfferRow[];

  return rows.map((row) => offerFromRow(db, row));
}

export function getOfferBySlugData(slug: string, { includeInactive = false } = {}) {
  const db = database();
  const row = db
    .prepare(`SELECT * FROM offers WHERE lower(slug) = ? ${includeInactive ? "" : "AND is_active = 1"} LIMIT 1`)
    .get(slug.toLowerCase().trim()) as OfferRow | undefined;

  return row ? offerFromRow(db, row) : null;
}

export async function addDeal(input: DealInput) {
  upsertDealRecord(database(), input);
}

export async function updateDeal(input: DealInput) {
  upsertDealRecord(database(), input);
}

export async function removeDeal(slug: string) {
  database().prepare("DELETE FROM deals WHERE slug = ?").run(slug);
}

export async function addOffer(input: OfferInput) {
  upsertOfferRecord(database(), input);
}

export async function updateOffer(input: OfferInput) {
  upsertOfferRecord(database(), input);
}

export async function removeOffer(slug: string) {
  database().prepare("DELETE FROM offers WHERE slug = ?").run(slug);
}

function upsertDealRecord(db: DatabaseSync, input: DealInput) {
  db.prepare(`
    INSERT INTO deals (
      slug, title, text, shop, category, badge, badge_color, image, gradient,
      valid_until, business_slug, is_active, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      text = excluded.text,
      shop = excluded.shop,
      category = excluded.category,
      badge = excluded.badge,
      badge_color = excluded.badge_color,
      image = excluded.image,
      gradient = excluded.gradient,
      valid_until = excluded.valid_until,
      business_slug = excluded.business_slug,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order
  `).run(
    input.slug,
    input.title,
    input.text,
    input.shop,
    input.category,
    input.badge,
    input.badgeColor,
    input.image,
    input.gradient,
    input.validUntil,
    input.businessSlug ?? businessSlugForShop(input.shop),
    input.isActive === false ? 0 : 1,
    input.sortOrder ?? 99,
  );

  const row = db.prepare("SELECT id FROM deals WHERE slug = ?").get(input.slug) as { id: number };
  db.prepare("DELETE FROM deal_items WHERE deal_id = ?").run(row.id);
  const itemInsert = db.prepare(`
    INSERT INTO deal_items (deal_id, name, text, image, price, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  input.items.forEach((item, index) => {
    itemInsert.run(row.id, item.name, item.text, item.image, item.price ?? null, index + 1);
  });
}

function upsertOfferRecord(db: DatabaseSync, input: OfferInput) {
  db.prepare(`
    INSERT INTO offers (
      slug, title, text, shop, category, code, image, gradient,
      valid_until, business_slug, is_active, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      text = excluded.text,
      shop = excluded.shop,
      category = excluded.category,
      code = excluded.code,
      image = excluded.image,
      gradient = excluded.gradient,
      valid_until = excluded.valid_until,
      business_slug = excluded.business_slug,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order
  `).run(
    input.slug,
    input.title,
    input.text,
    input.shop,
    input.category,
    input.code,
    input.image,
    input.gradient,
    input.validUntil,
    input.businessSlug ?? businessSlugForShop(input.shop),
    input.isActive === false ? 0 : 1,
    input.sortOrder ?? 99,
  );

  const row = db.prepare("SELECT id FROM offers WHERE slug = ?").get(input.slug) as { id: number };
  db.prepare("DELETE FROM offer_items WHERE offer_id = ?").run(row.id);
  const itemInsert = db.prepare(`
    INSERT INTO offer_items (offer_id, name, text, image, label, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  input.items.forEach((item, index) => {
    itemInsert.run(row.id, item.name, item.text, item.image, item.label, index + 1);
  });
}

function dealFromRow(db: DatabaseSync, row: DealRow): SpotlightDealData & { businessSlug: string | null; isActive: boolean; sortOrder: number } {
  const items = db
    .prepare("SELECT * FROM deal_items WHERE deal_id = ? ORDER BY sort_order ASC, id ASC")
    .all(row.id) as DealItemRow[];

  return {
    slug: row.slug,
    badge: row.badge,
    badgeColor: row.badge_color,
    title: row.title,
    text: row.text,
    shop: row.shop,
    image: row.image,
    gradient: row.gradient,
    category: row.category,
    validUntil: row.valid_until,
    businessSlug: row.business_slug,
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
    items: items.map((item) => ({
      name: item.name,
      text: item.text,
      image: item.image,
      price: item.price ?? undefined,
    })),
  };
}

function offerFromRow(db: DatabaseSync, row: OfferRow): TopOfferData & { businessSlug: string | null; isActive: boolean; sortOrder: number } {
  const items = db
    .prepare("SELECT * FROM offer_items WHERE offer_id = ? ORDER BY sort_order ASC, id ASC")
    .all(row.id) as OfferItemRow[];

  return {
    slug: row.slug,
    title: row.title,
    text: row.text,
    shop: row.shop,
    code: row.code,
    image: row.image,
    gradient: row.gradient,
    category: row.category,
    validUntil: row.valid_until,
    businessSlug: row.business_slug,
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
    items: items.map((item) => ({
      name: item.name,
      text: item.text,
      image: item.image,
      label: item.label,
    })),
  };
}

export async function getAdminData() {
  const db = database();
  const categories = db
    .prepare(`
      SELECT
        categories.*,
        COUNT(businesses.id) AS business_count
      FROM categories
      LEFT JOIN businesses ON businesses.category_id = categories.id
      GROUP BY categories.id
      ORDER BY categories.sort_order ASC
    `)
    .all() as Array<CategoryRow & { business_count: number }>;

  const businesses = getBusinesses().map((business) => ({
    ...business,
    category: business.category,
    analytics: getBusinessAnalyticsCounts(business.slug),
  }));

  return {
    categories: categories.map((row) => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      accent: row.accent,
      sortOrder: row.sort_order,
      isActive: Boolean(row.is_active),
      _count: {
        businesses: row.business_count,
      },
    })),
    businesses,
    deals: getDealsData({ includeInactive: true }),
    offers: getOffersData({ includeInactive: true }),
    reviews: getAdminReviews(),
    analytics: getAnalyticsSummary(),
  };
}

export async function addCategory(input: {
  name: string;
  slug: string;
  icon: string;
  accent: string;
  sortOrder: number;
  isActive: boolean;
}) {
  database()
    .prepare(`
      INSERT INTO categories (name, slug, icon, accent, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        icon = excluded.icon,
        accent = excluded.accent,
        is_active = excluded.is_active,
        sort_order = excluded.sort_order
    `)
    .run(
      input.name,
      input.slug,
      input.icon,
      input.accent,
      input.isActive ? 1 : 0,
      input.sortOrder,
    );
}

export async function updateCategory(input: {
  id: string;
  name: string;
  slug: string;
  icon: string;
  accent: string;
  sortOrder: number;
  isActive: boolean;
}) {
  database()
    .prepare(`
      UPDATE categories
      SET
        name = ?,
        slug = ?,
        icon = ?,
        accent = ?,
        is_active = ?,
        sort_order = ?
      WHERE id = ?
    `)
    .run(
      input.name,
      input.slug,
      input.icon,
      input.accent,
      input.isActive ? 1 : 0,
      input.sortOrder,
      Number(input.id),
    );
}

export async function addBusiness(input: {
  name: string;
  slug: string;
  subtitle: string;
  description: string | null;
  area: string;
  city: string;
  addressLine: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  categoryId: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  badgeText: string | null;
  badgeColor: string | null;
  coverVariant: string;
  imageUrl: string | null;
  logoUrl: string | null;
  upiId: string | null;
  openingHours: string | null;
  galleryUrls: string[];
  isVerified: boolean;
  tags: string[];
  isFeatured: boolean;
  isPopular: boolean;
}) {
  database()
    .prepare(`
      INSERT INTO businesses (
        name, slug, subtitle, description, area, city, address_line, landmark,
        latitude, longitude, phone, whatsapp, email, website, rating, review_count,
        distance_km, badge_text, badge_color, cover_variant, image_url, logo_url, upi_id,
        opening_hours, gallery_urls, tags, is_verified, is_featured, is_popular, category_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        subtitle = excluded.subtitle,
        description = excluded.description,
        area = excluded.area,
        city = excluded.city,
        address_line = excluded.address_line,
        landmark = excluded.landmark,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        phone = excluded.phone,
        whatsapp = excluded.whatsapp,
        email = excluded.email,
        website = excluded.website,
        rating = excluded.rating,
        review_count = excluded.review_count,
        distance_km = excluded.distance_km,
        badge_text = excluded.badge_text,
        badge_color = excluded.badge_color,
        cover_variant = excluded.cover_variant,
        image_url = excluded.image_url,
        logo_url = excluded.logo_url,
        upi_id = excluded.upi_id,
        opening_hours = excluded.opening_hours,
        gallery_urls = excluded.gallery_urls,
        tags = excluded.tags,
        is_verified = excluded.is_verified,
        is_featured = excluded.is_featured,
        is_popular = excluded.is_popular,
        category_id = excluded.category_id
    `)
    .run(
      input.name,
      input.slug,
      input.subtitle,
      input.description,
      input.area,
      input.city,
      input.addressLine,
      input.landmark,
      input.latitude,
      input.longitude,
      input.phone,
      input.whatsapp,
      input.email,
      input.website,
      input.rating,
      input.reviewCount,
      input.distanceKm,
      input.badgeText,
      input.badgeColor,
      input.coverVariant,
      input.imageUrl,
      input.logoUrl,
      input.upiId,
      input.openingHours,
      input.galleryUrls.join("\n"),
      input.tags.join(","),
      input.isVerified ? 1 : 0,
      input.isFeatured ? 1 : 0,
      input.isPopular ? 1 : 0,
      Number(input.categoryId),
    );
}

export async function updateBusiness(input: {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string | null;
  area: string;
  city: string;
  addressLine: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  categoryId: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  badgeText: string | null;
  badgeColor: string | null;
  coverVariant: string;
  imageUrl: string | null;
  logoUrl: string | null;
  upiId: string | null;
  openingHours: string | null;
  galleryUrls: string[];
  isVerified: boolean;
  tags: string[];
  isFeatured: boolean;
  isPopular: boolean;
}) {
  database()
    .prepare(`
      UPDATE businesses
      SET
        name = ?,
        slug = ?,
        subtitle = ?,
        description = ?,
        area = ?,
        city = ?,
        address_line = ?,
        landmark = ?,
        latitude = ?,
        longitude = ?,
        phone = ?,
        whatsapp = ?,
        email = ?,
        website = ?,
        rating = ?,
        review_count = ?,
        distance_km = ?,
        badge_text = ?,
        badge_color = ?,
        cover_variant = ?,
        image_url = ?,
        logo_url = ?,
        upi_id = ?,
        opening_hours = ?,
        gallery_urls = ?,
        tags = ?,
        is_verified = ?,
        is_featured = ?,
        is_popular = ?,
        category_id = ?
      WHERE id = ?
    `)
    .run(
      input.name,
      input.slug,
      input.subtitle,
      input.description,
      input.area,
      input.city,
      input.addressLine,
      input.landmark,
      input.latitude,
      input.longitude,
      input.phone,
      input.whatsapp,
      input.email,
      input.website,
      input.rating,
      input.reviewCount,
      input.distanceKm,
      input.badgeText,
      input.badgeColor,
      input.coverVariant,
      input.imageUrl,
      input.logoUrl,
      input.upiId,
      input.openingHours,
      input.galleryUrls.join("\n"),
      input.tags.join(","),
      input.isVerified ? 1 : 0,
      input.isFeatured ? 1 : 0,
      input.isPopular ? 1 : 0,
      Number(input.categoryId),
      Number(input.id),
    );
}

export async function setCategoryActiveStatus(id: string, isActive: boolean) {
  database()
    .prepare("UPDATE categories SET is_active = ? WHERE id = ?")
    .run(isActive ? 1 : 0, Number(id));
}

export async function removeCategoryIfEmpty(id: string) {
  const db = database();
  const businessCount = db
    .prepare("SELECT COUNT(*) AS count FROM businesses WHERE category_id = ?")
    .get(Number(id)) as { count: number };

  if (businessCount.count > 0) {
    return {
      ok: false,
      message: "Move or delete the businesses in this category before deleting it.",
    };
  }

  const result = db
    .prepare("DELETE FROM categories WHERE id = ?")
    .run(Number(id));

  return {
    ok: result.changes > 0,
    message: result.changes > 0 ? "Category deleted." : "Category was not found.",
  };
}

export async function setBusinessFeaturedStatus(id: string, isFeatured: boolean) {
  database()
    .prepare("UPDATE businesses SET is_featured = ? WHERE id = ?")
    .run(isFeatured ? 1 : 0, Number(id));
}

export async function setBusinessPopularStatus(id: string, isPopular: boolean) {
  database()
    .prepare("UPDATE businesses SET is_popular = ? WHERE id = ?")
    .run(isPopular ? 1 : 0, Number(id));
}

export async function removeBusiness(id: string) {
  database()
    .prepare("DELETE FROM businesses WHERE id = ?")
    .run(Number(id));
}
