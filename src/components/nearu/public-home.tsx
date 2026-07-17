import type { ComponentType, ReactNode } from "react";

import Link from "next/link";
import { submitBusinessReview } from "@/app/business/[slug]/actions";
import type {
  CatalogBusinessData,
  CatalogCategoryData,
  CatalogData,
  CatalogReviewData,
  ReviewSummaryData,
} from "@/lib/catalog";
import { getCategoryItems, type CategoryItemPageData } from "@/lib/category-items";
import type { SpotlightDealData } from "@/lib/deals";
import type { TopOfferData } from "@/lib/offers";
import { PublicSearchPanel } from "./public-search";
import { AnalyticsLink } from "./analytics-tracker";
import { SiteHeader } from "./site-header";
import {
  BriefcaseBusiness,
  Cake,
  BadgeCheck,
  ChevronRight,
  CircleUserRound,
  Clock3,
  FileText,
  Grid2X2,
  Heart,
  Home,
  Lightbulb,
  Mail,
  MapPin,
  Monitor,
  Network,
  Phone,
  Search,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Trophy,
  UtensilsCrossed,
  Globe2,
  Wrench,
  ShoppingCart,
  QrCode,
  Share2,
  WalletCards,
} from "lucide-react";

type IconType = ComponentType<{ className?: string }>;

type CategoryTile = {
  label: string;
  slug: string;
  icon: IconType;
  color: string;
  tint: string;
  isActive?: boolean;
  href?: string;
};

type ShopCardData = {
  slug?: string;
  name: string;
  category: string;
  description?: string;
  rating: string;
  reviews: string;
  distance: string;
  area?: string;
  phone?: string;
  directionsHref?: string;
  image: string;
  badge: string;
  badgeColor: string;
  ribbon?: string;
};

type RankedShopData = {
  rank: number;
  name: string;
  category: string;
  rating: string;
  reviews: string;
  distance: string;
  image: string;
};

type EcosystemCardData = {
  id: string;
  title: string;
  text: string;
  icon: IconType;
  href: string;
};

const categoryTiles: CategoryTile[] = [
  { label: "Grocery", slug: "grocery", icon: ShoppingCart, color: "#f2a715", tint: "#fff6df" },
  { label: "Restaurants", slug: "restaurants", icon: UtensilsCrossed, color: "#0b2f74", tint: "#f3f6fb" },
  { label: "Bakery", slug: "bakery", icon: Cake, color: "#f2a715", tint: "#fff6df" },
  { label: "Textiles", slug: "tailors", icon: Shirt, color: "#0b2f74", tint: "#f3f6fb" },
  { label: "Beauty", slug: "beauty", icon: Sparkles, color: "#d34c90", tint: "#fff0f7" },
  { label: "Mobile", slug: "electronics", icon: Smartphone, color: "#254fb3", tint: "#f1f4ff" },
  { label: "Electronics", slug: "electronics", icon: Monitor, color: "#0b2f74", tint: "#f3f6fb" },
  { label: "Home Services", slug: "home-services", icon: Home, color: "#0b2f74", tint: "#f3f6fb" },
  { label: "Doctor Booking", slug: "doctor-booking", icon: Stethoscope, color: "#1E9FB8", tint: "#e9f9fb", href: "/doctor-booking" },
  { label: "More", slug: "more", icon: Grid2X2, color: "#0b2f74", tint: "#f7f4ee" },
];

const featuredShops: ShopCardData[] = [
  {
    name: "Rajeevan Tailors",
    category: "Tailor / Clothing",
    rating: "4.6",
    reviews: "126",
    distance: "1.2 km",
    image: "/mockup/im-tailor.jpg",
    badge: "Star Shop",
    badgeColor: "#2469d6",
  },
  {
    name: "ALUKKY Hotel",
    category: "Restaurant",
    rating: "4.7",
    reviews: "89",
    distance: "1.5 km",
    image: "/mockup/im-restaurant.jpg",
    badge: "Popular",
    badgeColor: "#f4a51c",
  },
  {
    name: "Sweet Bakery",
    category: "Bakery",
    rating: "4.5",
    reviews: "162",
    distance: "2.1 km",
    image: "/mockup/im-bakery.jpg",
    badge: "Top Rated",
    badgeColor: "#d94842",
  },
  {
    name: "Star Jewelers",
    category: "Jewelry",
    rating: "4.6",
    reviews: "98",
    distance: "2.4 km",
    image: "/mockup/im-jewellery.jpg",
    badge: "Star Shop",
    badgeColor: "#2469d6",
  },
  {
    name: "Hanga Mobiles",
    category: "Mobile Store",
    rating: "4.4",
    reviews: "113",
    distance: "2.6 km",
    image: "/mockup/im-mobile.jpg",
    badge: "Popular",
    badgeColor: "#f4a51c",
  },
];

const allShops: ShopCardData[] = [
  ...featuredShops,
  {
    name: "Thache Electronics",
    category: "Electronics",
    rating: "4.3",
    reviews: "77",
    distance: "2.8 km",
    image: "/mockup/im-electronics.jpg",
    badge: "Offer",
    badgeColor: "#d94842",
  },
  {
    name: "Fresh Basket",
    category: "Grocery",
    rating: "4.6",
    reviews: "152",
    distance: "3.0 km",
    image: "/mockup/im-vegetables.jpg",
    badge: "New",
    badgeColor: "#25a451",
  },
  {
    name: "Spice Garden",
    category: "Restaurant / Cafe",
    rating: "4.6",
    reviews: "126",
    distance: "3.2 km",
    image: "/mockup/im-restaurant.jpg",
    badge: "Offer",
    badgeColor: "#d94842",
  },
  {
    name: "Maya Beauty Salon",
    category: "Beauty Salon",
    rating: "4.7",
    reviews: "76",
    distance: "3.4 km",
    image: "/mockup/im-beauty.jpg",
    badge: "Popular",
    badgeColor: "#f4a51c",
  },
  {
    name: "Quick Mart",
    category: "Grocery Store",
    rating: "4.6",
    reviews: "98",
    distance: "3.6 km",
    image: "/mockup/im-supermarket.jpg",
    badge: "New",
    badgeColor: "#25a451",
  },
  {
    name: "Tech Hub",
    category: "Electronics Store",
    rating: "4.5",
    reviews: "124",
    distance: "3.8 km",
    image: "/mockup/im-electronics.jpg",
    badge: "Top Rated",
    badgeColor: "#d94842",
  },
  {
    name: "HomeFix Pro",
    category: "Home Services",
    rating: "4.6",
    reviews: "53",
    distance: "4.0 km",
    image: "/mockup/im-electrical.jpg",
    badge: "Offer",
    badgeColor: "#f4a51c",
  },
];

const rankedShops: RankedShopData[] = [
  {
    rank: 1,
    name: "Star Stitch Center",
    category: "Tailor / Clothing",
    rating: "4.8",
    reviews: "134",
    distance: "1.1 km",
    image: "/mockup/im-card_machine.jpg",
  },
  {
    rank: 2,
    name: "Rajeevan Tailors",
    category: "Tailor / Clothing",
    rating: "4.6",
    reviews: "126",
    distance: "1.2 km",
    image: "/mockup/im-tailor.jpg",
  },
  {
    rank: 3,
    name: "Maya Tailors",
    category: "Tailor / Clothing",
    rating: "4.5",
    reviews: "77",
    distance: "1.6 km",
    image: "/mockup/im-card_fabric.jpg",
  },
];

const ecosystemCards: EcosystemCardData[] = [
  { id: "business-card", title: "Business Card", text: "Create & share your digital business card", icon: CircleUserRound, href: "/business-card" },
  { id: "b2b", title: "B2B Network", text: "Connect & grow with businesses", icon: Network, href: "/b2b" },
  { id: "jobs", title: "Jobs", text: "Find jobs or hire local talent", icon: BriefcaseBusiness, href: "/jobs" },
  { id: "doctor-booking", title: "Doctor Booking", text: "Book local doctor and clinic appointments", icon: Stethoscope, href: "/doctor-booking" },
  { id: "winner", title: "Winner", text: "Join contests & win exciting prizes", icon: Trophy, href: "/winner" },
  { id: "feed", title: "Feed", text: "Read & share local stories & updates", icon: FileText, href: "/feed" },
  { id: "plans", title: "Plans", text: "Choose the best plan for your business", icon: ShieldCheck, href: "/plans" },
  { id: "dashboard", title: "Dashboard", text: "Manage your business performance", icon: Store, href: "/dashboard" },
  { id: "admin", title: "Admin", text: "Manage users, reports & system", icon: Wrench, href: "/admin" },
  { id: "help", title: "Help", text: "Guides, help articles & resources", icon: Lightbulb, href: "/help" },
];

