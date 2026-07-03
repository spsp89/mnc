import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  accent: string;
  is_active: number;
  sort_order: number;
};

type BusinessRow = {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  area: string;
  city: string;
  rating: number;
  review_count: number;
  distance_km: number;
  badge_text: string | null;
  badge_color: string | null;
  cover_variant: string;
  is_featured: number;
  is_popular: number;
  is_favorite: number;
  category_id: number;
  category_name: string;
};

const globalDb = globalThis as unknown as {
  nearuDb?: DatabaseSync;
  nearuInitialized?: boolean;
};

function database() {
  if (!globalDb.nearuDb) {
    const dataDir = join(process.cwd(), "data");
    mkdirSync(dataDir, { recursive: true });
    globalDb.nearuDb = new DatabaseSync(join(dataDir, "nearu.db"));
  }

  if (!globalDb.nearuInitialized) {
    initializeDatabase(globalDb.nearuDb);
    globalDb.nearuInitialized = true;
  }

  return globalDb.nearuDb;
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
      area TEXT NOT NULL,
      city TEXT NOT NULL,
      rating REAL NOT NULL,
      review_count INTEGER NOT NULL,
      distance_km REAL NOT NULL,
      badge_text TEXT,
      badge_color TEXT,
      cover_variant TEXT NOT NULL,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_popular INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  const categoryCount = db
    .prepare("SELECT COUNT(*) AS count FROM categories")
    .get() as { count: number };

  if (categoryCount.count === 0) {
    seedDatabase(db);
  }
}

function seedDatabase(db: DatabaseSync) {
  const categoryInsert = db.prepare(`
    INSERT INTO categories (name, slug, icon, accent, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const businessInsert = db.prepare(`
    INSERT INTO businesses (
      name, slug, subtitle, area, city, rating, review_count, distance_km,
      badge_text, badge_color, cover_variant, is_featured, is_popular, category_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const categories = [
    ["Grocery", "grocery", "shopping-cart", "#FF5A4C", 0, 1],
    ["Restaurants", "restaurants", "utensils-crossed", "#FFB01E", 0, 2],
    ["Tailors", "tailors", "scissors", "#0B285E", 1, 3],
    ["Beauty", "beauty", "sparkles", "#FF7186", 0, 4],
    ["Electronics", "electronics", "monitor-smartphone", "#6A66FF", 0, 5],
    ["Home Services", "home-services", "house-plus", "#4AB64B", 0, 6],
    ["More", "more", "layout-grid", "#7183A6", 0, 7],
  ];

  const categoryIds = new Map<string, number>();
  for (const category of categories) {
    categoryInsert.run(...category);
    const row = db
      .prepare("SELECT id FROM categories WHERE slug = ?")
      .get(category[1]) as { id: number };
    categoryIds.set(category[1] as string, row.id);
  }

  const getCategoryId = (slug: string) => {
    const categoryId = categoryIds.get(slug);

    if (categoryId === undefined) {
      throw new Error(`Missing category id for ${slug}`);
    }

    return categoryId;
  };

  const businesses = [
    ["Spice Garden", "spice-garden", "Restaurant", "Calicut", "Kozhikode", 4.6, 126, 1.2, "20% OFF", "#2961F0", "plate", 1, 1, getCategoryId("restaurants")],
    ["Royale Tailors", "royale-tailors", "Tailor", "Calicut", "Kozhikode", 4.7, 89, 1.5, "Popular", "#FFAC1D", "suit", 1, 0, getCategoryId("tailors")],
    ["Fresh Basket", "fresh-basket", "Grocery", "Calicut", "Kozhikode", 4.5, 162, 2.1, "10% OFF", "#35B44A", "basket", 1, 1, getCategoryId("grocery")],
    ["Hair Lounge", "hair-lounge", "Beauty Salon", "Calicut", "Kozhikode", 4.6, 98, 2.4, null, null, "salon", 1, 0, getCategoryId("beauty")],
    ["Quick Mart", "quick-mart", "Grocery Store", "Calicut", "Kozhikode", 4.6, 98, 1.2, null, null, "shelf", 0, 1, getCategoryId("grocery")],
    ["Maya Beauty Salon", "maya-beauty-salon", "Beauty Salon", "Calicut", "Kozhikode", 4.7, 76, 1.3, null, null, "salon", 0, 1, getCategoryId("beauty")],
    ["Tech Hub", "tech-hub", "Electronics Store", "Calicut", "Kozhikode", 4.5, 124, 1.6, null, null, "phone", 0, 1, getCategoryId("electronics")],
    ["HomeFix Pro", "homefix-pro", "Home Services", "Calicut", "Kozhikode", 4.6, 53, 2.4, null, null, "worker", 0, 1, getCategoryId("home-services")],
    ["Foodie's Corner", "foodies-corner", "Restaurant", "Calicut", "Kozhikode", 4.5, 112, 1.8, null, null, "plate", 0, 1, getCategoryId("restaurants")],
    ["Stitch Studio", "stitch-studio", "Tailor", "Calicut", "Kozhikode", 4.7, 68, 2.0, null, null, "suit", 0, 1, getCategoryId("tailors")],
  ];

  for (const finalBusiness of businesses) {
    businessInsert.run(...finalBusiness);
  }
}

function getCategories() {
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
    isActive: Boolean(row.is_active),
  }));
}

