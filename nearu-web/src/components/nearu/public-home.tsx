import type { ReactNode } from "react";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserRound,
} from "lucide-react";

import { platformSections } from "@/lib/platform-sections";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  accent: string;
  isActive: boolean;
};

type BusinessItem = {
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
};

type CatalogView = {
  categories: CategoryItem[];
  featured: BusinessItem[];
  popular: BusinessItem[];
  stats: {
    categories: number;
    businesses: number;
    trusted: number;
    happyUsers: string;
  };
};

type ShowcaseCategory = {
  id: string;
  name: string;
  symbol: string;
  accent: string;
  background: string;
};

type ShowcaseShop = {
  id: string;
  name: string;
  subtitle: string;
  area: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  tier: string;
  tierColor: string;
  imageUrl: string;
  promo?: string;
};

type SpotlightDeal = {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  business: string;
  background: string;
  imageUrl: string;
};

type OfferBanner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  code: string;
  background: string;
  imageUrl: string;
};

const topNavItems = [
  { label: "Discover", href: "#discover", active: true },
  { label: "Business Card", href: "#card" },
  { label: "B2B", href: "#b2b" },
  { label: "Jobs", href: "#jobs" },
  { label: "Winner", href: "#winner" },
  { label: "Feed", href: "#feed" },
  { label: "Plans", href: "#plans" },
  { label: "Dashboard", href: "#merchant" },
  { label: "Admin", href: "#admin" },
  { label: "Help", href: "#explain" },
];

const categoryTiles: ShowcaseCategory[] = [
  {
    id: "grocery",
    name: "Grocery",
    symbol: "🛒",
    accent: "#f4a91f",
    background: "rgba(244, 178, 39, 0.12)",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    symbol: "🍽",
    accent: "#0b2f74",
    background: "rgba(11, 47, 116, 0.10)",
  },
  {
    id: "bakery",
    name: "Bakery",
    symbol: "🎂",
    accent: "#f0a61c",
    background: "rgba(244, 178, 39, 0.12)",
  },
  {
    id: "textiles",
    name: "Textiles",
    symbol: "👕",
    accent: "#0b2f74",
    background: "rgba(11, 47, 116, 0.12)",
  },
  {
    id: "beauty",
    name: "Beauty",
    symbol: "💅",
    accent: "#e0569a",
    background: "rgba(247, 127, 183, 0.12)",
  },
  {
    id: "mobile",
    name: "Mobile",
    symbol: "📱",
    accent: "#4057c6",
    background: "rgba(64, 87, 198, 0.10)",
  },
  {
    id: "electronics",
    name: "Electronics",
    symbol: "🖥",
    accent: "#2a4f9e",
    background: "rgba(28, 78, 161, 0.12)",
  },
  {
    id: "home-services",
    name: "Home Services",
    symbol: "🏠",
    accent: "#163e73",
    background: "rgba(11, 47, 116, 0.12)",
  },
  {
    id: "more",
    name: "More",
    symbol: "▦",
    accent: "#163e73",
    background: "rgba(11, 47, 116, 0.10)",
  },
];

const heroChips = [
  { symbol: "★", label: "Star shops" },
  { symbol: "◎", label: "Best matches" },
  { symbol: "🎁", label: "Weekly draw" },
  { symbol: "🎀", label: "Gifts" },
];

const shopFilters = ["All", "Restaurant", "Grocery", "Mobile", "Beauty", "Open Now", "Offers"];

const footerColumns = [
  {
    title: "Explore",
    items: ["Star shops", "Best matches", "Deals", "All categories"],
  },
  {
    title: "For Businesses",
    items: ["Business Card", "B2B Network", "Plans & Pricing", "Dashboard"],
  },
  {
    title: "Company",
    items: ["About Us", "Careers", "Blog", "Contact Us"],
  },
  {
    title: "Support",
    items: ["Help Center", "Terms of Use", "Privacy Policy", "Sitemap"],
  },
];

