import type { ComponentType, ReactNode } from "react";

import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  Cake,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  FileText,
  Grid2X2,
  Heart,
  Home,
  Lightbulb,
  MapPin,
  Monitor,
  Network,
  Search,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Trophy,
  UtensilsCrossed,
  Wrench,
  ShoppingCart,
} from "lucide-react";

type IconType = ComponentType<{ className?: string }>;

type CategoryTile = {
  label: string;
  icon: IconType;
  color: string;
  tint: string;
  isActive?: boolean;
};

type DealCardData = {
  badge: string;
  badgeColor: string;
  title: string;
  text: string;
  shop: string;
  image: string;
  gradient: string;
};

type ShopCardData = {
  name: string;
  category: string;
  rating: string;
  reviews: string;
  distance: string;
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

type OfferCardData = {
  title: string;
  text: string;
  shop: string;
  code: string;
  image: string;
  gradient: string;
};

type EcosystemCardData = {
  id: string;
  title: string;
  text: string;
  icon: IconType;
};

type CatalogCategoryData = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  accent: string;
  isActive: boolean;
};

type CatalogBusinessData = {
  id: string;
  name: string;
  subtitle: string;
  area: string;
  city: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  badgeText: string | null;
  badgeColor: string | null;
  coverVariant: string;
  imageUrl: string;
  category: {
    name: string;
  };
  isFeatured: boolean;
  isPopular: boolean;
};

type CatalogData = {
  categories: CatalogCategoryData[];
  featured: CatalogBusinessData[];
  popular: CatalogBusinessData[];
  all?: CatalogBusinessData[];
  stats: {
    categories: number;
    businesses: number;
    trusted: number;
    happyUsers: string;
  };
};

