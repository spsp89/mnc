"use client";

import Image from "next/image";
import { Check, Clock3, Copy, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BncMessageButton } from "@/components/bnc-message-button";
import { PortalHero } from "@/components/portal-hero";
import type { PublicOffer } from "@/lib/public-api";

type CustomerOffer = PublicOffer & { privateOffer?: boolean };
type PrivateOfferRecord = {
  id: string;
  businessId: string;
  title: string;
  description: string;
  type: string;
  discountValue: number | string | null;
  couponCode: string | null;
  minimumSpend: number | string | null;
  endsAt: string;
  products: unknown[];
  services: unknown[];
  business: {
    name: string;
    slug: string;
    coverImageUrl: string | null;
    locations: Array<{ locality: string; city: string }>;
  };
};

const fallbackImage = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80";
const discountLabel = (type: string, value: number) => type === "PERCENTAGE" ? `${value}% off` : type === "FLAT" ? `₹${value} off` : "Private offer";

export function OffersView({ liveOffers }: { liveOffers: PublicOffer[] }) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [privateOffers, setPrivateOffers] = useState<CustomerOffer[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/offers/mine", { signal: controller.signal, credentials: "same-origin" }).then(async (response) => {
      if (response.status === 401 || response.status === 403) return;
      const body = await response.json() as { data?: PrivateOfferRecord[] };
      if (!response.ok) return;
      setPrivateOffers((body.data ?? []).map((offer) => {
        const location = offer.business.locations[0];
        const value = Number(offer.discountValue ?? 0);
        return {
          id: offer.id,
          title: offer.title,
          description: offer.description,
          code: offer.couponCode ?? undefined,
          discount: discountLabel(offer.type, value),
          expiresAt: offer.endsAt,
          businessId: offer.businessId,
          businessName: offer.business.name,
          businessSlug: offer.business.slug,
          category: offer.products.length ? "Private product offer" : offer.services.length ? "Private service offer" : "Private offer for you",
          locality: location?.locality ?? "Kerala",
          city: location?.city ?? "Kerala",
          whatsapp: "",
          image: offer.business.coverImageUrl || fallbackImage,
          discountValue: value,
          discountType: offer.type,
          minimumSpend: Number(offer.minimumSpend ?? 0),
          featured: false,
          privateOffer: true,
        };
      }));
    }).catch(() => undefined);
    return () => controller.abort();
  }, []);
  const availableOffers = useMemo<CustomerOffer[]>(() => [...privateOffers, ...liveOffers], [privateOffers, liveOffers]);
  const offers = useMemo(
    () => availableOffers.filter((offer) =>
      `${offer.title} ${offer.businessName} ${offer.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
    [availableOffers, query],
  );

  const copyCode = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <>
      <PortalHero
        eyebrow="Local offers"
        title={<>A better reason to <em>shop nearby.</em></>}
        description="Current promotions published by local businesses, with the details you need before making contact."
        image={availableOffers[0]?.image}
        imageAlt={availableOffers[0] ? `${availableOffers[0].businessName} local business offer` : "BNC local offers"}
        tone="offers-hero"
        mediaLabel="Fresh promotions from local businesses"
      >
        <label className="catalog-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search offers or businesses" />
        </label>
      </PortalHero>
      <section className="page-section catalog-section">
        <div className="catalog-toolbar">
          <strong>{offers.length} current offers</strong>
          <span>{privateOffers.length ? `${privateOffers.length} private offer${privateOffers.length === 1 ? "" : "s"} for you` : "Published offers only"}</span>
        </div>
        <div className="offers-directory-grid">
          {offers.map((offer) => (
            <article key={offer.id}>
              <div className="offer-directory-media">
                <Image src={offer.image} alt={`${offer.businessName} offer`} fill sizes="(max-width: 620px) 100vw, 270px" />
                <strong>{offer.discount}</strong>
              </div>
              <div className="offer-directory-copy">
                <span>{offer.privateOffer ? "Private · " : ""}{offer.category}</span>
                <h2>{offer.title}</h2>
                <strong>{offer.businessName}</strong>
                <p>{offer.description}</p>
                <div><span><MapPin size={13} /> {offer.locality}, {offer.city}</span><span><Clock3 size={13} /> Ends {new Date(offer.expiresAt).toLocaleDateString("en-IN")}</span></div>
              </div>
              <div className="offer-directory-action">
                {offer.code ? (
                  <button type="button" onClick={() => copyCode(offer.id, offer.code!)}>
                    {copied === offer.id ? <Check size={15} /> : <Copy size={15} />}
                    {copied === offer.id ? "Copied" : offer.code}
                  </button>
                ) : <span>Ask for this offer</span>}
                <BncMessageButton
                  businessId={offer.businessId}
                  businessName={offer.businessName}
                  initialMessage={`Hi, I found the “${offer.title}” offer on BNC. Is it available?`}
                  label="Check in BNC chat"
                />
              </div>
            </article>
          ))}
        </div>
        {!offers.length && <div className="empty-state"><Search size={30} /><h2>No offers published yet</h2><p>Live promotions supplied by businesses will appear here.</p></div>}
      </section>
    </>
  );
}