const categoryIconMap: Record<string, IconType> = {
  "shopping-cart": ShoppingCart,
  grocery: ShoppingCart,
  "utensils-crossed": UtensilsCrossed,
  restaurants: UtensilsCrossed,
  restaurant: UtensilsCrossed,
  scissors: Wrench,
  tailors: Wrench,
  sparkles: Sparkles,
  beauty: Sparkles,
  "monitor-smartphone": Smartphone,
  electronics: Monitor,
  mobile: Smartphone,
  "house-plus": Home,
  "home-services": Home,
  stethoscope: Stethoscope,
  "doctor-booking": Stethoscope,
  "layout-grid": Grid2X2,
  more: Grid2X2,
};

const categoryRedirectHrefs: Record<string, string> = {
  "doctor-booking": "/doctor-booking",
};

const variantImages: Record<string, string> = {
  plate: "/mockup/im-restaurant.jpg",
  suit: "/mockup/im-card_suit.jpg",
  basket: "/mockup/im-vegetables.jpg",
  salon: "/mockup/im-beauty.jpg",
  shelf: "/mockup/im-supermarket.jpg",
  phone: "/mockup/im-mobile.jpg",
  worker: "/mockup/im-occ_helper.jpg",
};

function buildCategoryCards(data: CatalogData): CategoryTile[] {
  const databaseCards = data.categories
    .filter((category) => category.name.trim().length > 0)
    .map((category) => ({
      label: category.name,
      slug: category.slug,
      icon: categoryIconMap[category.icon] ?? categoryIconMap[category.slug] ?? Grid2X2,
      color: category.accent || "#0b2f74",
      tint: tintFromAccent(category.accent),
      isActive: category.slug === data.filters.category,
      href: categoryRedirectHrefs[category.slug],
    }));

  return mergeByLabel(databaseCards, categoryTiles, categoryTiles.length);
}

function buildShopCards(
  businesses: CatalogBusinessData[] | undefined,
  fallback: ShopCardData[],
  minimum = fallback.length,
) {
  const databaseCards = (businesses ?? []).map(businessToShopCard);
  return mergeByLabel(databaseCards, fallback, minimum);
}

function buildRankedCards(
  businesses: CatalogBusinessData[] | undefined,
): RankedShopData[] {
  return (businesses ?? [])
    .slice()
    .sort(
      (left, right) =>
        right.rating.score - left.rating.score ||
        right.rating.reviewCount - left.rating.reviewCount,
    )
    .slice(0, rankedShops.length)
    .map((business, index) => ({
      ...businessToShopCard(business),
      rank: index + 1,
    }));
}

function businessToShopCard(business: CatalogBusinessData): ShopCardData {
  return {
    slug: business.slug,
    name: business.name,
    category: business.category.name || business.subtitle,
    description: business.description || business.subtitle,
    rating: formatRating(business.rating.score),
    reviews: String(business.rating.reviewCount),
    distance: `${formatDistance(business.location.distanceKm)} km`,
    area: [business.location.area, business.location.city].filter(Boolean).join(", "),
    phone: business.contact.phone,
    directionsHref: directionsHrefForBusiness(business),
    image: imageForBusiness(business),
    badge: business.badge.text ?? (business.flags.featured ? "Star Shop" : business.flags.popular ? "Popular" : "Verified"),
    badgeColor: business.badge.color ?? (business.flags.featured ? "#2469d6" : business.flags.popular ? "#f4a51c" : "#25a451"),
  };
}

function imageForBusiness(business: CatalogBusinessData) {
  const primary =
    business.images.find((image) => image.role === "thumbnail") ??
    business.images.find((image) => image.role === "cover") ??
    business.images.find((image) => image.isPrimary) ??
    business.images[0];
  return primary
    ? primary.url || variantImages[primary.variant] || "/mockup/im-restaurant.jpg"
    : "/mockup/im-restaurant.jpg";
}

function coverImageForBusiness(business: CatalogBusinessData) {
  const image =
    business.images.find((item) => item.role === "cover") ??
    business.images.find((item) => item.isPrimary) ??
    business.images[0];

  return image
    ? image.url || variantImages[image.variant] || "/mockup/im-restaurant.jpg"
    : "/mockup/im-restaurant.jpg";
}

