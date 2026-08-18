"use client";

import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  CalendarCheck2,
  Clock3,
  Crown,
  Gift,
  Globe2,
  Handshake,
  LayoutList,
  LocateFixed,
  Map,
  MapPin,
  MessageCircle,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { BncMessageButton } from "@/components/bnc-message-button";
import {
  BookingCard,
  FeatureCheck,
  HomeCategoryCard,
  HomeJobCard,
  HomeOfferCard,
  HomeProductCard,
  HomeTopServiceCard,
  NearbyBusinessCard,
} from "@/components/home/home-cards";
import { HeroSection } from "@/components/home/hero-section";
import { CmsBanners } from "@/components/home/cms-banners";
import {
  BNCStarBadge,
  HomeEmptyState,
  HomeIcon,
  HomeSectionHeader,
  HorizontalCarousel,
} from "@/components/home/home-ui";
import {
  homeCategories,
  popularLocations,
} from "@/lib/home-data";
import type { HomeBusiness, HomePageData, HomeProduct } from "@/lib/home-types";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const offerTabs = ["Nearby", "Popular", "Ending Soon", "Exclusive"] as const;

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.13 }}
      transition={{ duration: 0.48, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function LuckyDrawSection({ draws }: { draws: HomePageData["weeklyDraws"] }) {
  const openDraw = draws.find((draw) => draw.status === "OPEN");
  const latestWinner = draws.find((draw) => draw.status === "PUBLISHED" && draw.winner);
  return (
    <section className="bnc-draw-section" id="weekly-draw" aria-labelledby="draw-heading">
      <div className="bnc-draw-inner">
        <div className="bnc-draw-main">
          <span className="bnc-draw-kicker"><Gift size={16} /> BNC rewards</span>
          <h2 id="draw-heading">{openDraw?.title ?? latestWinner?.title ?? "No active reward draw right now."}</h2>
          <p>{openDraw?.prizeDescription ?? latestWinner?.prizeDescription ?? "Published rewards and their verified eligibility rules will appear here when supplied by the backend."}</p>
          <Link href="/weekly-draw">View draw details <ArrowRight size={16} /></Link>
        </div>
        <aside className="bnc-draw-winners">
          <Gift size={30} />
          <strong>{latestWinner?.winner ? latestWinner.winner.name : "Rewards feed is ready"}</strong>
          <p>{latestWinner?.winner ? `${latestWinner.winner.city} · order ${latestWinner.winner.orderNumber ?? "verified"}` : "No winner or prize data is preloaded."}</p>
          <small>{openDraw ? `Qualifying BNC orders enter automatically; direct purchases use a merchant reward ID · closes ${new Date(openDraw.weekEndsAt).toLocaleDateString("en-IN")}` : "Only published backend records will be shown."}</small>
        </aside>
      </div>
    </section>
  );
}

function BusinessClubSection() {
  const benefits = [
    { title: "Chapter networking", copy: "Build trusted relationships with nearby business owners.", icon: Network },
    { title: "Business referrals", copy: "Share and receive relevant, traceable opportunities.", icon: Handshake },
    { title: "Member discussions", copy: "Exchange practical expertise in moderated groups.", icon: MessageCircle },
    { title: "Events & meetings", copy: "Join district sessions, workshops and state gatherings.", icon: CalendarCheck2 },
    { title: "B2B opportunities", copy: "Source partners, vendors and institutional demand.", icon: BriefcaseBusiness },
    { title: "District & state groups", copy: "Stay connected beyond your immediate chapter.", icon: Globe2 },
  ];

  return (
    <section className="bnc-club-section" id="business-club">
      <div className="bnc-club-inner">
        <Reveal className="bnc-club-copy">
          <span className="bnc-club-badge"><Crown size={16} /> BNC Business Club</span>
          <h2>Grow through the BNC Business Club</h2>
          <p>A member network designed for useful introductions, stronger local commerce and accountable business relationships.</p>
          <div className="bnc-club-actions">
            <Link href="/business/club">Explore Business Club <ArrowRight size={16} /></Link>
            <Link href="/business/add">Join a chapter</Link>
          </div>
        </Reveal>
        <Reveal className="bnc-club-benefits">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title}>
                <span><Icon size={20} /></span>
                <div><h3>{benefit.title}</h3><p>{benefit.copy}</p></div>
              </article>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

function BusinessPromotionSection() {
  return (
    <section className="bnc-section bnc-business-promotion">
      <Reveal className="bnc-promotion-shell">
        <div className="bnc-promotion-copy">
          <span className="bnc-eyebrow">For business owners</span>
          <h2>Grow your business with BNC</h2>
          <p>Build a complete local presence, respond faster and turn nearby demand into measurable growth.</p>
          <ul>
            <FeatureCheck>Reach customers nearby</FeatureCheck>
            <FeatureCheck>List products, services and offers</FeatureCheck>
            <FeatureCheck>Receive enquiries and bookings</FeatureCheck>
            <FeatureCheck>Grow through the Business Club</FeatureCheck>
          </ul>
          <div>
            <Link href="/business/add">List your business <ArrowRight size={16} /></Link>
            <Link href="/pricing">View subscription plans</Link>
          </div>
        </div>
        <aside className="bnc-promotion-proof" aria-label="Ways BNC helps local businesses grow">
          <p>One profile. Three clear ways to grow.</p>
          <ol>
            <li><span>01</span><div><strong>Be discovered</strong><small>Show up when nearby customers are ready to act.</small></div></li>
            <li><span>02</span><div><strong>Respond directly</strong><small>Turn searches into calls, enquiries and bookings.</small></div></li>
            <li><span>03</span><div><strong>Build momentum</strong><small>Learn what works and strengthen your local presence.</small></div></li>
          </ol>
        </aside>
      </Reveal>
    </section>
  );
}

function AppDownloadSection() {
  return (
    <section className="bnc-app-download">
      <div className="bnc-app-download-inner">
        <Reveal className="bnc-app-phone-wrap">
          <div className="bnc-app-phone" aria-label="BNC mobile application interface">
            <div className="bnc-app-phone-top"><span>BNC app</span><span>Online</span></div>
            <div className="bnc-app-brand-row"><strong>BNC</strong><span><BellRing size={15} /></span></div>
            <div className="bnc-app-location"><MapPin size={14} /><span><small>Current location</small>Selected by you</span></div>
            <h3>Find anything nearby.</h3>
            <div className="bnc-app-search"><Search size={16} /><span>Search shops or services</span></div>
            <div className="bnc-app-mini-categories">
              {homeCategories.slice(0, 4).map((category) => (
                <span key={category.id}><HomeIcon name={category.icon} size={16} /><small>{category.name.split(" ")[0]}</small></span>
              ))}
            </div>
            <div className="bnc-app-nearby"><strong>Near you</strong><div><span><Store size={22} /></span><div><strong>Local results</strong><small>Published businesses appear here</small></div></div></div>
            <div className="bnc-app-bottom"><span className="is-active"><Store size={16} />Home</span><span><Search size={16} />Search</span><span><Gift size={16} />Deals</span><span><Users size={16} />Profile</span></div>
          </div>
        </Reveal>
        <Reveal className="bnc-app-copy">
          <span className="bnc-eyebrow">BNC in your pocket</span>
          <h2>Your neighbourhood, one tap away.</h2>
          <p>Save trusted businesses, track quote responses, claim nearby offers and manage appointments from one focused app.</p>
          <div className="bnc-app-benefits">
            <span><MapPin size={18} /><div><strong>True nearby discovery</strong><small>Start within 5 km and expand only when needed.</small></div></span>
            <span><BellRing size={18} /><div><strong>Useful notifications</strong><small>Get booking, offer and enquiry updates without the noise.</small></div></span>
            <span><ShieldCheck size={18} /><div><strong>Privacy controls</strong><small>Choose how and when local businesses can contact you.</small></div></span>
          </div>
          <div className="bnc-store-row">
            <Link href="/app"><span>→</span><div><small>QR, Android & iPhone</small><strong>Open mobile app downloads</strong></div></Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function BncHomepage({ data }: { data: HomePageData }) {
  const homeBusinesses = data.businesses;
  const homeOffers = data.offers;
  const homeProducts = data.products;
  const bestSellers = data.bestSellers;
  const topServices = data.topServices;
  const homeProfessionals = data.professionals;
  const liveCategories = data.categories;
  const liveServices = data.services;
  const premiumHomeBusinesses = homeBusinesses.filter((item) => item.starLevel >= 5);
  const hotelStarBusiness = premiumHomeBusinesses.find((item) => item.business.category === "Hotels & stays");
  const visibleStarBusinesses = hotelStarBusiness
    ? [hotelStarBusiness, ...premiumHomeBusinesses.filter((item) => item.business.id !== hotelStarBusiness.business.id)].slice(0, 3)
    : premiumHomeBusinesses.slice(0, 3);
  const [businessView, setBusinessView] = useState<"list" | "map">("list");
  const [radius, setRadius] = useState("5");
  const [category, setCategory] = useState("All categories");
  const [openOnly, setOpenOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);
  const [activeOfferTab, setActiveOfferTab] = useState<(typeof offerTabs)[number]>("Nearby");
  const [savedBusinesses, setSavedBusinesses] = useState<string[]>([]);
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<HomeBusiness[]>(homeBusinesses);
  const [nearbyProducts, setNearbyProducts] = useState<HomeProduct[]>(homeProducts);
  const [nearbyState, setNearbyState] = useState<"idle" | "locating" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!coordinates) return;
    const controller = new AbortController();
    const loadNearby = async () => {
      setNearbyState("loading");
      try {
        const params = new URLSearchParams({
          latitude: String(coordinates.latitude),
          longitude: String(coordinates.longitude),
          radius,
        });
        const response = await fetch(`/api/discovery/nearby?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Nearby search failed");
        const body = await response.json() as { data?: HomeBusiness[]; products?: Product[] };
        const offersByBusiness = new globalThis.Map<string, string | undefined>(
          homeBusinesses.map((item) => [item.business.id, item.discount]),
        );
        setNearbyBusinesses((body.data ?? []).map((item) => ({
          ...item,
          discount: offersByBusiness.get(item.business.id),
        })));
        setNearbyProducts((body.products ?? []).map((product) => ({
          ...product,
          shopName: product.sellerName ?? "BNC local seller",
        })));
        setNearbyState("ready");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setNearbyState("error");
        }
      }
    };
    void loadNearby();
    return () => controller.abort();
  }, [coordinates, homeBusinesses, radius]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNearbyState("error");
      return;
    }
    setNearbyState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      () => setNearbyState("error"),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 },
    );
  };

  const filteredBusinesses = useMemo(() => nearbyBusinesses.filter((item) => {
    const withinRadius =
      !coordinates ||
      (item.business.distanceKm !== undefined && item.business.distanceKm <= Number(radius));
    const matchesCategory = category === "All categories" || item.business.category === category;
    const matchesOpen = !openOnly || item.business.status !== "closed";
    const matchesOffer = !offersOnly || Boolean(item.discount);
    return withinRadius && matchesCategory && matchesOpen && matchesOffer;
  }), [category, coordinates, nearbyBusinesses, offersOnly, openOnly, radius]);
  const visibleProducts = coordinates ? nearbyProducts : homeProducts;

  const visibleOffers = useMemo(() => {
    const matching = homeOffers.filter((offer) => offer.tab === activeOfferTab);
    return matching.length ? matching : homeOffers;
  }, [activeOfferTab, homeOffers]);
  const toggleBusinessSaved = (id: string) => {
    setSavedBusinesses((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleProductSaved = (id: string) => {
    setSavedProducts((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <div className="bnc-home">
      <HeroSection businesses={homeBusinesses} categories={liveCategories} offers={homeOffers} />
      <CmsBanners placement="HOME_HERO" />

      <section className="bnc-offers-section bnc-offers-priority" aria-labelledby="offers-heading">
        <div className="bnc-section">
          <Reveal>
            <HomeSectionHeader
              eyebrow="Fresh local value"
              title="Deals around you"
              description="Useful discounts from nearby businesses, with clear prices and expiry information."
              href="/offers"
              linkLabel="View all offers"
              headingId="offers-heading"
            />
            <div className="bnc-offer-tabs" role="tablist" aria-label="Filter local offers">
              {offerTabs.map((tab) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeOfferTab === tab}
                  className={cn(activeOfferTab === tab && "is-active")}
                  onClick={() => setActiveOfferTab(tab)}
                  key={tab}
                >
                  {tab}
                </button>
              ))}
            </div>
            {visibleOffers.length ? <HorizontalCarousel label={`${activeOfferTab.toLowerCase()} offers`} className="bnc-offer-carousel">
              {visibleOffers.map((offer) => <HomeOfferCard offer={offer} key={offer.id} />)}
            </HorizontalCarousel> : <HomeEmptyState title="No offers published yet" description="Live business promotions will appear here when the backend supplies them." />}
          </Reveal>
        </div>
      </section>

      <section className="bnc-section bnc-category-section" aria-labelledby="category-heading">
        <Reveal>
          <HomeSectionHeader
            eyebrow="Explore local"
            title="Browse by category"
            description="Start with what you need and see trusted options available close to you."
            href="/categories"
            linkLabel="View all categories"
            headingId="category-heading"
          />
          <div className="bnc-category-grid">
            {liveCategories.map((item) => <HomeCategoryCard category={item} key={item.id} />)}
          </div>
          <Link className="bnc-view-all-button" href="/categories">View all categories <ArrowRight size={16} /></Link>
        </Reveal>
      </section>

      <section className="bnc-section bnc-businesses-section" aria-labelledby="nearby-heading">
        <Reveal>
          <HomeSectionHeader
            eyebrow={coordinates ? "GPS verified radius" : "Local discovery"}
            title={coordinates ? "Businesses near you" : "Find businesses near you"}
            description={coordinates
              ? `Showing published businesses within ${radius} km, ordered by plan level and then earliest plan start.`
              : "Use your current location to calculate a real 5 km radius. No estimated distances are shown."}
            href={coordinates
              ? `/search?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&location=Current+location&radius=${radius}`
              : "/search?location=Kochi&radius=5"}
            linkLabel={coordinates ? "Explore all nearby" : "Open local search"}
            headingId="nearby-heading"
          />
          <div className="bnc-filter-bar" aria-label="Filter nearby businesses">
            <button
              type="button"
              className={cn(coordinates && "is-active")}
              onClick={useCurrentLocation}
              disabled={nearbyState === "locating" || nearbyState === "loading"}
            >
              <LocateFixed size={16} />
              {nearbyState === "locating" ? "Finding location…" : nearbyState === "loading" ? "Loading nearby…" : coordinates ? "Location active" : "Use my location"}
            </button>
            <label>
              <MapPin size={16} />
              <span className="sr-only">Location radius</span>
              <select value={radius} onChange={(event) => setRadius(event.target.value)}>
                <option value="3">Within 3 km</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
              </select>
            </label>
            <label>
              <Store size={16} />
              <span className="sr-only">Business category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option>All categories</option>
                {[...new Set(homeBusinesses.map((item) => item.business.category))].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button type="button" className={cn(openOnly && "is-active")} onClick={() => setOpenOnly((value) => !value)} aria-pressed={openOnly}>
              <Clock3 size={16} /> Open now
            </button>
            <button type="button" className={cn(offersOnly && "is-active")} onClick={() => setOffersOnly((value) => !value)} aria-pressed={offersOnly}>
              <Sparkles size={16} /> Offers available
            </button>
            <div className="bnc-view-toggle" aria-label="Choose business view">
              <button type="button" className={cn(businessView === "list" && "is-active")} onClick={() => setBusinessView("list")} aria-label="List view" aria-pressed={businessView === "list"}><LayoutList size={17} /></button>
              <button type="button" className={cn(businessView === "map" && "is-active")} onClick={() => setBusinessView("map")} aria-label="Map view" aria-pressed={businessView === "map"}><Map size={17} /></button>
            </div>
          </div>

          {businessView === "list" ? (
            filteredBusinesses.length ? (
              <HorizontalCarousel
                label="nearby businesses"
                className="bnc-business-carousel"
                toolbarLabel={coordinates
                  ? `${filteredBusinesses.length} plan-ranked businesses within ${radius} km`
                  : `${filteredBusinesses.length} published businesses · enable location for distance`}
              >
                {filteredBusinesses.map((item) => (
                  <NearbyBusinessCard
                    item={item}
                    key={item.business.id}
                    saved={savedBusinesses.includes(item.business.id)}
                    onToggleSaved={() => toggleBusinessSaved(item.business.id)}
                  />
                ))}
              </HorizontalCarousel>
            ) : (
              <HomeEmptyState
                title={nearbyState === "error" ? "Location could not be used" : "No exact matches in these filters"}
                description={nearbyState === "error"
                  ? "Allow location access in your browser, then try again. You can still search by locality."
                  : "Try a wider radius or remove one filter to see more local businesses."}
              />
            )
          ) : (
            <div className="bnc-map" role="img" aria-label={`Map area for ${filteredBusinesses.length} nearby BNC businesses`}>
              <div className="bnc-map-grid" aria-hidden="true" />
              {filteredBusinesses.slice(0, 5).map((item, index) => (
                <Link
                  className={`bnc-map-pin bnc-map-pin-${index + 1}`}
                  href={`/business/${item.business.slug}`}
                  key={item.business.id}
                  aria-label={`${item.business.name}${item.business.distanceKm !== undefined ? `, ${item.business.distanceKm} kilometres away` : ""}`}
                >
                  <MapPin size={20} fill="currentColor" />
                  <span>{item.business.name}</span>
                </Link>
              ))}
              <div className="bnc-map-summary"><MapPin size={18} /><div><strong>{filteredBusinesses.length} matches nearby</strong><small>Published locations will appear as pins</small></div></div>
            </div>
          )}
        </Reveal>
      </section>

      <section className="bnc-section bnc-star-section" id="star-businesses" aria-labelledby="stars-heading">
        <Reveal>
          <HomeSectionHeader
            eyebrow="Premium local leaders"
            title="Top BNC Star Businesses"
            description="Established businesses with complete profiles, strong feedback and priority response."
            href="/search?premium=true&radius=5"
            linkLabel="See all Star businesses"
            headingId="stars-heading"
          />
          {visibleStarBusinesses.length ? <div className="bnc-star-grid">
            {visibleStarBusinesses.map((item) => (
              <article className={cn("bnc-premium-business", item.starLevel === 6 && "is-six-star")} key={item.business.id}>
                <div className="bnc-premium-image">
                  <Image src={item.business.coverImage} alt={item.business.name} fill sizes="(max-width: 760px) 100vw, 420px" />
                  <span>Featured</span>
                  <BNCStarBadge level={item.starLevel} premium={item.starLevel === 6} planName={item.business.planName} />
                </div>
                <div className="bnc-premium-content">
                  <span>{item.business.category} · {item.business.locality}</span>
                  <h3>{item.business.name} <BadgeCheck size={18} /></h3>
                  <p>{item.business.shortDescription}</p>
                  <div className="bnc-premium-rating"><Star size={14} fill="currentColor" /> {item.business.rating} ({item.business.reviewCount} reviews) <span>· {item.business.distanceKm} km</span></div>
                  <div className="bnc-premium-tags">{item.business.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="bnc-premium-actions">
                    <a href={`tel:${item.business.phone.replace(/\s/g, "")}`}>Call</a>
                    <BncMessageButton businessId={item.business.id} businessName={item.business.name} initialMessage={`Hi, I found ${item.business.name} on BNC and would like more information.`} label="BNC chat" />
                    <Link href={`/business/${item.business.slug}`}>View profile <ArrowRight size={15} /></Link>
                  </div>
                </div>
              </article>
            ))}
          </div> : <HomeEmptyState title="No Star businesses published yet" description="Eligible premium profiles will appear after backend verification." />}
        </Reveal>
      </section>

      <section className="bnc-booking-section" id="bookings" aria-labelledby="bookings-heading">
        <div className="bnc-section">
          <Reveal>
            <HomeSectionHeader
              eyebrow="Easy appointments"
              title="Book appointments instantly"
              description="Find the right professional, check the next available slot and request a booking."
              href="/bookings"
              linkLabel="Explore appointments"
              headingId="bookings-heading"
            />
            <div className="bnc-service-shortcuts">
              {liveServices.map((service) => (
                <Link href={`/bookings?q=${encodeURIComponent(service.name)}`} key={service.id}>
                  <span><HomeIcon name={service.icon} size={20} /></span>
                  <div><strong>{service.name}</strong><small>{service.availableProviders} available</small></div>
                </Link>
              ))}
            </div>
            <div className="bnc-booking-list-heading">
              <strong>Available near you</strong>
              <span>Fresh appointment options within 5 km</span>
            </div>
            {homeProfessionals.length ? <HorizontalCarousel label="appointment options" className="bnc-booking-carousel">
              {homeProfessionals.map((professional) => <BookingCard professional={professional} key={professional.id} />)}
            </HorizontalCarousel> : <HomeEmptyState title="No appointments published yet" description="Provider availability will appear when supplied by the backend." />}
          </Reveal>
        </div>
      </section>

      <section className="bnc-section bnc-products-section" aria-labelledby="products-heading">
        <Reveal>
          <HomeSectionHeader
            eyebrow="Local marketplace"
            title="Popular products near you"
            description={coordinates
              ? `Sponsored products and local matches within ${radius} km. Distance limits apply before plan priority.`
              : "Browse useful products from local sellers with direct enquiries and delivery details."}
            href="/products"
            linkLabel="View all products"
            headingId="products-heading"
          />
          {visibleProducts.length ? <HorizontalCarousel
            label="popular local products"
            className="bnc-product-carousel"
            toolbarLabel={`${visibleProducts.length} useful products nearby`}
          >
            {visibleProducts.map((product) => (
              <HomeProductCard
                product={product}
                key={product.id}
                saved={savedProducts.includes(product.id)}
                onToggleSaved={() => toggleProductSaved(product.id)}
              />
            ))}
          </HorizontalCarousel> : <HomeEmptyState title="No products published yet" description="Marketplace items will appear when sellers publish them through the backend." />}
        </Reveal>
      </section>

      <section className="bnc-section bnc-products-section bnc-wide-discovery-section" aria-labelledby="best-sellers-heading">
        <Reveal>
          <HomeSectionHeader
            eyebrow="Delivered across Kerala"
            title="Best sellers that courier to you"
            description="Popular products with confirmed courier delivery. Sellers in this collection may be outside your selected nearby radius."
            href="/products?sort=best-selling&courier=true"
            linkLabel="View courier products"
            headingId="best-sellers-heading"
          />
          {bestSellers.length ? <HorizontalCarousel
            label="courier-enabled best sellers"
            className="bnc-product-carousel"
            toolbarLabel={`${bestSellers.length} best-selling products with courier delivery`}
          >
            {bestSellers.map((product) => (
              <HomeProductCard
                product={product}
                key={product.id}
                saved={savedProducts.includes(product.id)}
                onToggleSaved={() => toggleProductSaved(product.id)}
              />
            ))}
          </HorizontalCarousel> : <HomeEmptyState title="No courier best sellers yet" description="Products will appear here after they record completed sales and the seller enables courier delivery." />}
        </Reveal>
      </section>

      <section className="bnc-section bnc-top-services-section bnc-wide-discovery-section" aria-labelledby="top-services-heading">
        <Reveal>
          <HomeSectionHeader
            eyebrow="Trusted beyond nearby"
            title="Top-rated services"
            description="Discover highly rated verified providers even outside your nearby radius. Their location is shown so you can confirm remote or travel coverage."
            href="/services?sort=top-rated"
            linkLabel="View top services"
            headingId="top-services-heading"
          />
          {topServices.length ? <HorizontalCarousel
            label="top-rated services"
            className="bnc-top-service-carousel"
            toolbarLabel={`${topServices.length} highly rated services`}
          >
            {topServices.map((service) => <HomeTopServiceCard service={service} key={service.id} />)}
          </HorizontalCarousel> : <HomeEmptyState title="No top-rated services yet" description="Verified provider ratings and reviews will determine which services appear here." />}
        </Reveal>
      </section>

      <section className="bnc-jobs-section" id="jobs" aria-labelledby="jobs-heading">
        <div className="bnc-section">
          <Reveal>
            <HomeSectionHeader
              eyebrow="Work close to home"
              title="Latest jobs near you"
              description="Discover local roles from businesses whose services and reputation you can already review on BNC."
              action={<Link className="bnc-post-job-button" href="/business/jobs"><BriefcaseBusiness size={16} /> Post a job</Link>}
              headingId="jobs-heading"
            />
            {data.jobs.length ? <HorizontalCarousel
              label="latest nearby jobs"
              className="bnc-job-carousel"
              toolbarLabel={`${data.jobs.length} local roles available`}
            >
              {data.jobs.map((job) => <HomeJobCard job={job} key={job.id} />)}
            </HorizontalCarousel> : <HomeEmptyState title="No jobs published yet" description="Business job posts will appear here when the backend supplies them." />}
          </Reveal>
        </div>
      </section>

      <LuckyDrawSection draws={data.weeklyDraws} />
      <BusinessClubSection />
      <BusinessPromotionSection />

      <section className="bnc-section bnc-locations-section" aria-labelledby="locations-heading">
        <Reveal>
          <HomeSectionHeader
            eyebrow="Across Kerala"
            title="Explore popular locations"
            description="Discover BNC businesses in the neighbourhoods where people live, work and shop."
            href="/locations"
            linkLabel="Browse all locations"
            headingId="locations-heading"
          />
          <div className="bnc-location-grid">
            {popularLocations.map((location) => (
              <Link href={`/${location.name.toLowerCase().replace(/\s+/g, "-")}`} key={location.name}>
                <span><MapPin size={18} /></span>
                <div><strong>{location.name}</strong><small>{location.district}</small><p>{location.neighbourhoods}</p></div>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <AppDownloadSection />
    </div>
  );
}
