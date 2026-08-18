"use client";

import {
  BadgeCheck,
  Bookmark,
  Clock3,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BncMessageButton } from "@/components/bnc-message-button";
import { Rating } from "@/components/rating";
import { BNCStarBadge } from "@/components/home/home-ui";
import type { Business } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BusinessCard({
  business,
  layout = "grid",
}: {
  business: Business;
  layout?: "grid" | "list";
}) {
  const [saved, setSaved] = useState(false);

  return (
    <article className={cn("business-card", layout === "list" && "business-card-list")}>
      <div className="business-card-image">
        <Image
          src={business.coverImage}
          alt={`${business.name} business`}
          fill
          sizes={layout === "list" ? "(max-width: 760px) 100vw, 280px" : "(max-width: 760px) 86vw, 320px"}
        />
        <div className="business-labels">
          {business.sponsored && <span className="sponsored-label">Sponsored</span>}
          {business.offer && <span className="offer-label">{business.offer.discount}</span>}
        </div>
        <button
          type="button"
          className={cn("save-card-button", saved && "saved")}
          onClick={() => setSaved((value) => !value)}
          aria-label={saved ? `Remove ${business.name} from saved` : `Save ${business.name}`}
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="business-card-content">
        <div className="business-card-title-row">
          <div>
            <p>{business.subcategory}</p>
            <h3>
              <Link href={`/business/${business.slug}`}>{business.name}</Link>
              {business.verified && <BadgeCheck size={18} aria-label="Verified business" />}
            </h3>
          </div>
          <Rating value={business.rating} count={business.reviewCount} />
        </div>
        <div className="business-plan-row">
          <BNCStarBadge level={business.bncStarLevel} premium={business.bncStarLevel === 6} planName={business.planName} />
        </div>
        {!!business.permanentDiscountPercent && (
          <div className="business-permanent-discount">
            {business.permanentDiscountPercent}% permanent discount
            {business.permanentDiscountLabel ? ` · ${business.permanentDiscountLabel}` : ""}
          </div>
        )}
        <p className="business-description">{business.shortDescription}</p>
        <div className="business-meta">
          <span>
            <MapPin size={15} /> {business.locality}
            {business.distanceKm !== undefined ? ` · ${business.distanceKm} km` : ""}
          </span>
          <span className={`status-${business.status}`}>
            <Clock3 size={15} />
            {business.status === "open" ? `Open until ${business.closesAt}` : business.status === "closing-soon" ? `Closes ${business.closesAt}` : "Closed"}
          </span>
        </div>
        <div className="business-tags">
          {business.tags.slice(0, layout === "list" ? 4 : 3).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        {layout === "list" && (
          <div className="list-extra">
            <span>{business.priceRange} · {business.responseTime}</span>
            {business.offer && <strong>{business.offer.title}</strong>}
          </div>
        )}
        <div className="business-actions">
          <a className="action-primary" href={`tel:${business.phone.replace(/\s/g, "")}`}>
            <Phone size={16} /> Call
          </a>
          <BncMessageButton
            businessId={business.id}
            businessName={business.name}
            initialMessage={`Hi, I found ${business.name} on BNC and would like more information.`}
            label="BNC chat"
            className="action-secondary"
          />
          <Link className="action-icon" href={`/business/${business.slug}#enquiry`} aria-label={`Get a quote from ${business.name}`}>
            <Navigation size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}