function directionsHrefForBusiness(business: CatalogBusinessData) {
  const { latitude, longitude, addressLine, area, city } = business.location;
  const query =
    latitude !== null && longitude !== null
      ? `${latitude},${longitude}`
      : [business.name, addressLine, area, city].filter(Boolean).join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function mergeByLabel<T extends { name?: string; label?: string; slug?: string }>(
  primary: T[],
  fallback: T[],
  minimum: number,
) {
  const merged: T[] = [];
  const seen = new Set<string>();

  for (const item of [...primary, ...fallback]) {
    const key = normalizeKey(item.slug ?? item.name ?? item.label ?? "");
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(item);
  }

  return merged.slice(0, Math.max(minimum, primary.length));
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function tintFromAccent(accent: string) {
  const normalized = accent.trim();
  if (!/^#[0-9a-f]{6}$/i.test(normalized)) {
    return "#f3f6fb";
  }

  return `${normalized}18`;
}

function formatRating(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "4.6";
}

function formatDistance(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "1.2";
}

type CategoryFilterOverrides = Omit<Partial<CatalogData["filters"]>, "featured" | "popular"> & {
  featured?: boolean | null;
  popular?: boolean | null;
};

function categoryListingHref(
  slug: string,
  filters: CatalogData["filters"],
  overrides: CategoryFilterOverrides = {},
) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (next.query) {
    params.set("q", next.query);
  }

  if (next.sort && next.sort !== "default") {
    params.set("sort", next.sort);
  }

  if (next.featured) {
    params.set("featured", "true");
  }

  if (next.popular) {
    params.set("popular", "true");
  }

  const query = params.toString();
  return `/category/${encodeURIComponent(slug)}${query ? `?${query}` : ""}#category-results`;
}

export function PublicHome({
  data,
  deals,
  offers,
}: {
  data: CatalogData;
  deals: SpotlightDealData[];
  offers: TopOfferData[];
}) {
  const categoryCards = buildCategoryCards(data);
  const featuredCards = buildShopCards(data.featured, featuredShops, 0);
  const popularCards = buildShopCards(data.popular, allShops, 0);
  const rankedCards = buildRankedCards(data.all ?? data.popular);
  const hasRankedFlagFilter = data.filters.featured === true || data.filters.popular === true;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff3df_0%,#fffdf7_36%,#f1fff8_70%,#f7f9ff_100%)] text-[#0b2f74]">
      <section id="discover" className="bg-[#08285f] text-white">
        <SiteHeader />
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#09275f_0%,#0f766e_45%,#e85d2a_100%)]">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(255,243,223,0.24))]" />
          <div className="relative mx-auto grid max-w-[1800px] grid-cols-1 items-end gap-4 px-4 pb-7 pt-6 sm:gap-8 sm:px-5 sm:pb-10 sm:pt-8 md:px-10 lg:grid-cols-[1fr_0.98fr] lg:gap-10">
            <div className="max-w-[720px] pb-2">
              <h1 className="text-[38px] font-black leading-[0.98] sm:text-[58px] lg:text-[74px]">
                Find any shop, service
                <span className="block text-[#ffd166]">or deal near you</span>
              </h1>
              <p className="mt-3 max-w-[560px] text-[14px] leading-6 text-white/86 sm:mt-5 sm:text-[17px] sm:leading-7">
                Discover trusted local shops, services and exclusive offers in{" "}
                <span className="font-black text-[#ffd166]">Kozhikode</span> all in one
                place.
              </p>
              <form action="/#all-shops" className="mt-5 flex max-w-[860px] items-center rounded-[17px] bg-white p-1.5 shadow-[0_22px_46px_rgba(8,40,95,0.32)] ring-4 ring-white/14 sm:mt-8 sm:p-2">
                <Search className="ml-3 h-5 w-5 shrink-0 text-[#e85d2a] sm:ml-4 sm:h-6 sm:w-6" />
                <input
                  name="q"
                  defaultValue={data.filters.query}
                  className="min-w-0 flex-1 bg-transparent px-3 text-[13px] font-semibold text-[#102c61] outline-none placeholder:text-[#71809b] sm:px-5 sm:text-[15px]"
                  placeholder="Search shops, products, services or deals"
                />
                {data.filters.category ? <input type="hidden" name="category" value={data.filters.category} /> : null}
                <button className="rounded-[13px] bg-[#ffd166] px-5 py-3 text-[13px] font-black text-[#08285f] transition hover:bg-[#ffe08f] sm:rounded-[14px] sm:px-9 sm:py-4 sm:text-[15px]">
                  Search
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-semibold text-white sm:mt-5 sm:gap-3 sm:text-[14px]">
                <HeroChip icon={<Star className="h-5 w-5 fill-[#ffd166] text-[#ffd166]" />} text="Star shops" />
                <HeroChip icon={<Sparkles className="h-5 w-5 text-[#ffd166]" />} text="Best matches" />
                <HeroChip icon={<Store className="h-5 w-5 text-[#ffd166]" />} text={`${data.stats.totalBusinesses ?? data.stats.businesses} local listings`} />
                <HeroChip icon={<GiftIcon />} text="Live offers" />
              </div>
            </div>
            <HeroScene />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 pb-24 pt-5 sm:px-5 sm:pb-14 sm:pt-6 md:px-10">
        <SectionTitle title="Browse by category" />
        <CategoryRail categories={categoryCards} />

        <SectionTitle title="Deals in spotlight" action="View all deals" actionHref="/deals" />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:px-0 xl:grid-cols-4">
          {deals.map((deal) => (
            <SpotlightDeal key={deal.title} deal={deal} />
          ))}
        </div>

        <SectionTitle title="Featured shops" action="View all shops" actionHref="/featured-shops" />
        <ShopRail shops={featuredCards} emptyTitle="No featured shops match this search" emptyText="Try clearing filters or browsing all listings." />

        <SectionTitle title="Popular listings" action="See popular" />
        <ShopRail shops={popularCards} emptyTitle="No popular listings found" emptyText="Popular results will appear here when listings match your filters." />

        <SectionTitle title="Today's top offers" action="View all offers" actionHref="/offers" />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:px-0 xl:grid-cols-5">
          {offers.map((offer) => (
            <OfferCard key={offer.title} offer={offer} />
          ))}
        </div>

        <PublicSearchPanel initialData={data} />

        <section id="ranked" className="mt-9">
          <SectionTitle title="Search ranked shops" compact />
          <div className="-mx-4 -mt-2 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:gap-3 sm:px-0">
            {[
              { label: "Best Match", href: "/#ranked", active: !hasRankedFlagFilter && data.filters.sort === "default" },
              { label: "Most Rated", href: "/?sort=rating#ranked", active: !hasRankedFlagFilter && data.filters.sort === "rating" },
              { label: "Nearby", href: "/?sort=distance#ranked", active: !hasRankedFlagFilter && data.filters.sort === "distance" },
              { label: "Featured", href: "/?featured=true#ranked", active: data.filters.featured === true },
              { label: "Popular", href: "/?popular=true#ranked", active: data.filters.popular === true },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black sm:px-5 sm:text-[12px] ${
                  item.active
                    ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_10px_20px_rgba(15,118,110,0.18)]"
                    : "border-[#f1dfbf] bg-white/88 text-[#405474] hover:border-[#ffd166]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {rankedCards.length > 0 ? (
            <div className="grid gap-5 xl:grid-cols-3">
              {rankedCards.map((shop) => (
                <RankedShop key={shop.rank} shop={shop} />
              ))}
            </div>
          ) : (
            <EmptyState title="No ranked shops yet" text="Ranked listings appear when businesses match the current search." compact />
          )}
        </section>

        <section id="ecosystem" className="scroll-mt-24">
          <SectionTitle title="More from BNC ecosystem" />
        </section>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
          {ecosystemCards.map((item) => (
            <EcosystemCard key={item.title} item={item} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function CategoryListingPage({
  data,
  category,
  slug,
}: {
  data: CatalogData;
  category: CatalogCategoryData | null;
  slug: string;
}) {
  const categoryCards = buildCategoryCards(data);
  const categoryItems = getCategoryItems(slug);
  const shopCards = buildShopCards(data.all ?? [], [], 0);
  const isKnownCategory = Boolean(category);
  const categoryName = category?.name ?? "Category not found";
  const resultCount = data.meta?.total ?? data.stats.businesses;
  const hasActiveFilters = Boolean(
    data.filters.query ||
      data.filters.featured ||
      data.filters.popular ||
      (data.filters.sort && data.filters.sort !== "default"),
  );
  const baseHref = `/category/${encodeURIComponent(slug)}#category-results`;
  const sortOptions: Array<{ label: string; sort: CatalogData["filters"]["sort"] }> = [
    { label: "Best match", sort: "default" },
    { label: "Top rated", sort: "rating" },
    { label: "Nearby", sort: "distance" },
    { label: "Name", sort: "name" },
  ];
  const flagOptions: Array<{ label: string; value: "featured" | "popular"; overrides: CategoryFilterOverrides }> = [
    { label: "Featured", value: "featured", overrides: { sort: "default", featured: true, popular: null } },
    { label: "Popular", value: "popular", overrides: { sort: "default", featured: null, popular: true } },
  ];
  const selectedFlag = data.filters.featured ? "featured" : data.filters.popular ? "popular" : null;
  const selectedSort = selectedFlag ? null : data.filters.sort ?? "default";

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="bg-[radial-gradient(circle_at_18%_12%,#164caa,#082d75_48%,#061f55_100%)]">
          <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-5 sm:px-5 sm:pb-10 sm:pt-7 md:px-10">
            <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-black text-white/78 transition hover:text-white">
              <ChevronRight className="h-4 w-4 rotate-180" />
              All categories
            </Link>
            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_420px] lg:items-end">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#f5b625]">
                  BNC Marketplace
                </p>
                <h1 className="mt-2 max-w-[820px] text-[36px] font-black leading-[1] sm:text-[52px] lg:text-[66px]">
                  {categoryName}
                </h1>
                <p className="mt-3 max-w-[620px] text-[14px] font-semibold leading-6 text-white/84 sm:text-[16px] sm:leading-7">
                  {isKnownCategory
                    ? `Browse trusted ${categoryName.toLowerCase()} businesses in Kozhikode with live search, sorting, and curated marketplace signals.`
                    : "This category is not in the local catalog yet. Browse available categories or return to all marketplace listings."}
                </p>
                <form action={`/category/${encodeURIComponent(slug)}`} className="mt-5 flex max-w-[760px] items-center rounded-[17px] bg-white p-1.5 shadow-[0_18px_36px_rgba(0,0,0,0.26)] sm:mt-7 sm:p-2">
                  <Search className="ml-3 h-5 w-5 shrink-0 text-[#8ea0bd] sm:ml-4 sm:h-6 sm:w-6" />
                  <input
                    name="q"
                    defaultValue={data.filters.query}
                    className="min-w-0 flex-1 bg-transparent px-3 text-[13px] font-semibold text-[#102c61] outline-none placeholder:text-[#71809b] sm:px-5 sm:text-[15px]"
                    placeholder={`Search ${isKnownCategory ? categoryName.toLowerCase() : "this category"}`}
                  />
                  {data.filters.sort && data.filters.sort !== "default" ? <input type="hidden" name="sort" value={data.filters.sort} /> : null}
                  {data.filters.featured ? <input type="hidden" name="featured" value="true" /> : null}
                  {data.filters.popular ? <input type="hidden" name="popular" value="true" /> : null}
                  <button className="rounded-[13px] bg-[#f5b625] px-5 py-3 text-[13px] font-black text-[#08285f] transition hover:bg-[#ffd05a] sm:rounded-[14px] sm:px-9 sm:py-4 sm:text-[15px]">
                    Search
                  </button>
                </form>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-[18px] border border-white/12 bg-white/8 p-3 text-center shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                <StatPill value={String(resultCount)} label="Results" />
                <StatPill value={String(data.featured.length)} label="Featured" />
                <StatPill value={String(data.popular.length)} label="Popular" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 pb-24 pt-5 sm:px-5 sm:pb-14 md:px-10">
        <SectionTitle title="Browse categories" />
        <CategoryRail categories={categoryCards} compact />

        {categoryItems.length > 0 ? (
          <>
            <SectionTitle title={`Explore ${categoryName}`} />
            <CategoryItemGrid categorySlug={slug} items={categoryItems} />
          </>
        ) : null}

        <section id="category-results" className="mt-7 scroll-mt-24 sm:mt-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[22px] font-black leading-tight text-[#0b2f74] sm:text-[25px]">
                {isKnownCategory ? `${categoryName} businesses` : "No category found"}
              </h2>
              <p className="mt-1 text-[13px] font-semibold text-[#71809b]">
                {resultCount} result{resultCount === 1 ? "" : "s"}
                {data.filters.query ? ` for "${data.filters.query}"` : ""} in Kozhikode
              </p>
            </div>
            {hasActiveFilters ? (
              <Link href={baseHref} className="inline-flex w-fit rounded-full border border-[#cbd7ea] bg-white px-4 py-2 text-[12px] font-black text-[#0b2f74]">
                Clear filters
              </Link>
            ) : null}
          </div>

          <div className="-mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-4 sm:flex-wrap sm:gap-3 sm:px-0">
            {sortOptions.map((item) => (
              <Link
                key={item.sort}
                href={categoryListingHref(slug, data.filters, { sort: item.sort, featured: null, popular: null })}
                className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black sm:px-5 sm:py-2.5 sm:text-[12px] ${
                  selectedSort === item.sort
                    ? "border-[#0b2f74] bg-[#0b2f74] text-white"
                    : "border-[#dfe6f2] bg-white text-[#405474]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {flagOptions.map((item) => (
              <Link
                key={item.label}
                href={categoryListingHref(slug, data.filters, item.overrides)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black sm:px-5 sm:py-2.5 sm:text-[12px] ${
                  selectedFlag === item.value
                    ? "border-[#0b2f74] bg-[#0b2f74] text-white"
                    : "border-[#dfe6f2] bg-white text-[#405474]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {shopCards.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {shopCards.map((shop) => (
                <ShopGridCard key={shop.slug ?? `${shop.name}-${shop.distance}`} shop={shop} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={isKnownCategory ? "No listings found" : "Category not available"}
              text={
                isKnownCategory
                  ? "Try a broader search, remove featured or popular filters, or sort by best match."
                  : "Use the category browser above or return to the marketplace homepage."
              }
              actionLabel={isKnownCategory ? "Clear filters" : "View all listings"}
              href={isKnownCategory ? baseHref : "/#all-shops"}
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export function BusinessDetailPage({
  business,
  related,
  reviewData,
  reviewNotice,
}: {
  business: CatalogBusinessData;
  related: CatalogBusinessData[];
  reviewData: {
    summary: ReviewSummaryData | null;
    reviews: CatalogReviewData[];
  };
  reviewNotice?: {
    status: string;
    message: string;
  };
}) {
  const primaryImage = coverImageForBusiness(business);
  const relatedCards = buildShopCards(
    related.filter((item) => item.slug !== business.slug),
    [],
    0,
  );
  const badges = [
    business.flags.featured ? "Featured" : null,
    business.flags.popular ? "Popular" : null,
    business.badge.text,
  ].filter(Boolean);
  const addressLines = [
    business.location.addressLine,
    business.location.landmark,
    business.location.area,
    business.location.city,
  ].filter(Boolean);
  const websiteHref = normalizeWebsiteHref(business.contact.website);
  const directionsHref = directionsHrefForBusiness(business);
  const whatsappHref = business.contact.whatsapp
    ? `https://wa.me/${business.contact.whatsapp.replace(/\D/g, "")}`
    : "";
  const cardHref = `/business-card/${encodeURIComponent(business.slug)}`;
  const services = business.tags.length > 0 ? business.tags.slice(0, 8) : [business.category.name, business.subtitle];
  const reviewSummary = reviewData.summary ?? {
    average: business.rating.score,
    total: business.rating.reviewCount,
    approvedTotal: business.rating.moderatedCount ?? 0,
    breakdown: business.rating.breakdown ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="bg-[radial-gradient(circle_at_18%_12%,#164caa,#082d75_48%,#061f55_100%)]">
          <div className="mx-auto grid max-w-[1800px] gap-6 px-4 pb-8 pt-5 sm:px-5 sm:pb-10 sm:pt-7 md:px-10 lg:grid-cols-[1fr_520px] lg:items-end">
            <div>
              <Link href={`/category/${business.category.slug}`} className="inline-flex items-center gap-2 text-[12px] font-black text-white/78 transition hover:text-white">
                <ChevronRight className="h-4 w-4 rotate-180" />
                {business.category.name}
              </Link>
              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span key={badge} className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-black text-white">
                    {badge}
                  </span>
                ))}
              </div>
              <h1 className="mt-3 max-w-[820px] text-[36px] font-black leading-[1] sm:text-[52px] lg:text-[66px]">
                {business.name}
              </h1>
              <p className="mt-3 max-w-[660px] text-[14px] font-semibold leading-6 text-white/84 sm:text-[16px] sm:leading-7">
                {business.description || business.subtitle}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-[12px] font-semibold text-white/84 sm:text-[14px]">
                {business.trust.verified ? <HeroChip icon={<BadgeCheck className="h-5 w-5 text-[#f5b625]" />} text="Verified business" /> : null}
                <HeroChip icon={<Star className="h-5 w-5 fill-[#f5b625] text-[#f5b625]" />} text={`${formatRating(reviewSummary.average ?? business.rating.score)} rating`} />
                <HeroChip icon={<Store className="h-5 w-5 text-[#f5b625]" />} text={`${reviewSummary.total ?? business.rating.reviewCount} reviews`} />
                <HeroChip icon={<MapPin className="h-5 w-5 text-[#f5b625]" />} text={`${formatDistance(business.location.distanceKm)} km away`} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {business.contact.phone ? (
                  <AnalyticsLink businessSlug={business.slug} eventType="call_click" source="business_detail_hero" href={`tel:${business.contact.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 rounded-full bg-[#f5b625] px-5 py-3 text-[13px] font-black text-[#08285f]">
                    <Phone className="h-4 w-4" />
                    Call now
                  </AnalyticsLink>
                ) : null}
                {whatsappHref ? (
                  <AnalyticsLink businessSlug={business.slug} eventType="whatsapp_click" source="business_detail_hero" href={whatsappHref} className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 py-3 text-[13px] font-black text-white">
                    <Smartphone className="h-4 w-4" />
                    WhatsApp
                  </AnalyticsLink>
                ) : null}
                <AnalyticsLink businessSlug={business.slug} eventType="business_card_share_click" source="business_detail_hero" href={cardHref} className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 py-3 text-[13px] font-black text-white">
                  <Share2 className="h-4 w-4" />
                  Share card
                </AnalyticsLink>
              </div>
            </div>
            <div className="overflow-hidden rounded-[18px] border border-white/12 bg-white/10 p-2 shadow-[0_22px_48px_rgba(0,0,0,0.22)]">
              <div className="h-[230px] rounded-[14px] bg-slate-100 sm:h-[320px]">
                <ImageFill src={primaryImage} darken />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1800px] gap-5 px-4 pb-24 pt-5 sm:px-5 sm:pb-14 md:px-10 lg:grid-cols-[1fr_380px]">
        <div>
          <section className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_25px_rgba(11,47,116,0.06)] sm:p-6">
            <h2 className="text-[22px] font-black text-[#0b2f74]">About</h2>
            <p className="mt-3 text-[14px] font-semibold leading-7 text-[#596a82]">
              {business.description || `${business.name} is listed under ${business.category.name} in Kozhikode.`}
            </p>
            {business.tags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {business.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#edf3ff] px-3 py-1.5 text-[11px] font-black text-[#0b2f74]">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="mt-5 rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_25px_rgba(11,47,116,0.06)] sm:p-6">
            <h2 className="text-[22px] font-black text-[#0b2f74]">Services and products</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {services.map((service) => (
                <span key={service} className="rounded-full bg-[#edf3ff] px-3 py-1.5 text-[12px] font-black text-[#0b2f74]">
                  {service}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_25px_rgba(11,47,116,0.06)] sm:p-6">
            <h2 className="text-[22px] font-black text-[#0b2f74]">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {business.gallery.slice(0, 6).map((image) => (
                <div key={image} className="aspect-[4/3] overflow-hidden rounded-[13px] bg-[#edf3ff]">
                  <ImageFill src={image} />
                </div>
              ))}
            </div>
          </section>

          <ReviewsSection
            business={business}
            reviews={reviewData.reviews}
            summary={reviewSummary}
            notice={reviewNotice}
          />

          <section className="mt-5 rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_25px_rgba(11,47,116,0.06)] sm:p-6">
            <h2 className="text-[22px] font-black text-[#0b2f74]">Location</h2>
            <div className="mt-4 flex gap-3 rounded-[14px] bg-[#f3f6fb] p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0b2f74]" />
              <div>
                <p className="text-[14px] font-black text-[#0b2f74]">
                  {business.location.area}, {business.location.city}
                </p>
                <p className="mt-1 text-[13px] font-semibold leading-6 text-[#596a82]">
                  {addressLines.join(", ")}
                </p>
              </div>
            </div>
            <AnalyticsLink businessSlug={business.slug} eventType="route_click" source="business_detail_location" href={directionsHref} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0b2f74] px-4 py-2.5 text-[12px] font-black text-white">
              <MapPin className="h-4 w-4" />
              Open directions
            </AnalyticsLink>
          </section>

          {relatedCards.length > 0 ? (
            <section className="mt-7">
              <SectionTitle title={`More in ${business.category.name}`} compact />
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {relatedCards.slice(0, 4).map((shop) => (
                  <ShopGridCard key={shop.slug ?? `${shop.name}-${shop.distance}`} shop={shop} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <section className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_25px_rgba(11,47,116,0.06)]">
            <h2 className="text-[19px] font-black text-[#0b2f74]">Contact</h2>
            <div className="mt-4 space-y-3">
              {business.contact.phone ? (
                <ContactRow icon={<Phone className="h-4 w-4" />} label="Phone" value={business.contact.phone} href={`tel:${business.contact.phone.replace(/\s+/g, "")}`} businessSlug={business.slug} eventType="call_click" source="business_detail_contact" />
              ) : null}
              {business.contact.whatsapp ? (
                <ContactRow icon={<Smartphone className="h-4 w-4" />} label="WhatsApp" value={business.contact.whatsapp} href={whatsappHref} businessSlug={business.slug} eventType="whatsapp_click" source="business_detail_contact" />
              ) : null}
              {business.contact.email ? (
                <ContactRow icon={<Mail className="h-4 w-4" />} label="Email" value={business.contact.email} href={`mailto:${business.contact.email}`} />
              ) : null}
              {websiteHref ? (
                <ContactRow icon={<Globe2 className="h-4 w-4" />} label="Website" value={business.contact.website} href={websiteHref} />
              ) : null}
            </div>
          </section>

          <section className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_25px_rgba(11,47,116,0.06)]">
            <h2 className="text-[19px] font-black text-[#0b2f74]">Payments</h2>
            <div className="mt-4 rounded-[14px] bg-[#f3f6fb] p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-[12px] bg-white text-[#0b2f74]">
                  <QrCode className="h-8 w-8" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#71809b]">UPI ID</p>
                  <p className="truncate text-[14px] font-black text-[#0b2f74]">
                    {business.payment.upiId || "Ask business for UPI"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[12px] font-semibold leading-5 text-[#596a82]">
                Supports PhonePe, Google Pay, Paytm, BHIM, and other UPI apps.
              </p>
              {business.payment.upiId ? (
                <AnalyticsLink businessSlug={business.slug} eventType="upi_click" source="business_detail_payment" href={`upi://pay?pa=${encodeURIComponent(business.payment.upiId)}&pn=${encodeURIComponent(business.name)}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f5b625] px-4 py-2.5 text-[12px] font-black text-[#08285f]">
                  <WalletCards className="h-4 w-4" />
                  Pay with UPI
                </AnalyticsLink>
              ) : null}
            </div>
          </section>

          <section className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_25px_rgba(11,47,116,0.06)]">
            <h2 className="text-[19px] font-black text-[#0b2f74]">Trust and hours</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-[13px] bg-[#f3f6fb] px-3 py-3">
                <BadgeCheck className="h-5 w-5 text-[#25a451]" />
                <span className="text-[13px] font-black text-[#0b2f74]">
                  {business.trust.verified ? "Verified by BNC" : "Verification pending"}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-[13px] bg-[#f3f6fb] px-3 py-3">
                <Clock3 className="h-5 w-5 text-[#f5b625]" />
                <span className="text-[13px] font-black text-[#0b2f74]">
                  {business.hours || "Opening hours not updated"}
                </span>
              </div>
              <AnalyticsLink businessSlug={business.slug} eventType="business_card_share_click" source="business_detail_trust" href={cardHref} className="flex items-center gap-3 rounded-[13px] border border-[#e3e9f4] px-3 py-3 text-[#0b2f74]">
                <WalletCards className="h-5 w-5" />
                <span className="text-[13px] font-black">Open digital business card</span>
              </AnalyticsLink>
            </div>
          </section>

          <section className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_25px_rgba(11,47,116,0.06)]">
            <h2 className="text-[19px] font-black text-[#0b2f74]">Marketplace Signals</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard label="Rating" value={formatRating(reviewSummary.average ?? business.rating.score)} />
              <StatCard label="Reviews" value={String(reviewSummary.total ?? business.rating.reviewCount)} />
              <StatCard label="Distance" value={`${formatDistance(business.location.distanceKm)} km`} />
              <StatCard label="Category" value={business.category.name} />
            </div>
          </section>
        </aside>
      </main>

      <Footer />
    </div>
  );
}

function ReviewsSection({
  business,
  reviews,
  summary,
  notice,
}: {
  business: CatalogBusinessData;
  reviews: CatalogReviewData[];
  summary: NonNullable<ReviewSummaryData>;
  notice?: {
    status: string;
    message: string;
  };
}) {
  const totalForBars = Math.max(1, summary.approvedTotal);
  const submitted = notice?.status === "submitted";
  const error = notice?.status === "error";

  return (
    <section id="reviews" className="mt-5 scroll-mt-24 rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_25px_rgba(11,47,116,0.06)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[22px] font-black text-[#0b2f74]">Customer reviews</h2>
          <p className="mt-2 max-w-[620px] text-[13px] font-semibold leading-6 text-[#596a82]">
            Reviews are checked by BNC/Nearu before they appear publicly.
          </p>
        </div>
        <div className="rounded-[14px] bg-[#fff7dd] px-4 py-3 text-[#0b2f74]">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-[#f5b625] text-[#f5b625]" />
            <span className="text-[24px] font-black leading-none">{formatRating(summary.average)}</span>
          </div>
          <p className="mt-1 text-[12px] font-black text-[#71809b]">
            {summary.total} review{summary.total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="rounded-[14px] border border-[#edf0f6] bg-[#f8fbff] p-4">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = summary.breakdown[rating as keyof typeof summary.breakdown] ?? 0;
            const width = `${Math.round((count / totalForBars) * 100)}%`;

            return (
              <div key={rating} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-center justify-between text-[12px] font-black text-[#0b2f74]">
                  <span>{rating} star</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#f5b625,#0f766e)]" style={{ width }} />
                </div>
              </div>
            );
          })}
        </div>

        <div>
          {submitted ? (
            <div className="mb-4 rounded-[14px] border border-[#ccebd6] bg-[#effaf2] px-4 py-3 text-[13px] font-bold text-[#1f7a35]">
              Thanks for the review. It is pending moderation and will appear after approval.
            </div>
          ) : null}
          {error ? (
            <div className="mb-4 rounded-[14px] border border-[#ffd8d8] bg-[#fff4f4] px-4 py-3 text-[13px] font-bold text-[#b42323]">
              {notice?.message || "Review could not be submitted."}
            </div>
          ) : null}

          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.slice(0, 6).map((review) => (
                <article key={review.id} className="rounded-[14px] border border-[#edf0f6] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#edf3ff] text-[13px] font-black text-[#0b2f74]">
                      {review.customer.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[14px] font-black text-[#0b2f74]">{review.customer.name}</h3>
                      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#71809b]">
                        Verified customer
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-[#fff7dd] px-3 py-1 text-[12px] font-black text-[#0b2f74]">
                      <Star className="h-3.5 w-3.5 fill-[#f5b625] text-[#f5b625]" />
                      {review.rating}
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] font-semibold leading-6 text-[#596a82]">{review.text}</p>
                  {review.featured ? (
                    <span className="mt-3 inline-flex rounded-full bg-[#ecf6ef] px-3 py-1 text-[11px] font-black text-[#1f7a35]">
                      Featured review
                    </span>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No public reviews yet"
              text="Be the first customer to share a helpful review for this business."
              compact
            />
          )}
        </div>
      </div>

      <form action={submitBusinessReview} className="mt-5 rounded-[14px] border border-[#edf0f6] bg-[#fffdf7] p-4">
        <input type="hidden" name="businessSlug" value={business.slug} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <h3 className="text-[17px] font-black text-[#0b2f74]">Write a Review</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="customerName" required maxLength={80} placeholder="Your name" className="rounded-[12px] border border-[#dfe6f2] px-4 py-3 text-[13px] font-semibold text-[#0b2f74] outline-none focus:border-[#f5b625]" />
          <input name="customerEmail" type="email" maxLength={120} placeholder="Email optional" className="rounded-[12px] border border-[#dfe6f2] px-4 py-3 text-[13px] font-semibold text-[#0b2f74] outline-none focus:border-[#f5b625]" />
          <input name="customerPhone" maxLength={30} placeholder="Phone optional" className="rounded-[12px] border border-[#dfe6f2] px-4 py-3 text-[13px] font-semibold text-[#0b2f74] outline-none focus:border-[#f5b625]" />
          <select name="rating" required defaultValue="5" className="rounded-[12px] border border-[#dfe6f2] px-4 py-3 text-[13px] font-black text-[#0b2f74] outline-none focus:border-[#f5b625]">
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} star{rating === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          <textarea name="text" required minLength={10} maxLength={800} rows={4} placeholder="Share what went well, what you bought, or how the service was." className="rounded-[12px] border border-[#dfe6f2] px-4 py-3 text-[13px] font-semibold text-[#0b2f74] outline-none focus:border-[#f5b625] md:col-span-2" />
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] font-semibold leading-5 text-[#71809b]">
            Submitted reviews stay pending until an admin approves them.
          </p>
          <button className="rounded-full bg-[#f5b625] px-5 py-3 text-[13px] font-black text-[#08285f]">
            Submit review
          </button>
        </div>
      </form>
    </section>
  );
}

function HeroChip({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[14px] bg-white/10 px-2 py-3">
      <div className="text-[20px] font-black leading-none text-[#f5b625] sm:text-[24px]">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-black uppercase tracking-[0.08em] text-white/72">
        {label}
      </div>
    </div>
  );
}

function GiftIcon() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-[4px] border-2 border-[#ffd166] text-[10px] font-black text-[#ffd166]">
      +
    </span>
  );
}

function HeroScene() {
  return (
    <div className="relative mx-auto hidden h-[270px] w-full max-w-[700px] sm:block lg:h-[330px]">
      <div className="absolute inset-x-0 bottom-0 h-[240px] opacity-60">
        <div className="absolute bottom-0 left-0 h-[132px] w-[78px] rounded-t-[12px] bg-[#0b5f68]" />
        <div className="absolute bottom-0 left-[92px] h-[180px] w-[92px] rounded-t-[12px] bg-[#0f766e]" />
        <div className="absolute bottom-0 left-[200px] h-[220px] w-[118px] rounded-t-[12px] bg-[#1c8b7f]" />
        <div className="absolute bottom-0 right-[156px] h-[186px] w-[104px] rounded-t-[12px] bg-[#0f766e]" />
        <div className="absolute bottom-0 right-[54px] h-[145px] w-[76px] rounded-t-[12px] bg-[#d85a2a]" />
        <div className="absolute bottom-[12px] left-[18px] h-5 w-5 rounded-full bg-white/10" />
      </div>
      <div className="absolute bottom-1 left-1/2 h-[50px] w-[420px] -translate-x-1/2 rounded-full bg-[#063e49]/70 blur-[2px]" />
      <div className="absolute bottom-0 left-1/2 h-[146px] w-[230px] -translate-x-1/2 rounded-t-[24px] bg-[#08285f]">
        <div className="absolute left-1/2 top-[-44px] h-[76px] w-[250px] -translate-x-1/2 overflow-hidden rounded-t-[28px] bg-[#0f766e]">
          <div className="absolute inset-x-0 bottom-0 flex h-[70px]">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={`flex-1 rounded-b-[18px] ${index % 2 === 0 ? "bg-white" : "bg-[#ffd166]"}`}
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-[34px] h-[96px] w-[76px] rounded-t-[16px] bg-white/95" />
        <div className="absolute bottom-0 right-[34px] h-[96px] w-[76px] rounded-t-[16px] bg-white/95" />
        <div className="absolute bottom-0 left-1/2 h-[112px] w-[62px] -translate-x-1/2 rounded-t-[18px] bg-[#e85d2a]" />
      </div>
      <div className="absolute bottom-[145px] left-1/2 h-[128px] w-[128px] -translate-x-1/2 rounded-full border-[26px] border-[#ffd166]" />
      <div className="absolute bottom-[92px] left-1/2 h-[100px] w-[34px] -translate-x-1/2 rounded-b-full bg-[#e85d2a]" />
      <Person className="absolute bottom-[8px] left-[118px]" />
      <Person className="absolute bottom-[8px] right-[76px]" flip />
      <div className="absolute right-0 top-0 grid grid-cols-7 gap-3 opacity-35">
        {Array.from({ length: 35 }).map((_, index) => (
          <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#ffd166]" />
        ))}
      </div>
      <div className="absolute left-20 top-12 h-8 w-24 rounded-full bg-white/10" />
      <div className="absolute right-28 top-22 h-7 w-20 rounded-full bg-white/10" />
    </div>
  );
}

function Person({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div className={`${className} ${flip ? "scale-x-[-1]" : ""} h-[98px] w-[42px]`}>
      <div className="mx-auto h-5 w-5 rounded-full bg-[#ffc66f]" />
      <div className="mx-auto mt-1 h-11 w-5 rounded-full bg-[#f5b625]" />
      <div className="mx-auto mt-0 flex w-7 justify-between">
        <span className="h-10 w-2 rounded-full bg-[#092f78]" />
        <span className="h-10 w-2 rounded-full bg-[#092f78]" />
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  action,
  actionHref = "#all-shops",
  compact = false,
}: {
  title: string;
  action?: string;
  actionHref?: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "mt-0" : "mt-7 sm:mt-9"} mb-3 sm:mb-4`}>
      <span className="hidden h-8 w-1.5 rounded-full bg-[linear-gradient(180deg,#e85d2a,#ffd166)] sm:block" />
      <h2 className="text-[21px] font-black leading-tight text-[#0b2f74] sm:text-[23px]">{title}</h2>
      {action ? (
        <Link className="ml-auto inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[#f4dfb9] bg-white/80 px-3 py-2 text-[12px] font-black text-[#0b2f74] shadow-[0_8px_18px_rgba(11,47,116,0.05)] transition hover:border-[#ffd166] sm:text-[13px]" href={actionHref}>
          {action}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function CategoryRail({
  categories,
  compact = false,
}: {
  categories: CategoryTile[];
  compact?: boolean;
}) {
  const selectedSlug = categories.find((item) => item.isActive)?.slug;

  return (
    <div
      className={`-mx-4 grid auto-cols-[132px] grid-flow-col gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid-flow-row sm:grid-cols-3 sm:px-0 md:grid-cols-5 ${
        compact ? "xl:grid-cols-7" : "xl:grid-cols-9"
      }`}
    >
      {categories.map((item) => (
        <CategoryCard key={item.slug} item={{ ...item, isActive: selectedSlug === item.slug }} />
      ))}
    </div>
  );
}

function CategoryCard({ item }: { item: CategoryTile }) {
  const Icon = item.icon;
  const active = item.isActive;

  return (
    <Link
      href={item.href ?? `/category/${encodeURIComponent(item.slug)}`}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-[124px] snap-start flex-col items-center justify-center rounded-[16px] border px-3 py-4 text-center shadow-[0_10px_24px_rgba(11,47,116,0.05)] transition duration-200 sm:min-h-[138px] sm:rounded-[14px] sm:px-4 sm:py-5 ${
        active
          ? "border-[#08285f] bg-[linear-gradient(135deg,#08285f,#0f766e)] text-white shadow-[0_16px_32px_rgba(15,118,110,0.18)]"
          : "border-[#f2dfbf] bg-white/90 hover:-translate-y-0.5 hover:border-[#ffd166] hover:shadow-[0_14px_30px_rgba(232,93,42,0.10)]"
      }`}
    >
      <div
        className="grid h-14 w-14 place-items-center rounded-[16px] transition sm:h-[60px] sm:w-[60px] sm:rounded-[18px]"
        style={{
          color: active ? "#ffffff" : item.color,
          backgroundColor: active ? "rgba(255,255,255,0.16)" : item.tint,
        }}
      >
        <Icon className="h-7 w-7 sm:h-[30px] sm:w-[30px]" />
      </div>
      <div
        className={`mt-3 flex min-h-[34px] items-center text-[12px] font-black leading-tight sm:text-[13px] ${
          active ? "text-white" : "text-[#0b2f74]"
        }`}
      >
        {item.label}
      </div>
    </Link>
  );
}

function CategoryItemGrid({
  categorySlug,
  items,
}: {
  categorySlug: string;
  items: CategoryItemPageData[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.slug}
          href={`/category/${encodeURIComponent(categorySlug)}/${encodeURIComponent(item.slug)}`}
          className="group overflow-hidden rounded-[16px] border border-[#dfe6f2] bg-white shadow-[0_12px_28px_rgba(11,47,116,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(11,47,116,0.10)]"
        >
          <div className="relative h-[160px] bg-slate-100">
            <div className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-[1.03]" style={{ backgroundImage: `url(${item.image})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/46 via-black/8 to-transparent" />
            <span className="absolute left-3 top-3 rounded-full bg-[#f5b625] px-3 py-1 text-[11px] font-black text-[#08285f]">
              {item.badge}
            </span>
            <h3 className="absolute bottom-3 left-3 right-3 text-[21px] font-black leading-tight text-white">
              {item.name}
            </h3>
          </div>
          <div className="p-4">
            <p className="line-clamp-2 text-[13px] font-semibold leading-6 text-[#596a82]">{item.text}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.highlights.slice(0, 3).map((highlight) => (
                <span key={highlight} className="rounded-full bg-[#edf3ff] px-3 py-1 text-[11px] font-black text-[#0b2f74]">
                  {highlight}
                </span>
              ))}
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-black text-[#0b2f74]">
              Open page
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ShopRail({
  shops,
  emptyTitle,
  emptyText,
}: {
  shops: ShopCardData[];
  emptyTitle: string;
  emptyText: string;
}) {
  if (shops.length === 0) {
    return <EmptyState title={emptyTitle} text={emptyText} compact />;
  }

  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:px-0 xl:grid-cols-5">
      {shops.map((shop) => (
        <FeaturedShop key={shop.slug ?? shop.name} shop={shop} />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  text,
  actionLabel,
  href,
  compact = false,
}: {
  title: string;
  text: string;
  actionLabel?: string;
  href?: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[16px] border border-dashed border-[#f2cf8f] bg-white/88 text-center shadow-[0_10px_22px_rgba(11,47,116,0.04)] ${compact ? "px-4 py-6" : "mt-5 px-5 py-10"}`}>
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#fff0cf] text-[#e85d2a]">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-[16px] font-black text-[#0b2f74]">{title}</h3>
      <p className="mx-auto mt-1 max-w-[420px] text-[13px] font-semibold leading-5 text-[#71809b]">
        {text}
      </p>
      {actionLabel && href ? (
        <Link href={href} className="mt-4 inline-flex rounded-full bg-[#ffd166] px-5 py-2.5 text-[13px] font-black text-[#08285f]">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function SpotlightDeal({ deal }: { deal: SpotlightDealData }) {
  const badge = deal.badge.includes("599") ? "\u20b9599" : deal.badge;

  return (
    <Link href={`/deals/${deal.slug}`} className="block w-[292px] shrink-0 snap-start overflow-hidden rounded-[15px] border border-white/70 shadow-[0_16px_34px_rgba(232,93,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(15,118,110,0.15)] md:w-auto" style={{ background: deal.gradient }}>
      <div className="flex min-h-[132px] items-center gap-3 px-3 py-3 md:min-h-[184px] md:gap-4 md:px-5 md:py-4">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full px-3 py-1 text-[12px] font-black leading-none text-white md:px-4 md:py-1.5 md:text-[16px]" style={{ backgroundColor: deal.badgeColor }}>
            {badge}
          </span>
          <h3 className="mt-2 text-[15px] font-black leading-tight text-[#0b2f74] md:mt-3 md:text-[18px]">{deal.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-[11.5px] font-semibold leading-4 text-[#596a82] md:mt-2 md:text-[13px] md:leading-5">{deal.text}</p>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#0b2f74]/70">{deal.items.length} items</p>
          <div className="mt-3 hidden min-w-0 items-center gap-2 text-[12px] font-black text-[#0b2f74] md:flex">
            <span className="h-6 w-6 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${deal.image})` }} />
            <span className="truncate">{deal.shop}</span>
          </div>
        </div>
        <div className="h-[100px] w-[112px] shrink-0 overflow-hidden rounded-[12px] bg-white/40 md:h-[136px] md:w-[150px]">
          <ImageFill src={deal.image} />
        </div>
      </div>
    </Link>
  );
}

function FeaturedShop({ shop }: { shop: ShopCardData }) {
  const detailHref = shop.slug ? `/business/${encodeURIComponent(shop.slug)}` : undefined;

  return (
    <article data-motion="card" className="relative flex w-[248px] shrink-0 snap-start flex-col overflow-hidden rounded-[14px] border border-[#f1dfbf] bg-white shadow-[0_14px_30px_rgba(11,47,116,0.07)] transition hover:-translate-y-0.5 hover:border-[#ffd166] hover:shadow-[0_18px_38px_rgba(232,93,42,0.11)] md:w-auto">
      {detailHref ? (
        <Link href={detailHref} aria-label={`View ${shop.name}`} className="absolute inset-0 z-[1]" />
      ) : null}
      <ShopImage image={shop.image} badge={shop.badge} badgeColor={shop.badgeColor} height="h-[128px] md:h-[150px]" />
      <ShopBody shop={shop} />
    </article>
  );
}

function OfferCard({ offer }: { offer: TopOfferData }) {
  const title = offer.title.includes("599") ? "\u20b9599 Offer" : offer.title;

  return (
    <Link href={`/offers/${offer.slug}`} className="relative block h-[128px] w-[236px] shrink-0 snap-start overflow-hidden rounded-[15px] p-4 text-white shadow-[0_16px_34px_rgba(11,47,116,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(15,118,110,0.16)] md:h-[142px] md:w-auto md:p-5" style={{ background: offer.gradient }}>
      <div className="relative z-10 max-w-[160px] md:max-w-[190px]">
        <h3 className="text-[22px] font-black leading-none md:text-[28px]">{title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[11.5px] font-bold leading-4 text-white/86 md:mt-2 md:text-[13px] md:leading-5">{offer.text}</p>
        <div className="mt-3 text-[12px] font-black text-white/90">{offer.shop}</div>
        <div className="mt-2 inline-flex rounded-[6px] bg-white/18 px-2 py-1 text-[10px] font-black md:px-2.5 md:text-[11px]">
          Use Code: {offer.code}
        </div>
      </div>
      <div className="absolute bottom-0 right-0 h-[112px] w-[118px] overflow-hidden rounded-tl-[20px] md:h-[132px] md:w-[142px]">
        <ImageFill src={offer.image} />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/12" />
      </div>
    </Link>
  );
}

function ShopGridCard({ shop }: { shop: ShopCardData }) {
  const detailHref = shop.slug ? `/business/${encodeURIComponent(shop.slug)}` : undefined;

  return (
    <article data-motion="card" className="relative flex h-full flex-col overflow-hidden rounded-[14px] border border-[#f1dfbf] bg-white shadow-[0_14px_30px_rgba(11,47,116,0.06)] transition hover:-translate-y-0.5 hover:border-[#ffd166] hover:shadow-[0_18px_38px_rgba(232,93,42,0.10)]">
      {detailHref ? (
        <Link href={detailHref} aria-label={`View ${shop.name}`} className="absolute inset-0 z-[1]" />
      ) : null}
      <ShopImage image={shop.image} badge={shop.badge} badgeColor={shop.badgeColor} ribbon={shop.ribbon} height="h-[118px] sm:h-[140px]" />
      <ShopBody shop={shop} dense />
    </article>
  );
}

function ShopImage({ image, badge, badgeColor, ribbon, height }: { image: string; badge: string; badgeColor: string; ribbon?: string; height: string }) {
  return (
    <div className={`relative ${height} bg-[#fff0cf]`}>
      <ImageFill src={image} darken />
      <span className="absolute left-2 top-2 rounded-[6px] px-2 py-0.5 text-[9.5px] font-black text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]" style={{ backgroundColor: badgeColor }}>
        {badge}
      </span>
      {ribbon ? (
        <span className="absolute right-2 top-2 rounded-[6px] bg-[#d94842] px-2 py-0.5 text-[9.5px] font-black text-white sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
          {ribbon}
        </span>
      ) : null}
      <button className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/22 text-white ring-1 ring-white/30 backdrop-blur sm:right-3 sm:top-3 sm:h-8 sm:w-8">
        <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  );
}

function ShopBody({ shop, dense = false }: { shop: ShopCardData; dense?: boolean }) {
  const detailHref = shop.slug ? `/business/${encodeURIComponent(shop.slug)}` : undefined;
  const phoneHref = shop.phone ? `tel:${shop.phone.replace(/[^\d+]/g, "")}` : undefined;

  return (
    <div className={`flex flex-1 flex-col ${dense ? "px-3 py-3" : "px-3.5 py-3.5 sm:px-4 sm:py-4"}`}>
      <div className="min-w-0">
        <h3 className={`${dense ? "text-[14px]" : "text-[15px]"} truncate font-black leading-tight text-[#0b2f74]`}>{shop.name}</h3>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          <span className="truncate text-[12px] font-black text-[#405474]">{shop.category}</span>
          {shop.area ? <span className="hidden truncate text-[11.5px] font-semibold text-[#71809b] sm:inline">• {shop.area}</span> : null}
        </div>
        {shop.description ? (
          <p className={`${dense ? "line-clamp-2" : "line-clamp-2"} mt-2 text-[12px] font-semibold leading-5 text-[#62718d]`}>
            {shop.description}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-[#71809b]">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-[#f5b625] text-[#f5b625]" />
          <span className="font-black text-[#0b2f74]">{shop.rating}</span>
          <span>({shop.reviews})</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-[#f5b625]" />
          {shop.distance}
        </span>
      </div>

      <div className="relative z-10 mt-auto grid grid-cols-3 gap-2 pt-3">
        {detailHref ? (
          <Link href={detailHref} className="inline-flex items-center justify-center gap-1 rounded-full bg-[#ffd166] px-2 py-2 text-center text-[11px] font-black text-[#08285f] transition hover:bg-[#ffe08f]">
            Open
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center gap-1 rounded-full bg-[#edf3ff] px-2 py-2 text-center text-[11px] font-black text-[#71809b]">
            Open
          </span>
        )}
        {phoneHref ? (
          <AnalyticsLink businessSlug={shop.slug ?? ""} eventType="call_click" source="listing_card" href={phoneHref} className="inline-flex items-center justify-center gap-1 rounded-full border border-[#f1dfbf] bg-white px-2 py-2 text-[11px] font-black text-[#0b2f74] transition hover:border-[#0f766e]">
            <Phone className="h-3.5 w-3.5" />
            Call
          </AnalyticsLink>
        ) : (
          <span className="rounded-full border border-[#edf3ff] px-2 py-2 text-center text-[11px] font-black text-[#9aa8bd]">Call</span>
        )}
        {shop.directionsHref ? (
          <AnalyticsLink businessSlug={shop.slug ?? ""} eventType="route_click" source="listing_card" href={shop.directionsHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 rounded-full border border-[#f1dfbf] bg-white px-2 py-2 text-[11px] font-black text-[#0b2f74] transition hover:border-[#e85d2a]">
            <MapPin className="h-3.5 w-3.5" />
            Route
          </AnalyticsLink>
        ) : (
          <span className="rounded-full border border-[#edf3ff] px-2 py-2 text-center text-[11px] font-black text-[#9aa8bd]">Route</span>
        )}
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  businessSlug,
  eventType,
  source,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  businessSlug?: string;
  eventType?: "call_click" | "whatsapp_click" | "route_click" | "upi_click" | "payment_click" | "business_card_share_click";
  source?: string;
}) {
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf3ff]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-black uppercase tracking-[0.08em] text-[#71809b]">
          {label}
        </span>
        <span className="block truncate text-[13px] font-black text-[#0b2f74]">
          {value}
        </span>
      </span>
    </>
  );

  if (businessSlug && eventType && source) {
    return (
      <AnalyticsLink businessSlug={businessSlug} eventType={eventType} source={source} href={href} className="flex items-center gap-3 rounded-[13px] border border-[#e3e9f4] px-3 py-3 text-[#0b2f74] transition hover:border-[#0b2f74]">
        {content}
      </AnalyticsLink>
    );
  }

  return (
    <a href={href} className="flex items-center gap-3 rounded-[13px] border border-[#e3e9f4] px-3 py-3 text-[#0b2f74] transition hover:border-[#0b2f74]">
      {content}
    </a>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[13px] bg-[#f3f6fb] p-3">
      <div className="truncate text-[15px] font-black text-[#0b2f74]">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#71809b]">
        {label}
      </div>
    </div>
  );
}

function normalizeWebsiteHref(value: string) {
  if (!value) {
    return "";
  }

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function RankedShop({ shop }: { shop: RankedShopData }) {
  return (
    <article className="flex items-center gap-3 rounded-[13px] border border-[#f1dfbf] bg-white p-3 shadow-[0_12px_25px_rgba(11,47,116,0.05)] transition hover:-translate-y-0.5 hover:border-[#ffd166] sm:gap-4 sm:p-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#e85d2a,#ffd166)] text-[15px] font-black text-white sm:h-11 sm:w-11 sm:text-[18px]">
        {shop.rank}
      </div>
      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-[10px] bg-slate-100 sm:h-16 sm:w-24">
        <ImageFill src={shop.image} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[14px] font-black text-[#0b2f74]">{shop.name}</h3>
        <p className="mt-1 truncate text-[12px] font-semibold text-[#71809b]">{shop.category}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] font-semibold text-[#71809b] sm:text-[11px]">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[#f5b625] text-[#f5b625]" />
            {shop.rating} ({shop.reviews})
          </span>
          <span>{shop.distance}</span>
        </div>
      </div>
      <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#f1dfbf] text-[#0b2f74] sm:h-9 sm:w-9">
        <ChevronRight className="h-4 w-4" />
      </button>
    </article>
  );
}

function EcosystemCard({ item }: { item: EcosystemCardData }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} id={item.id} className="group relative flex min-h-[142px] scroll-mt-24 flex-col items-start gap-3 rounded-[13px] border border-[#f1dfbf] bg-white p-3 shadow-[0_10px_22px_rgba(11,47,116,0.05)] transition hover:-translate-y-0.5 hover:border-[#ffd166] hover:shadow-[0_14px_30px_rgba(232,93,42,0.09)] sm:min-h-0 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[#fff0cf] text-[#e85d2a] sm:h-16 sm:w-16">
        <Icon className="h-7 w-7 sm:h-9 sm:w-9" />
      </div>
      <div className="mt-auto min-w-0 flex-1 sm:mt-0">
        <h3 className="text-[14px] font-black text-[#0b2f74] sm:text-[16px]">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-[11.5px] font-semibold leading-4 text-[#71809b] sm:text-[13px] sm:leading-5">{item.text}</p>
      </div>
      <span className="absolute right-3 top-3 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#f1dfbf] text-[#0b2f74] transition group-hover:border-[#0f766e] sm:static sm:h-9 sm:w-9">
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function Footer() {
  const columns = [
    {
      title: "Explore",
      items: [["Star shops", "/featured-shops"], ["Best matches", "/#ranked"], ["Deals", "/deals"], ["All categories", "/#all-shops"]],
    },
    {
      title: "For Businesses",
      items: [["Business Card", "/business-card"], ["List Your Business", "/list-your-business"], ["B2B Network", "/b2b"], ["Plans", "/plans"]],
    },
    {
      title: "Company",
      items: [["About Us", "/about"], ["Contact Us", "/contact"], ["Jobs", "/jobs"], ["Dashboard", "/dashboard"]],
    },
    {
      title: "Support",
      items: [["Help Center", "/help"], ["Terms of Use", "/terms"], ["Privacy Policy", "/privacy"], ["Sitemap", "/sitemap.xml"]],
    },
  ];

  return (
    <footer className="bg-[linear-gradient(135deg,#08285f,#0f766e)] text-white">
      <div className="mx-auto grid max-w-[1800px] gap-10 px-5 py-9 md:px-10 lg:grid-cols-[1.35fr_0.8fr_1fr_0.8fr_0.85fr_1.25fr]">
        <div>
          <div className="flex items-center gap-2 text-[32px] font-black leading-none">
            <MapPin className="h-8 w-8 fill-[#ffd166] text-[#ffd166]" />
            <span>BNC</span>
            <span className="mx-1 text-[18px] text-white/50">|</span>
            <span className="text-[18px] font-black text-white/82">Nearu</span>
          </div>
          <p className="mt-4 max-w-[280px] text-[13px] font-semibold leading-6 text-white/74">
            Your trusted local discovery and business ecosystem in Kozhikode.
          </p>
          <div className="mt-5 flex gap-3">
            {[Store, Sparkles, Search, Monitor].map((Icon) => (
              <span key={Icon.displayName ?? Icon.name} className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h4 className="text-[15px] font-black">{column.title}</h4>
            <ul className="mt-4 space-y-2.5 text-[13px] font-semibold text-white/72">
              {column.items.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="text-[15px] font-black">Stay in the loop</h4>
          <p className="mt-4 max-w-[310px] text-[13px] font-semibold leading-6 text-white/72">
            Get updates on the best deals & offers near you.
          </p>
          <div className="mt-5 flex gap-3">
            <div className="flex-1 rounded-[10px] border border-white/18 px-4 py-3 text-[13px] font-semibold text-white/52">
              Enter your email
            </div>
            <button className="rounded-[10px] bg-[#ffd166] px-6 py-3 text-[13px] font-black text-[#08285f]">
              Subscribe
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-5 py-4 text-[13px] font-semibold text-white/60 md:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div>© 2026 BNC / Nearu. All rights reserved.</div>
          <div className="flex flex-wrap gap-6">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Kozhikode, Kerala
            </span>
            <span>English</span>
            <span>INR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ImageFill({ src, darken = false }: { src: string; darken?: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${src})` }} />
      {darken ? <div className="absolute inset-0 bg-gradient-to-t from-black/38 via-transparent to-black/8" /> : null}
    </div>
  );
}
