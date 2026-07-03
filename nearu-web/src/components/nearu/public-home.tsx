import type { ReactNode } from "react";

import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Grid2X2,
  Heart,
  House,
  HousePlus,
  LayoutGrid,
  MapPin,
  MonitorSmartphone,
  Scissors,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SmilePlus,
  Sparkles,
  Star,
  Store,
  Tag,
  UserRound,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";

import { BusinessGraphic, DealGraphic, HeroGraphic, MapMock } from "@/components/nearu/graphics";
import { platformSections, type PlatformSection } from "@/lib/platform-sections";

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

const iconMap = {
  "shopping-cart": ShoppingCart,
  "utensils-crossed": UtensilsCrossed,
  scissors: Scissors,
  sparkles: Sparkles,
  "monitor-smartphone": MonitorSmartphone,
  "house-plus": HousePlus,
  "layout-grid": LayoutGrid,
};

const filterLabels = [
  "All",
  "Restaurants",
  "Grocery",
  "Beauty",
  "Tailors",
  "Electronics",
  "Home Services",
];

const categoryPalette = [
  { backgroundColor: "rgba(244, 178, 39, 0.14)", color: "var(--gold)" },
  { backgroundColor: "rgba(11, 47, 116, 0.12)", color: "var(--navy)" },
  { backgroundColor: "rgba(199, 137, 8, 0.14)", color: "var(--gold-deep)" },
  { backgroundColor: "rgba(28, 78, 161, 0.12)", color: "var(--navy-bright)" },
];