const navItems = [
  { label: "Discover", href: "#discover" },
  { label: "Business Card", href: "#business-card" },
  { label: "B2B", href: "#b2b" },
  { label: "Jobs", href: "#jobs" },
  { label: "Winner", href: "#winner" },
  { label: "Feed", href: "#feed" },
  { label: "Plans", href: "#plans" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Admin", href: "#admin" },
  { label: "Help", href: "#explanations" },
];

const categoryTiles: CategoryTile[] = [
  { label: "Grocery", icon: ShoppingCart, color: "#f2a715", tint: "#fff6df" },
  { label: "Restaurant", icon: UtensilsCrossed, color: "#0b2f74", tint: "#f3f6fb" },
  { label: "Bakery", icon: Cake, color: "#f2a715", tint: "#fff6df" },
  { label: "Textiles", icon: Shirt, color: "#0b2f74", tint: "#f3f6fb" },
  { label: "Beauty", icon: Sparkles, color: "#d34c90", tint: "#fff0f7" },
  { label: "Mobile", icon: Smartphone, color: "#254fb3", tint: "#f1f4ff" },
  { label: "Electronics", icon: Monitor, color: "#0b2f74", tint: "#f3f6fb" },
  { label: "Home Services", icon: Home, color: "#0b2f74", tint: "#f3f6fb" },
  { label: "More", icon: Grid2X2, color: "#0b2f74", tint: "#f7f4ee" },
];

const spotlightDeals: DealCardData[] = [
  {
    badge: "20% OFF",
    badgeColor: "#25a451",
    title: "Weekend Special",
    text: "Get 20% off on all bakery items",
    shop: "Sweet Bakery",
    image: "/mockup/im-bakery.jpg",
    gradient: "linear-gradient(135deg,#edfbea,#ffffff 58%,#e9f8ea)",
  },
  {
    badge: "₹599",
    badgeColor: "#2565c7",
    title: "Limited Time Offer",
    text: "Full body health checkup at just Rs599",
    shop: "City Care Lab",
    image: "/mockup/im-pharmacy.jpg",
    gradient: "linear-gradient(135deg,#eef5ff,#ffffff 58%,#e7f0ff)",
  },
  {
    badge: "15% OFF",
    badgeColor: "#f3a51a",
    title: "Fashion Fiesta",
    text: "Flat 15% off on all men's wear",
    shop: "Royale Tailors",
    image: "/mockup/im-card_suit.jpg",
    gradient: "linear-gradient(135deg,#fff2d8,#ffffff 58%,#fff0ce)",
  },
  {
    badge: "B1G1",
    badgeColor: "#7242b8",
    title: "Buy 1 Get 1",
    text: "On selected burgers & fries",
    shop: "ALUKKY Hotel",
    image: "/mockup/im-restaurant.jpg",
    gradient: "linear-gradient(135deg,#f4eaff,#ffffff 58%,#eadcff)",
  },
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

const offers: OfferCardData[] = [
  {
    title: "20% Off",
    text: "On all home cleaning services",
    shop: "HomeFix Pro",
    code: "CLEAN20",
    image: "/mockup/im-occ_helper.jpg",
    gradient: "linear-gradient(135deg,#08713f,#0b5636)",
  },
  {
    title: "₹599 Offer",
    text: "Hair Spa + Haircut Combo",
    shop: "Maya Beauty Salon",
    code: "SPA599",
    image: "/mockup/im-occ_beauty.jpg",
    gradient: "linear-gradient(135deg,#12459b,#092b70)",
  },
  {
    title: "15% Off",
    text: "On all fresh vegetables",
    shop: "Fresh Basket",
    code: "VEG15",
    image: "/mockup/im-vegetables.jpg",
    gradient: "linear-gradient(135deg,#cb790b,#8a4d04)",
  },
  {
    title: "B1G1",
    text: "Buy 1 Get 1 On Pizzas",
    shop: "Spice Garden",
    code: "PIZZA1",
    image: "/mockup/im-restaurant.jpg",
    gradient: "linear-gradient(135deg,#08713f,#064d2e)",
  },
  {
    title: "Festival Offer",
    text: "Up to 30% off on selected items",
    shop: "Quick Mart",
    code: "PICK21",
    image: "/mockup/im-gifts.jpg",
    gradient: "linear-gradient(135deg,#5825bb,#291986)",
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
  { id: "business-card", title: "Business Card", text: "Create & share your digital business card", icon: CircleUserRound },
  { id: "b2b", title: "B2B Network", text: "Connect & grow with businesses", icon: Network },
  { id: "jobs", title: "Jobs", text: "Find jobs or hire local talent", icon: BriefcaseBusiness },
  { id: "winner", title: "Winner", text: "Join contests & win exciting prizes", icon: Trophy },
  { id: "feed", title: "Feed", text: "Read & share local stories & updates", icon: FileText },
  { id: "plans", title: "Plans", text: "Choose the best plan for your business", icon: ShieldCheck },
  { id: "dashboard", title: "Dashboard", text: "Manage your business performance", icon: Store },
  { id: "admin", title: "Admin", text: "Manage users, reports & system", icon: Wrench },
  { id: "explanations", title: "Explanations", text: "Guides, help articles & resources", icon: Lightbulb },
];

const filters = ["All", "Restaurant", "Grocery", "Mobile", "Beauty", "Open Now", "Offers"];

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
  "layout-grid": Grid2X2,
  more: Grid2X2,
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
      icon: categoryIconMap[category.icon] ?? categoryIconMap[category.slug] ?? Grid2X2,
      color: category.accent || "#0b2f74",
      tint: tintFromAccent(category.accent),
      isActive: category.isActive,
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
  const databaseCards = (businesses ?? [])
    .slice()
    .sort((left, right) => right.rating - left.rating || right.reviewCount - left.reviewCount)
    .slice(0, rankedShops.length)
    .map((business, index) => ({
      ...businessToShopCard(business),
      rank: index + 1,
    }));

  return mergeByLabel(databaseCards, rankedShops, rankedShops.length);
}

function businessToShopCard(business: CatalogBusinessData): ShopCardData {
  return {
    name: business.name,
    category: business.category.name || business.subtitle,
    rating: formatRating(business.rating),
    reviews: String(business.reviewCount),
    distance: `${formatDistance(business.distanceKm)} km`,
    image: variantImages[business.coverVariant] ?? business.imageUrl ?? "/mockup/im-restaurant.jpg",
    badge: business.badgeText ?? (business.isFeatured ? "Star Shop" : business.isPopular ? "Popular" : "Verified"),
    badgeColor: business.badgeColor ?? (business.isFeatured ? "#2469d6" : business.isPopular ? "#f4a51c" : "#25a451"),
  };
}

function mergeByLabel<T extends { name?: string; label?: string }>(
  primary: T[],
  fallback: T[],
  minimum: number,
) {
  const merged: T[] = [];
  const seen = new Set<string>();

  for (const item of [...primary, ...fallback]) {
    const key = normalizeKey(item.name ?? item.label ?? "");
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

export function PublicHome({ data }: { data: CatalogData }) {
  const categoryCards = buildCategoryCards(data);
  const featuredCards = buildShopCards(data.featured, featuredShops);
  const allCards = buildShopCards(data.all ?? data.popular, allShops);
  const rankedCards = buildRankedCards(data.all ?? data.popular);

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section id="discover" className="bg-[#061f55] text-white">
        <TopBar />
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_15%_20%,#164caa,#082d75_44%,#061f55_100%)]">
          <div className="mx-auto grid max-w-[1800px] grid-cols-1 items-end gap-4 px-4 pb-6 pt-5 sm:gap-8 sm:px-5 sm:pb-8 sm:pt-7 md:px-10 lg:grid-cols-[1fr_0.98fr] lg:gap-10">
            <div className="max-w-[720px] pb-2">
              <h1 className="text-[38px] font-black leading-[0.98] sm:text-[58px] lg:text-[74px]">
                Find any shop, service
                <span className="block">or deal near you</span>
              </h1>
              <p className="mt-3 max-w-[560px] text-[14px] leading-6 text-white/86 sm:mt-5 sm:text-[17px] sm:leading-7">
                Discover trusted local shops, services and exclusive offers in{" "}
                <span className="font-black text-[#f5b625]">Kozhikode</span> all in one
                place.
              </p>
              <div className="mt-5 flex max-w-[860px] items-center rounded-[17px] bg-white p-1.5 shadow-[0_18px_36px_rgba(0,0,0,0.28)] sm:mt-8 sm:p-2">
                <Search className="ml-3 h-5 w-5 shrink-0 text-[#8ea0bd] sm:ml-4 sm:h-6 sm:w-6" />
                <div className="min-w-0 flex-1 truncate px-3 text-[13px] font-semibold text-[#71809b] sm:px-5 sm:text-[15px]">
                  Search shops, products, services or deals
                </div>
                <button className="rounded-[13px] bg-[#f5b625] px-5 py-3 text-[13px] font-black text-[#08285f] sm:rounded-[14px] sm:px-9 sm:py-4 sm:text-[15px]">
                  Search
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-[12px] font-semibold text-white/84 sm:mt-5 sm:gap-8 sm:text-[14px]">
                <HeroChip icon={<Star className="h-5 w-5 fill-[#f5b625] text-[#f5b625]" />} text="Star shops" />
                <HeroChip icon={<Sparkles className="h-5 w-5 text-[#f5b625]" />} text="Best matches" />
                <HeroChip icon={<GiftIcon />} text="Weekly draw" />
                <HeroChip icon={<GiftIcon />} text="Gifts" />
              </div>
            </div>
            <HeroScene />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 pb-24 pt-4 sm:px-5 sm:pb-14 sm:pt-5 md:px-10">
        <SectionTitle title="Browse by category" />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:px-0 md:grid-cols-5 xl:grid-cols-9">
          {categoryCards.map((item) => (
            <CategoryCard key={item.label} item={item} />
          ))}
        </div>

        <SectionTitle title="Deals in spotlight" action="View all deals" />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:px-0 xl:grid-cols-4">
          {spotlightDeals.map((deal) => (
            <SpotlightDeal key={deal.title} deal={deal} />
          ))}
        </div>

        <SectionTitle title="Featured shops" action="View all shops" />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:px-0 xl:grid-cols-5">
          {featuredCards.map((shop) => (
            <FeaturedShop key={shop.name} shop={shop} />
          ))}
        </div>

        <SectionTitle title="Today's top offers" />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:px-0 xl:grid-cols-5">
          {offers.map((offer) => (
            <OfferCard key={offer.title} offer={offer} />
          ))}
        </div>

        <div className="mt-7 flex items-end justify-between gap-4 sm:mt-9">
          <div>
            <h2 className="text-[22px] font-black leading-none text-[#0b2f74] sm:text-[25px]">
              All shops in Kozhikode
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-[#71809b]">
              Showing trusted local businesses near you
            </p>
          </div>
          <a className="hidden items-center gap-1 text-[13px] font-black text-[#0b2f74] sm:flex" href="#ranked">
            View all
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        <div className="-mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-4 sm:flex-wrap sm:gap-3 sm:px-0">
          {filters.map((filter, index) => (
            <button
              key={filter}
              className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black sm:px-5 sm:py-2.5 sm:text-[12px] ${
                index === 0
                  ? "border-[#0b2f74] bg-[#0b2f74] text-white"
                  : "border-[#dfe6f2] bg-white text-[#405474]"
              }`}
            >
              <span
                className={
                  filter === "Open Now"
                    ? "mr-2 inline-block h-2 w-2 rounded-full bg-[#31c563]"
                    : filter === "Offers"
                      ? "mr-2 inline-block h-2 w-2 rounded-full bg-[#e84141]"
                      : "hidden"
                }
              />
              {filter}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
          {allCards.map((shop) => (
            <ShopGridCard key={`${shop.name}-${shop.distance}`} shop={shop} />
          ))}
        </div>
        <div className="mt-7 flex justify-center">
          <button className="inline-flex items-center gap-2 rounded-full border border-[#cbd7ea] bg-white px-7 py-3 text-[14px] font-black text-[#0b2f74] shadow-[0_8px_20px_rgba(11,47,116,0.06)]">
            Explore more shops
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <section id="ranked" className="mt-9">
          <SectionTitle title="Search ranked shops" compact />
          <div className="-mx-4 -mt-2 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:gap-3 sm:px-0">
            {["Best Match", "Most Rated", "Nearby", "Offers", "New"].map((label, index) => (
              <button
                key={label}
                className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black sm:px-5 sm:text-[12px] ${
                  index === 0
                    ? "border-[#0b2f74] bg-[#0b2f74] text-white"
                    : "border-[#dfe6f2] bg-white text-[#405474]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            {rankedCards.map((shop) => (
              <RankedShop key={shop.rank} shop={shop} />
            ))}
          </div>
        </section>

        <SectionTitle title="More from BNC ecosystem" />
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

function TopBar() {
  return (
    <header className="border-b border-white/10 bg-[#061f55]">
      <div className="mx-auto flex h-[60px] max-w-[1800px] items-center gap-3 px-4 md:h-[72px] md:gap-5 md:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-[26px] font-black leading-none md:text-[34px]">
          <MapPin className="h-7 w-7 fill-[#f5b625] text-[#f5b625] md:h-9 md:w-9" />
          <span>BNC</span>
        </Link>
        <div className="hidden items-center gap-2 rounded-full border border-white/16 bg-white/6 px-4 py-2.5 text-[13px] font-bold text-white/84 md:flex">
          <MapPin className="h-4 w-4" />
          Nearu
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/16 bg-white/6 px-4 py-2.5 text-[13px] font-bold text-white/84 lg:flex">
          <MapPin className="h-4 w-4" />
          Kozhikode, Kerala
          <ChevronDown className="h-4 w-4" />
        </div>
        <nav className="ml-auto hidden h-full items-center gap-7 lg:flex">
          {navItems.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              className={`relative flex h-full items-center text-[13px] font-black ${
                index === 0 ? "text-[#f5b625]" : "text-white/92"
              }`}
            >
              {item.label}
              {index === 0 ? (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[#f5b625]" />
              ) : null}
            </a>
          ))}
        </nav>
        <button className="relative ml-auto grid h-10 w-10 place-items-center rounded-full border border-white/14 text-white lg:ml-0 md:h-11 md:w-11">
          <Bell className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-3 text-white sm:flex">
          <div className="h-11 w-11 rounded-full border border-white/20 bg-[url('/mockup/im-occ_sales.jpg')] bg-cover bg-center" />
          <div className="leading-tight">
            <div className="text-[13px] font-black">John Doe</div>
            <div className="text-[12px] font-semibold text-white/72">Business</div>
          </div>
          <ChevronDown className="h-4 w-4 text-white/70" />
        </div>
      </div>
    </header>
  );
}

function HeroChip({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function GiftIcon() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-[4px] border-2 border-[#f5b625] text-[10px] font-black text-[#f5b625]">
      +
    </span>
  );
}

function HeroScene() {
  return (
    <div className="relative mx-auto hidden h-[270px] w-full max-w-[700px] sm:block lg:h-[330px]">
      <div className="absolute inset-x-0 bottom-0 h-[240px] opacity-55">
        <div className="absolute bottom-0 left-0 h-[132px] w-[78px] rounded-t-[12px] bg-[#2e55a1]" />
        <div className="absolute bottom-0 left-[92px] h-[180px] w-[92px] rounded-t-[12px] bg-[#244a96]" />
        <div className="absolute bottom-0 left-[200px] h-[220px] w-[118px] rounded-t-[12px] bg-[#315aa8]" />
        <div className="absolute bottom-0 right-[156px] h-[186px] w-[104px] rounded-t-[12px] bg-[#244a96]" />
        <div className="absolute bottom-0 right-[54px] h-[145px] w-[76px] rounded-t-[12px] bg-[#315aa8]" />
        <div className="absolute bottom-[12px] left-[18px] h-5 w-5 rounded-full bg-white/10" />
      </div>
      <div className="absolute bottom-1 left-1/2 h-[50px] w-[420px] -translate-x-1/2 rounded-full bg-[#103f91]/70 blur-[2px]" />
      <div className="absolute bottom-0 left-1/2 h-[146px] w-[230px] -translate-x-1/2 rounded-t-[24px] bg-[#1b4a99]">
        <div className="absolute left-1/2 top-[-44px] h-[76px] w-[250px] -translate-x-1/2 overflow-hidden rounded-t-[28px] bg-[#13408e]">
          <div className="absolute inset-x-0 bottom-0 flex h-[70px]">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={`flex-1 rounded-b-[18px] ${index % 2 === 0 ? "bg-white" : "bg-[#2d66c1]"}`}
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-[34px] h-[96px] w-[76px] rounded-t-[16px] bg-white/95" />
        <div className="absolute bottom-0 right-[34px] h-[96px] w-[76px] rounded-t-[16px] bg-white/95" />
        <div className="absolute bottom-0 left-1/2 h-[112px] w-[62px] -translate-x-1/2 rounded-t-[18px] bg-[#113b87]" />
      </div>
      <div className="absolute bottom-[145px] left-1/2 h-[128px] w-[128px] -translate-x-1/2 rounded-full border-[26px] border-[#f5b625]" />
      <div className="absolute bottom-[92px] left-1/2 h-[100px] w-[34px] -translate-x-1/2 rounded-b-full bg-[#d79408]" />
      <Person className="absolute bottom-[8px] left-[118px]" />
      <Person className="absolute bottom-[8px] right-[76px]" flip />
      <div className="absolute right-0 top-0 grid grid-cols-7 gap-3 opacity-35">
        {Array.from({ length: 35 }).map((_, index) => (
          <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#f5b625]" />
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

function SectionTitle({ title, action, compact = false }: { title: string; action?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "mt-0" : "mt-7 sm:mt-9"} mb-3 sm:mb-4`}>
      <h2 className="text-[21px] font-black leading-tight text-[#0b2f74] sm:text-[23px]">{title}</h2>
      {action ? (
        <a className="ml-auto inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-black text-[#0b2f74] sm:text-[13px]" href="#all-shops">
          {action}
          <ChevronRight className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}

function CategoryCard({ item }: { item: CategoryTile }) {
  const Icon = item.icon;
  const active = item.isActive;

  return (
    <article
      className={`w-[92px] shrink-0 snap-start rounded-[16px] border px-2 py-3 text-center shadow-[0_10px_24px_rgba(11,47,116,0.05)] sm:w-auto sm:rounded-[14px] sm:px-4 sm:py-5 ${
        active ? "border-[#0b2f74] bg-[#0b2f74] text-white" : "border-[#dfe6f2] bg-white"
      }`}
    >
      <div
        className="mx-auto grid h-12 w-12 place-items-center rounded-[15px] sm:h-[62px] sm:w-[62px] sm:rounded-[18px]"
        style={{
          color: active ? "#ffffff" : item.color,
          backgroundColor: active ? "rgba(255,255,255,0.14)" : item.tint,
        }}
      >
        <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
      </div>
      <div
        className={`mt-2 min-h-[20px] text-[11.5px] font-black leading-tight sm:mt-3 sm:min-h-[22px] sm:text-[13px] ${
          active ? "text-white" : "text-[#0b2f74]"
        }`}
      >
        {item.label}
      </div>
    </article>
  );
}

function SpotlightDeal({ deal }: { deal: DealCardData }) {
  const badge = deal.badge.includes("599") ? "\u20b9599" : deal.badge;

  return (
    <article className="w-[292px] shrink-0 snap-start overflow-hidden rounded-[15px] border border-[#dfe6f2] shadow-[0_12px_26px_rgba(11,47,116,0.06)] md:w-auto" style={{ background: deal.gradient }}>
      <div className="flex min-h-[132px] items-center gap-3 px-3 py-3 md:min-h-[184px] md:gap-4 md:px-5 md:py-4">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full px-3 py-1 text-[12px] font-black leading-none text-white md:px-4 md:py-1.5 md:text-[16px]" style={{ backgroundColor: deal.badgeColor }}>
            {badge}
          </span>
          <h3 className="mt-2 text-[15px] font-black leading-tight text-[#0b2f74] md:mt-3 md:text-[18px]">{deal.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-[11.5px] font-semibold leading-4 text-[#596a82] md:mt-2 md:text-[13px] md:leading-5">{deal.text}</p>
          <div className="mt-3 hidden min-w-0 items-center gap-2 text-[12px] font-black text-[#0b2f74] md:flex">
            <span className="h-6 w-6 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${deal.image})` }} />
            <span className="truncate">{deal.shop}</span>
          </div>
        </div>
        <div className="h-[100px] w-[112px] shrink-0 overflow-hidden rounded-[12px] bg-white/40 md:h-[136px] md:w-[150px]">
          <ImageFill src={deal.image} />
        </div>
      </div>
    </article>
  );
}

function FeaturedShop({ shop }: { shop: ShopCardData }) {
  return (
    <article className="w-[196px] shrink-0 snap-start overflow-hidden rounded-[13px] border border-[#dfe6f2] bg-white shadow-[0_12px_25px_rgba(11,47,116,0.07)] md:w-auto">
      <ShopImage image={shop.image} badge={shop.badge} badgeColor={shop.badgeColor} height="h-[106px] md:h-[150px]" />
      <ShopBody shop={shop} />
    </article>
  );
}

function OfferCard({ offer }: { offer: OfferCardData }) {
  const title = offer.title.includes("599") ? "\u20b9599 Offer" : offer.title;

  return (
    <article className="relative h-[128px] w-[236px] shrink-0 snap-start overflow-hidden rounded-[15px] p-4 text-white shadow-[0_12px_26px_rgba(11,47,116,0.1)] md:h-[142px] md:w-auto md:p-5" style={{ background: offer.gradient }}>
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
    </article>
  );
}

function ShopGridCard({ shop }: { shop: ShopCardData }) {
  return (
    <article className="overflow-hidden rounded-[13px] border border-[#dfe6f2] bg-white shadow-[0_12px_25px_rgba(11,47,116,0.06)]">
      <ShopImage image={shop.image} badge={shop.badge} badgeColor={shop.badgeColor} ribbon={shop.ribbon} height="h-[94px] sm:h-[128px]" />
      <ShopBody shop={shop} dense />
    </article>
  );
}

function ShopImage({ image, badge, badgeColor, ribbon, height }: { image: string; badge: string; badgeColor: string; ribbon?: string; height: string }) {
  return (
    <div className={`relative ${height} bg-slate-100`}>
      <ImageFill src={image} darken />
      <span className="absolute left-2 top-2 rounded-[6px] px-2 py-0.5 text-[9.5px] font-black text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]" style={{ backgroundColor: badgeColor }}>
        {badge}
      </span>
      {ribbon ? (
        <span className="absolute right-2 top-2 rounded-[6px] bg-[#d94842] px-2 py-0.5 text-[9.5px] font-black text-white sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
          {ribbon}
        </span>
      ) : null}
      <button className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/24 text-white sm:right-3 sm:top-3 sm:h-8 sm:w-8">
        <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  );
}

function ShopBody({ shop, dense = false }: { shop: ShopCardData; dense?: boolean }) {
  return (
    <div className={dense ? "px-2.5 py-2.5 sm:px-3 sm:py-3" : "px-3 py-3 sm:px-4 sm:py-4"}>
      <h3 className={`${dense ? "text-[12.5px] sm:text-[14px]" : "text-[13px] sm:text-[14px]"} truncate font-black text-[#0b2f74]`}>{shop.name}</h3>
      <p className={`${dense ? "text-[10.5px] sm:text-[12px]" : "text-[11.5px] sm:text-[12px]"} mt-1 truncate font-semibold text-[#71809b]`}>{shop.category}</p>
      <div className={`${dense ? "mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10.5px] sm:mt-3 sm:justify-between sm:text-[12px]" : "mt-2.5 flex items-center justify-between gap-2 text-[11.5px] sm:mt-3 sm:text-[12px]"} font-semibold text-[#71809b]`}>
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-[#f5b625] text-[#f5b625]" />
          {shop.rating} ({shop.reviews})
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {shop.distance}
        </span>
      </div>
    </div>
  );
}

function RankedShop({ shop }: { shop: RankedShopData }) {
  return (
    <article className="flex items-center gap-3 rounded-[13px] border border-[#dfe6f2] bg-white p-3 shadow-[0_12px_25px_rgba(11,47,116,0.05)] sm:gap-4 sm:p-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f5b625,#c98200)] text-[15px] font-black text-white sm:h-11 sm:w-11 sm:text-[18px]">
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
      <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#e3e9f4] text-[#0b2f74] sm:h-9 sm:w-9">
        <ChevronRight className="h-4 w-4" />
      </button>
    </article>
  );
}

function EcosystemCard({ item }: { item: EcosystemCardData }) {
  const Icon = item.icon;
  return (
    <article id={item.id} className="relative flex min-h-[142px] scroll-mt-24 flex-col items-start gap-3 rounded-[13px] border border-[#dfe6f2] bg-white p-3 shadow-[0_10px_22px_rgba(11,47,116,0.05)] sm:min-h-0 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[#edf3ff] text-[#0b2f74] sm:h-16 sm:w-16">
        <Icon className="h-7 w-7 sm:h-9 sm:w-9" />
      </div>
      <div className="mt-auto min-w-0 flex-1 sm:mt-0">
        <h3 className="text-[14px] font-black text-[#0b2f74] sm:text-[16px]">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-[11.5px] font-semibold leading-4 text-[#71809b] sm:text-[13px] sm:leading-5">{item.text}</p>
      </div>
      <button className="absolute right-3 top-3 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#e3e9f4] text-[#0b2f74] sm:static sm:h-9 sm:w-9">
        <ChevronRight className="h-4 w-4" />
      </button>
    </article>
  );
}

function Footer() {
  const columns = [
    ["Explore", "Star shops", "Best matches", "Deals", "All categories"],
    ["For Businesses", "Business Card", "B2B Network", "Plans & Pricing", "Dashboard"],
    ["Company", "About Us", "Careers", "Blog", "Contact Us"],
    ["Support", "Help Center", "Terms of Use", "Privacy Policy", "Sitemap"],
  ];

  return (
    <footer className="bg-[linear-gradient(135deg,#082d75,#061f55)] text-white">
      <div className="mx-auto grid max-w-[1800px] gap-10 px-5 py-9 md:px-10 lg:grid-cols-[1.35fr_0.8fr_1fr_0.8fr_0.85fr_1.25fr]">
        <div>
          <div className="flex items-center gap-2 text-[32px] font-black leading-none">
            <MapPin className="h-8 w-8 fill-[#f5b625] text-[#f5b625]" />
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
        {columns.map(([title, ...items]) => (
          <div key={title}>
            <h4 className="text-[15px] font-black">{title}</h4>
            <ul className="mt-4 space-y-2.5 text-[13px] font-semibold text-white/72">
              {items.map((item) => (
                <li key={item}>{item}</li>
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
            <button className="rounded-[10px] bg-[#f5b625] px-6 py-3 text-[13px] font-black text-[#08285f]">
              Subscribe
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-5 py-4 text-[13px] font-semibold text-white/60 md:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div>© 2024 BNC / Nearu. All rights reserved.</div>
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