export function PublicHome({ data }: { data: CatalogView }) {
  const imageBank = buildImageBank(data);
  const allShops = buildShowcaseShops(imageBank);
  const featuredShops = allShops.slice(0, 5);
  const spotlightDeals = buildSpotlightDeals(imageBank);
  const topOffers = buildTopOffers(imageBank);
  const ecosystemCards = platformSections.filter((section) => section.id !== "discover");
  const profileImage =
    "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600";

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--navy)]">
      <section
        id="discover"
        className="relative overflow-hidden bg-[radial-gradient(circle_at_left_top,_#1d4ea0,_#0b2f74_38%,_#041c55_100%)] text-white"
      >
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/6" />
          <div className="absolute right-10 top-14 grid grid-cols-7 gap-2 opacity-25">
            {Array.from({ length: 42 }).map((_, index) => (
              <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#86a6ef]" />
            ))}
          </div>
        </div>

        <div className="relative mx-auto max-w-[1500px] px-4 pb-10 pt-5 sm:px-6 lg:px-10">
          <header className="flex flex-wrap items-center gap-3 rounded-[28px] border border-white/10 bg-[rgba(5,19,60,0.22)] px-4 py-3 shadow-[0_14px_34px_rgba(2,10,33,0.18)] backdrop-blur lg:flex-nowrap lg:px-6">
            <Link href="/" className="flex items-center gap-2 text-[2.05rem] font-black tracking-[-0.05em]">
              <MapPin className="h-8 w-8 fill-[var(--gold)] text-[var(--gold)]" />
              <span>BNC</span>
            </Link>

            <div className="ml-0 flex flex-wrap items-center gap-2 lg:ml-3">
              <Pill>
                <div className="h-2 w-2 rounded-full bg-white" />
                <span>Nearu</span>
              </Pill>
              <Pill>
                <MapPin className="h-3.5 w-3.5" />
                <span>Kozhikode, Kerala</span>
                <ChevronDown className="h-4 w-4 text-white/70" />
              </Pill>
            </div>

            <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
              {topNavItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`relative pb-2 text-sm font-semibold transition ${
                    item.active ? "text-[var(--gold)]" : "text-white/92 hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.active ? (
                    <span className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-[var(--gold)]" />
                  ) : null}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <button className="relative grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/6 text-white">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-4 min-w-4 rounded-full bg-[var(--gold)] px-1 text-[10px] font-black leading-4 text-[var(--navy)]">
                  1
                </span>
              </button>

              <button className="flex items-center gap-3 rounded-full border border-white/12 bg-white/6 py-1.5 pl-1.5 pr-3 text-left text-white">
                <div
                  className="h-10 w-10 rounded-full border border-white/18 bg-cover bg-center"
                  style={{ backgroundImage: `url(${profileImage})` }}
                />
                <div className="hidden leading-tight sm:block">
                  <div className="text-sm font-black">John Doe</div>
                  <div className="text-xs text-white/70">Business</div>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-white/70 sm:block" />
              </button>
            </div>
          </header>

          <div className="mt-8 grid items-end gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
            <div className="max-w-[620px] pb-4">
              <h1 className="text-[3.3rem] font-black leading-[0.96] tracking-[-0.055em] sm:text-[4.55rem]">
                Find any shop, service
                <span className="block">or deal near you</span>
              </h1>
              <p className="mt-5 max-w-[520px] text-[1.06rem] leading-8 text-white/82">
                Discover trusted local shops, services and exclusive offers
                <span className="font-bold text-[var(--gold)]"> in Kozhikode</span> all in one
                place.
              </p>

              <div className="mt-8 overflow-hidden rounded-[26px] border border-white/12 bg-white p-2.5 shadow-[0_20px_38px_rgba(2,9,31,0.28)]">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex min-h-[62px] flex-1 items-center gap-4 px-5 text-[var(--muted)]">
                    <Search className="h-6 w-6 shrink-0" />
                    <span className="text-base font-semibold">
                      Search shops, products, services or deals
                    </span>
                  </div>
                  <button className="rounded-[20px] bg-[var(--gold)] px-10 py-4 text-base font-black text-[var(--navy)] shadow-[0_12px_28px_rgba(199,137,8,0.24)]">
                    Search
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/82">
                {heroChips.map((item) => (
                  <div key={item.label} className="inline-flex items-center gap-2 font-semibold">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/8 text-[15px] text-[var(--gold)]">
                      {item.symbol}
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroTownGraphic />
            </div>
          </div>
        </div>
      </section>

      <main className="pb-16">
        <div className="mx-auto max-w-[1500px] px-4 pt-8 sm:px-6 lg:px-10">
          <SectionHeading title="Browse by category" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-9">
            {categoryTiles.map((category) => (
              <article
                key={category.id}
                className="rounded-[26px] border border-[var(--line)] bg-white px-4 py-5 text-center shadow-[0_14px_34px_rgba(10,30,68,0.05)]"
              >
                <div
                  className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[18px] text-[1.85rem]"
                  style={{
                    backgroundColor: category.background,
                    color: category.accent,
                  }}
                >
                  {category.symbol}
                </div>
                <div className="text-[15px] font-bold leading-5 text-[var(--navy)]">
                  {category.name}
                </div>
              </article>
            ))}
          </div>

          <SectionHeading title="Deals in spotlight" action="View all deals" />
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {spotlightDeals.map((deal) => (
              <SpotlightDealCard key={deal.id} deal={deal} />
            ))}
          </div>

          <SectionHeading title="Featured shops" action="View all shops" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {featuredShops.map((shop) => (
              <FeaturedShopCard key={shop.id} shop={shop} />
            ))}
          </div>

          <SectionHeading title="Today's top offers" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {topOffers.map((offer) => (
              <OfferBannerCard key={offer.id} offer={offer} />
            ))}
          </div>

          <div id="all-shops" className="mt-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[2rem] font-black tracking-[-0.04em] text-[var(--navy)]">
                  All shops in Kozhikode
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Showing trusted local businesses near you
                </p>
              </div>
              <a
                href="#ranked"
                className="inline-flex items-center gap-1 text-sm font-bold text-[var(--muted)]"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {shopFilters.map((filter, index) => (
                <button
                  key={filter}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    index === 0
                      ? "bg-[var(--navy)] text-white shadow-[0_12px_24px_rgba(11,47,116,0.16)]"
                      : "bg-[#f1f5fc] text-[var(--navy)]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {allShops.map((shop) => (
                <ShopGridCard key={shop.id} shop={shop} />
              ))}
            </div>

            <div className="mt-7 flex justify-center">
              <button className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-6 py-3.5 text-sm font-bold text-[var(--navy)] shadow-[0_10px_22px_rgba(10,30,68,0.06)]">
                Explore more shops
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div id="ranked" className="mt-11">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[2rem] font-black tracking-[-0.04em] text-[var(--navy)]">
                  Search ranked shops
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Best Match", "Most Rated", "Nearby", "Offers", "New"].map(
                    (label, index) => (
                      <span
                        key={label}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                          index === 0
                            ? "bg-[var(--navy)] text-white"
                            : "bg-[#f4f7fc] text-[var(--muted)]"
                        }`}
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              {featuredShops.slice(0, 3).map((shop, index) => (
                <RankedShopCard key={shop.id} shop={shop} rank={index + 1} />
              ))}
            </div>
          </div>

          <div className="mt-11">
            <SectionHeading title="More from BNC ecosystem" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ecosystemCards.map((section) => (
                <a
                  key={section.id}
                  id={section.id}
                  href={`#${section.id}`}
                  className="group flex items-center gap-4 rounded-[24px] border border-[var(--line)] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(10,30,68,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(10,30,68,0.08)]"
                >
                  <div
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] text-[12px] font-black tracking-[0.08em]"
                    style={{
                      color: section.accent,
                      backgroundColor: rgbaFromHex(section.accent, 0.12),
                    }}
                  >
                    {section.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-black text-[var(--navy)]">{section.label}</div>
                    <div className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {section.title}
                    </div>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f8fd] text-[var(--muted)] transition group-hover:text-[var(--navy)]">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[linear-gradient(180deg,#102c69_0%,#0a2258_100%)] text-white">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.25fr_0.85fr_0.95fr_0.8fr_0.8fr_1.15fr] lg:px-10">
          <div>
            <div className="flex items-center gap-2 text-[2rem] font-black tracking-[-0.05em]">
              <MapPin className="h-8 w-8 fill-[var(--gold)] text-[var(--gold)]" />
              <span>BNC</span>
              <span className="text-lg font-bold text-white/72">|</span>
              <span className="text-[1.4rem] font-bold text-white/82">Nearu</span>
            </div>
            <p className="mt-4 max-w-[270px] text-sm leading-7 text-white/76">
              Your trusted local discovery and business ecosystem in Kozhikode.
            </p>
            <div className="mt-5 flex gap-3">
              <FooterSocial icon={<Store className="h-4 w-4" />} />
              <FooterSocial icon={<Sparkles className="h-4 w-4" />} />
              <FooterSocial icon={<ShieldCheck className="h-4 w-4" />} />
              <FooterSocial icon={<UserRound className="h-4 w-4" />} />
            </div>
          </div>

          {footerColumns.map((column) => (
            <FooterColumn key={column.title} title={column.title} items={column.items} />
          ))}

          <div>
            <h4 className="text-lg font-black">Stay in the loop</h4>
            <p className="mt-3 text-sm leading-7 text-white/76">
              Get updates on the best deals &amp; offers near you.
            </p>
            <div className="mt-5 flex gap-3">
              <div className="flex-1 rounded-2xl border border-white/14 bg-white/6 px-4 py-4 text-sm text-white/60">
                Enter your email
              </div>
              <button className="rounded-2xl bg-[var(--gold)] px-6 py-4 font-black text-[var(--navy)]">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-4 text-sm text-white/68 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div>© 2024 BNC / Nearu. All rights reserved.</div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Kozhikode, Kerala
              </span>
              <span>English</span>
              <span>INR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2.5 text-sm font-semibold text-white/88">
      {children}
    </div>
  );
}