export function PublicHome({ data }: { data: CatalogView }) {
  const extendedSections = platformSections.filter((section) => section.id !== "discover");

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--navy)]">
      <section
        id="discover"
        className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_#1c4ea1,_#0b2f74_40%,_#041c55_100%)] text-white"
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute right-12 top-16 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute bottom-24 right-0 h-px w-[48%] bg-white/20" />
          <div className="absolute bottom-32 right-24 h-px w-[36%] bg-white/15" />
          <div className="absolute bottom-40 right-44 h-px w-[28%] bg-white/10" />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 lg:px-10">
          <header className="mb-8 flex flex-wrap items-center gap-4 lg:flex-nowrap">
            <div className="flex items-center gap-2 text-3xl font-black">
              <MapPin className="h-8 w-8 fill-[var(--gold)] text-[var(--gold)]" />
              <span>Nearu</span>
            </div>

            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90">
              <MapPin className="h-4 w-4" />
              <span>Kozhikode, Kerala</span>
              <ChevronDown className="h-4 w-4" />
            </div>

            <nav className="ml-auto hidden items-center gap-8 text-sm font-semibold text-white/90 lg:flex">
              {["Home", "Categories", "Shops & Pros", "Deals", "Bookings", "Help"].map(
                (item, index) => (
                  <span
                    key={item}
                    className={
                      index === 0
                        ? "border-b-2 border-[var(--gold)] pb-2 text-[var(--gold)]"
                        : "pb-2"
                    }
                  >
                    {item}
                  </span>
                ),
              )}
            </nav>

            <div className="ml-auto flex items-center gap-3 lg:ml-6">
              <button className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/5">
                <Search className="h-5 w-5" />
              </button>
              <button className="rounded-2xl border border-white/12 px-5 py-3 text-sm font-bold text-white">
                Sign in
              </button>
              <button className="rounded-2xl bg-[var(--gold)] px-5 py-3 text-sm font-extrabold text-[var(--navy)]">
                List Your Business
              </button>
            </div>
          </header>

          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="max-w-[560px]">
              <h1 className="text-[3rem] font-black leading-[0.98] tracking-[-0.04em] sm:text-[4.25rem]">
                Discover the best
                <span className="mt-2 block text-[var(--gold)]">
                  products &amp; services
                </span>
                <span className="mt-2 block text-[var(--gold)]">near you</span>
              </h1>
              <p className="mt-6 max-w-[430px] text-lg leading-8 text-white/88">
                From local favorites to trusted professionals, everything you need,
                all in one place.
              </p>
            </div>

            <div className="flex items-end justify-center lg:justify-end">
              <HeroGraphic />
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[28px] bg-white p-2 shadow-[0_16px_30px_rgba(1,9,30,0.2)]">
            <div className="flex flex-col gap-2 lg:flex-row">
              <div className="flex min-h-[64px] flex-1 items-center gap-4 px-4 text-[var(--muted)]">
                <Search className="h-6 w-6" />
                <span className="font-medium">Search products, shops or services</span>
              </div>
              <div className="hidden min-h-[64px] items-center gap-3 border-l border-[var(--line)] px-5 text-sm font-semibold text-[var(--navy)] lg:flex">
                <Grid2X2 className="h-4 w-4" />
                All Categories
                <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
              </div>
              <div className="hidden min-h-[64px] items-center gap-3 border-l border-[var(--line)] px-5 text-sm font-semibold text-[var(--navy)] lg:flex">
                <MapPin className="h-4 w-4" />
                Kozhikode, Kerala
              </div>
              <button className="rounded-[22px] bg-[var(--gold)] px-10 py-4 text-base font-extrabold text-[var(--navy)]">
                Search
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 rounded-[28px] border border-white/12 bg-[rgba(8,32,82,0.72)] px-5 py-5 shadow-[0_18px_30px_rgba(3,18,53,0.2)] sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={<Grid2X2 className="h-7 w-7 text-[var(--gold)]" />}
              value={`${data.stats.categories}+`}
              label="Categories"
            />
            <Stat
              icon={<Store className="h-7 w-7 text-[var(--gold)]" />}
              value={`${data.stats.businesses}+`}
              label="Shops & Pros"
            />
            <Stat
              icon={<SmilePlus className="h-7 w-7 text-[var(--gold)]" />}
              value={data.stats.happyUsers}
              label="Happy Users"
            />
            <Stat
              icon={<ShieldCheck className="h-7 w-7 text-[var(--gold)]" />}
              value="Trusted"
              label="& Verified"
            />
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-30 border-y border-[#223746] bg-[#13222d]/95 shadow-[0_14px_34px_rgba(7,13,24,0.24)] backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-10">
          {platformSections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`shrink-0 rounded-full px-5 py-2.5 text-[15px] font-semibold transition ${
                index === 0
                  ? "bg-[var(--gold)] text-[var(--navy)]"
                  : section.id === "explain"
                    ? "text-[#f1b3b3]"
                    : "text-white/80 hover:text-white"
              }`}
            >
              {section.label}
            </a>
          ))}
        </div>
      </div>

      <main className="-mt-10 pb-16">
        <div className="mx-auto max-w-[1440px] rounded-t-[38px] bg-white px-4 pb-12 pt-6 shadow-[0_18px_45px_rgba(9,32,77,0.08)] sm:px-6 lg:px-10">
          <section className="mb-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#7d2232]">
                  BNC ecosystem
                </p>
                <h2 className="mt-2 text-[2rem] font-black text-[var(--navy)]">
                  Every BNC section, placed up front
                </h2>
                <p className="mt-3 max-w-[760px] text-sm leading-7 text-[var(--muted)]">
                  Business Card, B2B Network, Jobs, Be A Winner, Community Feed,
                  Plans, Merchant Dashboard, Admin &amp; Partners and Explanations now
                  sit near the top of the experience instead of being buried lower in
                  the page.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {extendedSections.map((section) => (
                <PlatformSectionCard
                  key={section.id}
                  section={section}
                  business={
                    section.imageHint
                      ? selectBusinessVisual(data, section.imageHint)
                      : undefined
                  }
                />
              ))}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
            {data.categories.map((category, index) => {
              const Icon = iconMap[category.icon as keyof typeof iconMap] ?? LayoutGrid;
              const swatch = category.isActive
                ? { backgroundColor: "var(--navy)", color: "#ffffff" }
                : categoryPalette[index % categoryPalette.length];
              return (
                <div
                  key={category.id}
                  className="rounded-[24px] border border-[var(--line)] bg-white px-4 py-5 text-center shadow-[0_8px_22px_rgba(9,32,77,0.04)]"
                >
                  <div
                    className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[18px]"
                    style={swatch}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="text-[15px] font-bold leading-5 text-[var(--navy)]">
                    {category.name}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-6 flex max-w-[450px] rounded-full border border-[var(--line)] bg-[var(--soft)] p-1">
            <div className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-4 py-4 font-bold text-white">
              <ShoppingBag className="h-4 w-4" />
              Products
            </div>
            <div className="flex flex-1 items-center justify-center gap-2 px-4 py-4 font-bold text-[var(--muted)]">
              <Wrench className="h-4 w-4" />
              Services
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
            <section className="rounded-[28px] border border-[#f1d58c] bg-[linear-gradient(135deg,#fff9ea,#fff2d0_55%,#fffaf2)] px-6 py-5">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="max-w-[320px]">
                  <h2 className="text-[2rem] font-black leading-[1.05] text-[var(--navy)]">
                    Big savings,
                    <br />
                    right around you!
                  </h2>
                  <p className="mt-4 text-base leading-7 text-[#496488]">
                    Exclusive offers on top products &amp; services near you.
                  </p>
                  <button className="mt-5 rounded-2xl bg-[var(--navy)] px-5 py-3 font-bold text-white">
                    Explore Deals
                  </button>
                </div>
                <div className="ml-auto">
                  <DealGraphic />
                </div>
              </div>
            </section>

            <aside className="rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[0_12px_30px_rgba(9,32,77,0.05)]">
              <h3 className="text-xl font-black text-[var(--navy)]">Explore near you</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Discover top-rated places around
              </p>
              <div className="mt-4">
                <MapMock />
              </div>
              <button className="mt-5 w-full rounded-2xl border border-[#d7dfeb] px-5 py-4 font-bold text-[var(--navy)]">
                Search this area
              </button>
            </aside>
          </div>

          <SectionTitle title="Featured near you" action="View all" />
          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {data.featured.map((business) => (
              <FeatureCard key={business.id} business={business} />
            ))}
          </div>

          <SectionTitle title="Popular near you" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {filterLabels.map((label, index) => (
              <button
                key={label}
                className={`rounded-full px-6 py-3 text-sm font-bold ${
                  index === 0
                    ? "bg-[var(--navy)] text-white"
                    : "bg-[var(--soft)] text-[var(--navy)]"
                }`}
              >
                {label}
              </button>
            ))}
            <button className="ml-auto flex items-center gap-2 rounded-full border border-[var(--line)] px-6 py-3 text-sm font-bold text-[var(--navy)]">
              Filters
              <Tag className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {data.popular.map((business) => (
              <PopularCard key={business.id} business={business} />
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-[var(--navy)] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.25fr_0.7fr_0.9fr_0.9fr_0.9fr_1.2fr] lg:px-10">
          <div>
            <div className="flex items-center gap-2 text-3xl font-black">
              <MapPin className="h-8 w-8 fill-[var(--gold)] text-[var(--gold)]" />
              <span>Nearu</span>
            </div>
            <p className="mt-4 max-w-[260px] text-sm leading-7 text-white/80">
              Discover the best products &amp; services near you. Local, trusted and
              convenient.
            </p>
            <div className="mt-5 flex gap-3">
              {[House, Search, Tag, UserRound].map((Icon, index) => (
                <div
                  key={index}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10"
                >
                  <Icon className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>

          <FooterCol
            title="Explore"
            items={["Categories", "Shops & Pros", "Deals", "Bookings"]}
          />
          <FooterCol
            title="For Businesses"
            items={["List Your Business", "Business Login", "Resources", "Pricing"]}
          />
          <FooterCol
            title="Company"
            items={["About Us", "Careers", "Blog", "Contact Us"]}
          />
          <FooterCol
            title="Support"
            items={["Help Center", "Terms of Use", "Privacy Policy", "Sitemap"]}
          />

          <div>
            <h4 className="text-lg font-black">Stay in the loop</h4>
            <p className="mt-3 text-sm leading-7 text-white/80">
              Get updates on the best deals &amp; offers near you.
            </p>
            <div className="mt-5 flex gap-3">
              <div className="flex-1 rounded-2xl border border-white/15 px-4 py-4 text-sm text-white/55">
                Enter your email
              </div>
              <button className="rounded-2xl bg-[var(--gold)] px-6 py-4 font-bold text-[var(--navy)]">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4">
      {icon}
      <div>
        <div className="text-xl font-black text-white">{value}</div>
        <div className="text-sm text-white/78">{label}</div>
      </div>
    </div>
  );
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mt-10 flex items-center">
      <h2 className="text-[2rem] font-black text-[var(--navy)]">{title}</h2>
      {action ? (
        <Link
          href="/admin"
          className="ml-auto inline-flex items-center gap-1 text-sm font-bold text-[var(--muted)]"
        >
          {action}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function FeatureCard({ business }: { business: BusinessItem }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-white shadow-[0_14px_30px_rgba(9,32,77,0.08)]">
      <div className="relative h-[170px] bg-slate-950">
        <BusinessPhoto business={business} darken />
        {business.badgeText ? (
          <div
            className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-black text-white"
            style={{ backgroundColor: business.badgeColor ?? "#1d4ed8" }}
          >
            {business.badgeText}
          </div>
        ) : null}
        <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/25 text-white">
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3 px-4 py-4">
        <div>
          <h3 className="text-xl font-black text-[var(--navy)]">{business.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{business.subtitle} / {business.area}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
            {business.rating.toFixed(1)} ({business.reviewCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {business.distanceKm.toFixed(1)} km
          </span>
        </div>
      </div>
    </article>
  );
}

function PopularCard({ business }: { business: BusinessItem }) {
  return (
    <article className="flex gap-4 rounded-[24px] border border-[var(--line)] bg-white p-3 shadow-[0_10px_24px_rgba(9,32,77,0.06)]">
      <div className="h-24 w-28 shrink-0 overflow-hidden rounded-[18px] bg-slate-100">
        <BusinessPhoto business={business} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-black text-[var(--navy)]">
              {business.name}
            </h3>
            <p className="truncate text-sm text-[var(--muted)]">{business.subtitle}</p>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-full text-[var(--muted)]">
            <Heart className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
            {business.rating.toFixed(1)} ({business.reviewCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {business.distanceKm.toFixed(1)} km
          </span>
        </div>
      </div>
    </article>
  );
}

function PlatformSectionCard({
  section,
  business,
}: {
  section: PlatformSection;
  business?: BusinessItem;
}) {
  const isExplain = section.id === "explain";

  return (
    <article
      id={section.id}
      className={`rounded-[28px] border p-5 shadow-[0_16px_34px_rgba(9,32,77,0.08)] ${
        isExplain ? "text-white" : "text-[var(--navy)]"
      }`}
      style={{
        borderColor: rgbaFromHex(section.accent, isExplain ? 0.42 : 0.18),
        background: isExplain
          ? `linear-gradient(135deg, #13222d, ${section.accent})`
          : `linear-gradient(135deg, ${rgbaFromHex(section.accent, 0.14)}, #ffffff 62%)`,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] text-[11px] font-black tracking-[0.12em]"
          style={{
            backgroundColor: isExplain
              ? "rgba(255,255,255,0.14)"
              : rgbaFromHex(section.accent, 0.14),
            color: isExplain ? "#ffffff" : section.accent,
          }}
        >
          {section.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[11px] font-black uppercase tracking-[0.24em] ${
              isExplain ? "text-white/70" : ""
            }`}
            style={isExplain ? undefined : { color: section.accent }}
          >
            {section.eyebrow}
          </p>
          <h3
            className={`mt-2 text-2xl font-black leading-tight ${
              isExplain ? "text-white" : "text-[var(--navy)]"
            }`}
          >
            {section.title}
          </h3>
        </div>

        {section.badge ? (
          <span
            className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black"
            style={{
              backgroundColor: isExplain
                ? "rgba(255,255,255,0.16)"
                : section.accent,
              color: isExplain ? "#ffffff" : "#ffffff",
            }}
          >
            {section.badge}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_118px]">
        <div>
          <p
            className={`text-sm leading-7 ${
              isExplain ? "text-white/82" : "text-[var(--muted)]"
            }`}
          >
            {section.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {section.highlights.map((item) => (
              <span
                key={item}
                className={`rounded-full px-3 py-2 text-xs font-bold ${
                  isExplain ? "text-white" : "text-[var(--navy)]"
                }`}
                style={{
                  backgroundColor: isExplain
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.9)",
                  border: `1px solid ${rgbaFromHex(section.accent, isExplain ? 0.22 : 0.16)}`,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <PlatformSectionVisual
          section={section}
          business={business}
          invert={isExplain}
        />
      </div>
    </article>
  );
}

function PlatformSectionVisual({
  section,
  business,
  invert = false,
}: {
  section: PlatformSection;
  business?: BusinessItem;
  invert?: boolean;
}) {
  if (business) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-white/20 bg-white shadow-[0_12px_24px_rgba(9,32,77,0.1)]">
        <div className="relative h-[164px] w-full min-w-[118px]">
          <BusinessPhoto business={business} darken />
          <div
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black text-white"
            style={{ backgroundColor: section.accent }}
          >
            {section.badge ?? section.emoji}
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent px-3 pb-3 pt-8">
            <div className="text-sm font-black text-white">{business.name}</div>
            <div className="mt-1 text-[11px] text-white/80">{business.subtitle}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-[164px] flex-col items-center justify-center rounded-[24px] border px-4 py-5 text-center ${
        invert ? "text-white" : "text-[var(--navy)]"
      }`}
      style={{
        backgroundColor: invert ? "rgba(255,255,255,0.08)" : "#ffffff",
        borderColor: rgbaFromHex(section.accent, invert ? 0.22 : 0.16),
      }}
    >
      <div
        className="grid h-16 w-16 place-items-center rounded-full text-[13px] font-black tracking-[0.14em]"
        style={{
          backgroundColor: invert
            ? "rgba(255,255,255,0.14)"
            : rgbaFromHex(section.accent, 0.14),
          color: invert ? "#ffffff" : section.accent,
        }}
      >
        {section.emoji}
      </div>
      <div className="mt-4 text-sm font-black leading-6">
        {section.highlights[0]}
      </div>
      <div className={`mt-2 text-xs ${invert ? "text-white/72" : "text-[var(--muted)]"}`}>
        {section.highlights[1]}
      </div>
    </div>
  );
}

function BusinessPhoto({
  business,
  darken = false,
}: {
  business: BusinessItem;
  darken?: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">
        <BusinessGraphic variant={business.coverVariant} />
      </div>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${business.imageUrl})` }}
      />
      {darken ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
      ) : null}
    </div>
  );
}

function uniqueBusinesses(data: CatalogView) {
  const items = [...data.featured, ...data.popular];
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.id || item.name;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function selectBusinessVisual(data: CatalogView, hint?: string) {
  const items = uniqueBusinesses(data);
  const needle = hint?.trim().toLowerCase();

  if (needle) {
    const matched = items.find((item) =>
      `${item.name} ${item.subtitle} ${item.coverVariant}`.toLowerCase().includes(needle),
    );

    if (matched) {
      return matched;
    }
  }

  return items[0];
}

function rgbaFromHex(hex: string, alpha: number) {
  const cleaned = hex.replace("#", "").trim();
  const normalized = cleaned.length === 3
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

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-lg font-black">{title}</h4>
      <ul className="mt-4 space-y-3 text-sm text-white/78">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