function getBusinesses(whereClause: string) {
  const db = database();
  const rows = db
    .prepare(`
      SELECT
        businesses.*,
        categories.name AS category_name
      FROM businesses
      INNER JOIN categories ON categories.id = businesses.category_id
      ${whereClause}
      ORDER BY businesses.id ASC
    `)
    .all() as BusinessRow[];

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    subtitle: row.subtitle,
    area: row.area,
    city: row.city,
    rating: row.rating,
    reviewCount: row.review_count,
    distanceKm: row.distance_km,
    badgeText: row.badge_text,
    badgeColor: row.badge_color,
    coverVariant: row.cover_variant,
    imageUrl: imageUrlForVariant(row.cover_variant),
    category: {
      name: row.category_name,
    },
    isFeatured: Boolean(row.is_featured),
    isPopular: Boolean(row.is_popular),
  }));
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

export async function getCatalogData() {
  const categories = getCategories();
  const featured = getBusinesses("WHERE businesses.is_featured = 1").slice(0, 4);
  const popular = getBusinesses("WHERE businesses.is_popular = 1").slice(0, 6);

  return {
    categories,
    featured,
    popular,
    stats: {
      categories: categories.length,
      businesses: getBusinesses("").length,
      trusted: popular.length,
      happyUsers: "10K+",
    },
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

  const businesses = getBusinesses("").map((business) => ({
    ...business,
    category: business.category,
  }));

  return {
    categories: categories.map((row) => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      isActive: Boolean(row.is_active),
      _count: {
        businesses: row.business_count,
      },
    })),
    businesses,
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

export async function addBusiness(input: {
  name: string;
  slug: string;
  subtitle: string;
  area: string;
  city: string;
  categoryId: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  badgeText: string | null;
  badgeColor: string | null;
  coverVariant: string;
  isFeatured: boolean;
  isPopular: boolean;
}) {
  database()
    .prepare(`
      INSERT INTO businesses (
        name, slug, subtitle, area, city, rating, review_count, distance_km,
        badge_text, badge_color, cover_variant, is_featured, is_popular, category_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      input.name,
      input.slug,
      input.subtitle,
      input.area,
      input.city,
      input.rating,
      input.reviewCount,
      input.distanceKm,
      input.badgeText,
      input.badgeColor,
      input.coverVariant,
      input.isFeatured ? 1 : 0,
      input.isPopular ? 1 : 0,
      Number(input.categoryId),
    );
}