function SectionHeading({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-4 mt-10 flex items-center gap-4">
      <h2 className="text-[1.9rem] font-black tracking-[-0.04em] text-[var(--navy)]">
        {title}
      </h2>
      {action ? (
        <a
          href="#all-shops"
          className="ml-auto inline-flex items-center gap-1 text-sm font-bold text-[var(--muted)]"
        >
          {action}
          <ChevronRight className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}

function SpotlightDealCard({ deal }: { deal: SpotlightDeal }) {
  return (
    <article
      className="overflow-hidden rounded-[26px] border border-white/30 shadow-[0_14px_34px_rgba(10,30,68,0.06)]"
      style={{ background: deal.background }}
    >
      <div className="flex min-h-[176px] items-center gap-4 px-5 py-5">
        <div className="max-w-[210px]">
          <span
            className="inline-flex rounded-full px-3 py-1.5 text-xs font-black text-white"
            style={{ backgroundColor: deal.badgeColor }}
          >
            {deal.badge}
          </span>
          <h3 className="mt-4 text-[1.7rem] font-black leading-[1.02] tracking-[-0.04em] text-[var(--navy)]">
            {deal.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#516987]">{deal.description}</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--navy)]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/70">
              <Store className="h-3.5 w-3.5" />
            </span>
            {deal.business}
          </div>
        </div>
        <div className="ml-auto h-[126px] w-[126px] shrink-0 overflow-hidden rounded-[26px] border border-white/45 bg-white/55 shadow-[0_14px_28px_rgba(10,30,68,0.08)]">
          <PhotoFill imageUrl={deal.imageUrl} />
        </div>
      </div>
    </article>
  );
}

function FeaturedShopCard({ shop }: { shop: ShowcaseShop }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-white shadow-[0_14px_30px_rgba(10,30,68,0.08)]">
      <div className="relative h-[176px] bg-slate-100">
        <PhotoFill imageUrl={shop.imageUrl} darken />
        <span
          className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-black text-white"
          style={{ backgroundColor: shop.tierColor }}
        >
          {shop.tier}
        </span>
        <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/22 text-white">
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3 px-4 py-4">
        <div>
          <h3 className="text-lg font-black text-[var(--navy)]">{shop.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {shop.subtitle} · {shop.area}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
            {shop.rating.toFixed(1)} ({shop.reviewCount})
          </span>
          <span>Open now</span>
        </div>
      </div>
    </article>
  );
}

function OfferBannerCard({ offer }: { offer: OfferBanner }) {
  return (
    <article
      className="relative overflow-hidden rounded-[24px] px-5 py-5 text-white shadow-[0_16px_34px_rgba(10,30,68,0.1)]"
      style={{ background: offer.background }}
    >
      <div className="max-w-[180px]">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-white/78">
          {offer.eyebrow}
        </div>
        <h3 className="mt-3 text-[2rem] font-black leading-none tracking-[-0.05em]">
          {offer.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/82">{offer.description}</p>
        <div className="mt-4 inline-flex rounded-full bg-white/16 px-3 py-1.5 text-xs font-black">
          Use Code: {offer.code}
        </div>
      </div>
      <div className="absolute bottom-0 right-0 h-[112px] w-[112px] overflow-hidden rounded-tl-[28px] border-l border-t border-white/14">
        <PhotoFill imageUrl={offer.imageUrl} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/22 to-transparent" />
      </div>
    </article>
  );
}

function ShopGridCard({ shop }: { shop: ShowcaseShop }) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-white shadow-[0_12px_28px_rgba(10,30,68,0.06)]">
      <div className="relative h-[146px] bg-slate-100">
        <PhotoFill imageUrl={shop.imageUrl} darken />
        <span
          className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-black text-white"
          style={{ backgroundColor: shop.tierColor }}
        >
          {shop.tier}
        </span>
        {shop.promo ? (
          <span className="absolute left-3 top-12 rounded-full bg-white/88 px-2.5 py-1 text-[10px] font-black text-[var(--navy)]">
            {shop.promo}
          </span>
        ) : null}
        <button className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/18 text-white">
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2 px-4 py-4">
        <h3 className="truncate text-[1.02rem] font-black text-[var(--navy)]">{shop.name}</h3>
        <p className="truncate text-sm text-[var(--muted)]">{shop.subtitle}</p>
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
            {shop.rating.toFixed(1)} ({shop.reviewCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {shop.distanceKm.toFixed(1)} km
          </span>
        </div>
      </div>
    </article>
  );
}

function RankedShopCard({ shop, rank }: { shop: ShowcaseShop; rank: number }) {
  return (
    <article className="flex items-center gap-4 rounded-[24px] border border-[var(--line)] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(10,30,68,0.05)]">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f4b227,#d38f0f)] text-lg font-black text-white">
        {rank}
      </div>
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-slate-100">
        <PhotoFill imageUrl={shop.imageUrl} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-black text-[var(--navy)]">{shop.name}</h3>
        <p className="truncate text-sm text-[var(--muted)]">
          {shop.subtitle} · {shop.area}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[var(--gold)] text-[var(--gold)]" />
            {shop.rating.toFixed(1)} ({shop.reviewCount})
          </span>
          <span>{shop.distanceKm.toFixed(1)} km</span>
        </div>
      </div>
      <button className="grid h-9 w-9 place-items-center rounded-full bg-[#f4f7fd] text-[var(--muted)]">
        <ChevronRight className="h-4 w-4" />
      </button>
    </article>
  );
}

function FooterSocial({ icon }: { icon: ReactNode }) {
  return <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10">{icon}</div>;
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-lg font-black">{title}</h4>
      <ul className="mt-4 space-y-3 text-sm text-white/72">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function PhotoFill({
  imageUrl,
  darken = false,
}: {
  imageUrl: string;
  darken?: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      {darken ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/46 via-black/6 to-black/10" />
      ) : null}
    </div>
  );
}

function HeroTownGraphic() {
  return (
    <div className="relative h-[320px] w-full max-w-[560px]">
      <div className="absolute inset-x-14 bottom-6 h-8 rounded-full bg-[#123a89]/76 blur-[3px]" />
      <svg
        viewBox="0 0 560 320"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M64 286C128 250 170 232 224 222C294 209 376 208 517 232V320H64V286Z"
          fill="rgba(7,22,67,0.34)"
        />
        <path
          d="M54 286C135 250 226 230 332 230C414 230 468 239 532 252V320H54V286Z"
          fill="rgba(14,42,104,0.42)"
        />
        <circle cx="138" cy="62" r="18" fill="rgba(255,255,255,0.12)" />
        <circle cx="170" cy="62" r="14" fill="rgba(255,255,255,0.12)" />
        <circle cx="150" cy="47" r="16" fill="rgba(255,255,255,0.12)" />
        <circle cx="448" cy="76" r="16" fill="rgba(255,255,255,0.12)" />
        <circle cx="474" cy="76" r="12" fill="rgba(255,255,255,0.12)" />
        <circle cx="460" cy="61" r="14" fill="rgba(255,255,255,0.12)" />

        {[
          { x: 110, y: 110, w: 50, h: 122 },
          { x: 168, y: 126, w: 60, h: 106 },
          { x: 238, y: 92, w: 64, h: 140 },
          { x: 314, y: 116, w: 56, h: 116 },
          { x: 392, y: 96, w: 50, h: 136 },
          { x: 456, y: 122, w: 42, h: 110 },
        ].map((building, index) => (
          <g key={index} opacity="0.32">
            <rect
              x={building.x}
              y={building.y}
              width={building.w}
              height={building.h}
              rx="8"
              fill="#4B67B5"
            />
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 2 }).map((__, column) => (
                <rect
                  key={`${row}-${column}`}
                  x={building.x + 10 + column * 16}
                  y={building.y + 14 + row * 24}
                  width="9"
                  height="12"
                  rx="2"
                  fill="rgba(255,255,255,0.18)"
                />
              )),
            )}
          </g>
        ))}

        <ellipse cx="319" cy="278" rx="128" ry="28" fill="#17479C" />
        <ellipse cx="319" cy="278" rx="104" ry="21" fill="#285AB7" />

        <g transform="translate(218 96)">
          <path
            d="M108 0C138 0 162 24 162 54C162 85 139 106 122 126C112 138 106 149 108 166C91 151 83 138 75 126C59 105 38 83 38 54C38 24 62 0 92 0H108Z"
            fill="#F4B227"
          />
          <circle cx="100" cy="57" r="28" fill="#123A8C" opacity="0.28" />
          <circle cx="100" cy="57" r="18" fill="#F4B227" />
        </g>

        <g transform="translate(248 162)">
          <rect x="0" y="46" width="112" height="74" rx="12" fill="#375DAD" />
          <rect x="12" y="0" width="88" height="46" rx="12" fill="#214A9D" />
          <rect x="22" y="58" width="68" height="62" rx="12" fill="#F7FBFF" />
          <rect x="48" y="74" width="16" height="46" fill="#234A99" />
          <rect x="24" y="17" width="64" height="14" rx="7" fill="#133A8B" />
          <path
            d="M10 44H104L96 67H18L10 44Z"
            fill="#F4B227"
          />
          {Array.from({ length: 4 }).map((_, index) => (
            <path
              key={index}
              d={`M${18 + index * 20} 44H36L34 67H20L18 ${44}Z`}
              fill={index % 2 === 0 ? "#ffffff" : "#3B63B1"}
            />
          ))}
          <rect x="35" y="82" width="18" height="38" rx="9" fill="#194290" />
          <rect x="58" y="82" width="18" height="26" rx="9" fill="#DDE8FB" />
        </g>

        <g transform="translate(414 228)">
          <path d="M18 0C7 0 0 8 0 18V56H38V18C38 8 31 0 18 0Z" fill="#173F90" />
          <rect x="7" y="8" width="24" height="34" rx="8" fill="#F4B227" />
          <path d="M9 8C9 2 13 0 19 0C25 0 29 2 29 8" stroke="#173F90" strokeWidth="4" />
        </g>

        <g transform="translate(196 246)">
          <circle cx="12" cy="12" r="12" fill="#FFCA6B" />
          <rect x="6" y="24" width="12" height="34" rx="6" fill="#1F4F9A" />
          <rect x="0" y="31" width="24" height="8" rx="4" fill="#F4B227" />
          <rect x="2" y="56" width="7" height="28" rx="3.5" fill="#14387B" />
          <rect x="15" y="56" width="7" height="28" rx="3.5" fill="#14387B" />
        </g>

        <g transform="translate(470 242)">
          <circle cx="12" cy="12" r="12" fill="#FFCA6B" />
          <rect x="6" y="24" width="12" height="34" rx="6" fill="#14387B" />
          <rect x="1" y="56" width="7" height="28" rx="3.5" fill="#173F90" />
          <rect x="16" y="56" width="7" height="28" rx="3.5" fill="#173F90" />
          <rect x="-6" y="36" width="18" height="20" rx="5" fill="#F4B227" />
        </g>
      </svg>
    </div>
  );
}

function buildImageBank(data: CatalogView) {
  const variants = new Map<string, string>();
  for (const item of [...data.featured, ...data.popular]) {
    variants.set(item.coverVariant, item.imageUrl);
  }

  return {
    suit:
      variants.get("suit") ??
      "https://images.pexels.com/photos/6766299/pexels-photo-6766299.jpeg?auto=compress&cs=tinysrgb&w=1200",
    restaurant:
      variants.get("plate") ??
      "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=1200",
    bakery:
      "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=1200",
    jewellery:
      "https://images.pexels.com/photos/145418/pexels-photo-145418.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone:
      variants.get("phone") ??
      "https://images.pexels.com/photos/2818118/pexels-photo-2818118.jpeg?auto=compress&cs=tinysrgb&w=1200",
    electronics:
      "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=1200",
    grocery:
      variants.get("basket") ??
      "https://images.pexels.com/photos/9070106/pexels-photo-9070106.jpeg?auto=compress&cs=tinysrgb&w=1200",
    supermarket:
      variants.get("shelf") ??
      "https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg?auto=compress&cs=tinysrgb&w=1200",
    beauty:
      variants.get("salon") ??
      "https://images.pexels.com/photos/3993446/pexels-photo-3993446.jpeg?auto=compress&cs=tinysrgb&w=1200",
    service:
      variants.get("worker") ??
      "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&w=1200",
    burger:
      "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1200",
    clinic:
      "https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg?auto=compress&cs=tinysrgb&w=1200",
    pizza:
      "https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tv:
      "https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=1200",
    produce:
      "https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?auto=compress&cs=tinysrgb&w=1200",
    boutique:
      "https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1200",
    gifts:
      "https://images.pexels.com/photos/1666065/pexels-photo-1666065.jpeg?auto=compress&cs=tinysrgb&w=1200",
    dining:
      "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200",
  };
}

function buildShowcaseShops(images: ReturnType<typeof buildImageBank>): ShowcaseShop[] {
  return [
    {
      id: "rajeevan",
      name: "Rajeevan Tailors",
      subtitle: "Tailor / Clothing",
      area: "1.2 km",
      rating: 4.6,
      reviewCount: 126,
      distanceKm: 1.2,
      tier: "Star Shop",
      tierColor: "#2E63D8",
      imageUrl: images.suit,
    },
    {
      id: "alukky",
      name: "ALUKKY Hotel",
      subtitle: "Restaurant",
      area: "1.5 km",
      rating: 4.7,
      reviewCount: 89,
      distanceKm: 1.5,
      tier: "Popular",
      tierColor: "#F4A91F",
      imageUrl: images.restaurant,
    },
    {
      id: "sweet-bakery",
      name: "Sweet Bakery",
      subtitle: "Bakery",
      area: "2.1 km",
      rating: 4.5,
      reviewCount: 162,
      distanceKm: 2.1,
      tier: "Top Rated",
      tierColor: "#C73C35",
      imageUrl: images.bakery,
    },
    {
      id: "star-jewelers",
      name: "Star Jewelers",
      subtitle: "Jewelry",
      area: "2.4 km",
      rating: 4.6,
      reviewCount: 98,
      distanceKm: 2.4,
      tier: "Star Shop",
      tierColor: "#2E63D8",
      imageUrl: images.jewellery,
    },
    {
      id: "hanga-mobiles",
      name: "Hanga Mobiles",
      subtitle: "Mobile Store",
      area: "2.6 km",
      rating: 4.4,
      reviewCount: 113,
      distanceKm: 2.6,
      tier: "Popular",
      tierColor: "#F4A91F",
      imageUrl: images.phone,
    },
    {
      id: "thaha-electronics",
      name: "Thaha Electronics",
      subtitle: "Electronics",
      area: "2.8 km",
      rating: 4.3,
      reviewCount: 77,
      distanceKm: 2.8,
      tier: "Offer",
      tierColor: "#E0514B",
      imageUrl: images.tv,
    },
    {
      id: "fresh-basket",
      name: "Fresh Basket",
      subtitle: "Grocery",
      area: "3.0 km",
      rating: 4.6,
      reviewCount: 137,
      distanceKm: 3.0,
      tier: "New",
      tierColor: "#40A85E",
      imageUrl: images.produce,
    },
    {
      id: "spice-garden",
      name: "Spice Garden",
      subtitle: "Restaurant / Cafe",
      area: "3.2 km",
      rating: 4.6,
      reviewCount: 120,
      distanceKm: 3.2,
      tier: "Offer",
      tierColor: "#E0514B",
      imageUrl: images.dining,
    },
    {
      id: "maya-beauty",
      name: "Maya Beauty Salon",
      subtitle: "Beauty Salon",
      area: "3.4 km",
      rating: 4.7,
      reviewCount: 90,
      distanceKm: 3.4,
      tier: "Popular",
      tierColor: "#8D47E7",
      imageUrl: images.beauty,
    },
    {
      id: "quick-mart",
      name: "Quick Mart",
      subtitle: "Grocery Store",
      area: "3.6 km",
      rating: 4.6,
      reviewCount: 86,
      distanceKm: 3.6,
      tier: "New",
      tierColor: "#40A85E",
      imageUrl: images.supermarket,
    },
    {
      id: "tech-hub",
      name: "Tech Hub",
      subtitle: "Electronics Store",
      area: "3.8 km",
      rating: 4.5,
      reviewCount: 124,
      distanceKm: 3.8,
      tier: "Top Rated",
      tierColor: "#C73C35",
      imageUrl: images.electronics,
    },
    {
      id: "homefix",
      name: "HomeFix Pro",
      subtitle: "Home Service",
      area: "4.0 km",
      rating: 4.6,
      reviewCount: 53,
      distanceKm: 4.0,
      tier: "Offer",
      tierColor: "#F4A91F",
      imageUrl: images.service,
    },
  ].map((shop, index) => ({
    ...shop,
    promo:
      ["20% OFF", "Kuzhimandhi", "15% cakes", "Onam offer", undefined, undefined, "Fresh", "Offer", "Bridal", "Popular", "Weekend", "Offer"][index],
  }));
}

function buildSpotlightDeals(images: ReturnType<typeof buildImageBank>): SpotlightDeal[] {
  return [
    {
      id: "weekend-special",
      badge: "20% OFF",
      badgeColor: "#2FA34F",
      title: "Weekend Special",
      description: "Get 20% off on all bakery items",
      business: "Sweet Bakery",
      background: "linear-gradient(135deg,#ebfaef 0%,#f7fff7 62%,#e3f3e7 100%)",
      imageUrl: images.bakery,
    },
    {
      id: "limited-time",
      badge: "₹599",
      badgeColor: "#2E63D8",
      title: "Limited Time Offer",
      description: "Full body health checkup at just ₹599",
      business: "City Care Lab",
      background: "linear-gradient(135deg,#eef4ff 0%,#f9fbff 58%,#e6f0ff 100%)",
      imageUrl: images.clinic,
    },
    {
      id: "fashion-fiesta",
      badge: "15% OFF",
      badgeColor: "#F4A91F",
      title: "Fashion Fiesta",
      description: "Flat 15% off on all men's wear",
      business: "Royale Tailors",
      background: "linear-gradient(135deg,#fff3dd 0%,#fffaf1 58%,#fff2d5 100%)",
      imageUrl: images.suit,
    },
    {
      id: "burger-b1g1",
      badge: "B1G1",
      badgeColor: "#8451D7",
      title: "Buy 1 Get 1",
      description: "On selected burgers & fries",
      business: "ALUKKY Hotel",
      background: "linear-gradient(135deg,#f3ebff 0%,#fbf7ff 58%,#efe2ff 100%)",
      imageUrl: images.burger,
    },
  ];
}

function buildTopOffers(images: ReturnType<typeof buildImageBank>): OfferBanner[] {
  return [
    {
      id: "cleaning-offer",
      eyebrow: "20% Off",
      title: "20% Off",
      description: "On all home cleaning services",
      code: "CLEAN20",
      background: "linear-gradient(135deg,#0E7A4D,#0D5838)",
      imageUrl: images.service,
    },
    {
      id: "hair-spa",
      eyebrow: "₹599 Offer",
      title: "₹599 Offer",
      description: "Hair Spa + Haircut Combo",
      code: "SPA599",
      background: "linear-gradient(135deg,#184693,#0B2F74)",
      imageUrl: images.beauty,
    },
    {
      id: "veg-offer",
      eyebrow: "15% Off",
      title: "15% Off",
      description: "On all fresh vegetables",
      code: "VEG15",
      background: "linear-gradient(135deg,#D1830A,#9B5B00)",
      imageUrl: images.grocery,
    },
    {
      id: "pizza-offer",
      eyebrow: "B1G1",
      title: "B1G1",
      description: "On pizzas",
      code: "PIZZA1",
      background: "linear-gradient(135deg,#14773A,#0B5B2B)",
      imageUrl: images.pizza,
    },
    {
      id: "festival-offer",
      eyebrow: "Festival Offer",
      title: "Festival Offer",
      description: "Up to 30% off on selected items",
      code: "FEST30",
      background: "linear-gradient(135deg,#5A28C7,#2C1E92)",
      imageUrl: images.gifts,
    },
  ];
}

function rgbaFromHex(hex: string, alpha: number) {
  const cleaned = hex.replace("#", "").trim();
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : cleaned;

  const safeHex = normalized.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(safeHex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
