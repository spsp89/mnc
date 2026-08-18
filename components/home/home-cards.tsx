"use client";

import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Heart,
  IndianRupee,
  MapPin,
  Navigation,
  Phone,
  Send,
  Star,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { BncMessageButton } from "@/components/bnc-message-button";
import { HomeIcon, BNCStarBadge } from "@/components/home/home-ui";
import type {
  HomeBusiness,
  HomeCategory,
  HomeJob,
  HomeOffer,
  HomeProduct,
  HomeProfessional,
  HomeTopService,
} from "@/lib/home-types";
import { categoryImage } from "@/lib/category-images";
import { cn } from "@/lib/utils";

export function HomeCategoryCard({ category }: { category: HomeCategory }) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.18 }}>
      <Link
        className={cn("bnc-category-card", category.featured && "is-featured")}
        href={`/products?category=${encodeURIComponent(category.catalogueSlug)}`}
      >
        <Image className="bnc-category-background" src={categoryImage(category.catalogueSlug)} alt="" fill sizes="(max-width: 640px) 46vw, 180px" aria-hidden="true" />
        <span className="bnc-category-shade" aria-hidden="true" />
        <span className="bnc-category-icon"><HomeIcon name={category.icon} size={25} /></span>
        <span className="bnc-category-copy">
          <strong>{category.name}</strong>
          <small>{category.productCount} product{category.productCount === 1 ? "" : "s"}</small>
        </span>
        <ArrowRight className="bnc-category-arrow" size={17} />
      </Link>
    </motion.div>
  );
}

export function NearbyBusinessCard({
  item,
  saved,
  onToggleSaved,
}: {
  item: HomeBusiness;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const { business } = item;
  const hasCurrentOffer = Boolean(item.discount || business.permanentDiscountPercent);
  return (
    <motion.article
      className={cn("bnc-nearby-card", item.starLevel === 6 && "is-six-star")}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18 }}
    >
      <div className="bnc-nearby-image">
        <Image
          src={business.coverImage}
          alt={`${business.name} in ${business.locality}`}
          fill
          sizes="(max-width: 640px) 82vw, (max-width: 1024px) 42vw, 330px"
        />
        <div className="bnc-nearby-badges">
          <BNCStarBadge level={item.starLevel} premium={item.starLevel === 6} planName={business.planName} />
          {item.featured && <span className="bnc-featured-ribbon">Featured</span>}
        </div>
        <button
          type="button"
          className={cn("bnc-save-button", saved && "is-saved")}
          onClick={onToggleSaved}
          aria-label={saved ? `Remove ${business.name} from favourites` : `Save ${business.name} to favourites`}
          aria-pressed={saved}
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="bnc-nearby-content">
        <div className="bnc-nearby-title">
          <div>
            <span>{business.category}</span>
            <h3>{business.name} {business.verified && <BadgeCheck size={17} aria-label="Verified business" />}</h3>
          </div>
          <span className="bnc-rating-pill"><Star size={13} fill="currentColor" /> {business.rating} <small>({business.reviewCount})</small></span>
        </div>
        <div className="bnc-business-meta">
          <span><MapPin size={14} /> {business.locality}{business.distanceKm !== undefined ? ` · ${business.distanceKm} km` : ""}</span>
          <span className={business.status === "closed" ? "is-closed" : "is-open"}>
            <Clock3 size={14} /> {business.status === "closed" ? "Closed now" : `Open until ${business.closesAt}`}
          </span>
        </div>
        <div
          className={cn("bnc-current-offers", !hasCurrentOffer && "is-empty")}
          aria-hidden={!hasCurrentOffer}
        >
          {item.discount && <div className="bnc-current-offer"><IndianRupee size={14} /> {item.discount} available today</div>}
          {!!business.permanentDiscountPercent && <div className="bnc-current-offer"><IndianRupee size={14} /> {business.permanentDiscountPercent}% permanent discount{business.permanentDiscountLabel ? ` · ${business.permanentDiscountLabel}` : ""}</div>}
        </div>
        <div className="bnc-business-card-actions">
          <a href={`tel:${business.phone.replace(/\s/g, "")}`}><Phone size={15} /> Call</a>
          <BncMessageButton businessId={business.id} businessName={business.name} initialMessage={`Hi, I found ${business.name} on BNC and would like more information.`} label="BNC chat" />
          <Link href={`/search?view=map&q=${encodeURIComponent(business.name)}`} aria-label={`Directions to ${business.name}`}><Navigation size={16} /></Link>
          <Link href={`/business/${business.slug}`}>View details</Link>
        </div>
      </div>
    </motion.article>
  );
}

export function HomeOfferCard({ offer }: { offer: HomeOffer }) {
  return (
    <motion.article className="bnc-offer-card" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <div className="bnc-offer-image">
        <Image
          src={offer.image}
          alt={`${offer.title} from ${offer.businessName}`}
          fill
          sizes="(max-width: 640px) 82vw, 320px"
        />
        <span>{offer.discountPercentage}% off</span>
      </div>
      <div className="bnc-offer-content">
        <span className="bnc-offer-category">{offer.category}</span>
        <h3>{offer.title}</h3>
        <p>{offer.businessName}</p>
        <div className="bnc-offer-pricing">
          <strong>₹{offer.offerPrice.toLocaleString("en-IN")}</strong>
          <del>₹{offer.originalPrice.toLocaleString("en-IN")}</del>
        </div>
        <div className="bnc-offer-meta">
          {offer.distanceKm !== undefined && <span><MapPin size={13} /> {offer.distanceKm} km</span>}
          <span><Clock3 size={13} /> {offer.expiryLabel}</span>
        </div>
        <Link href="/offers">Claim offer <ArrowRight size={15} /></Link>
      </div>
    </motion.article>
  );
}

export function BookingCard({ professional }: { professional: HomeProfessional }) {
  return (
    <motion.article className="bnc-booking-card" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <div className="bnc-booking-person">
        <span>
          <Image
            src={professional.image}
            alt={professional.name}
            fill
            sizes="72px"
          />
        </span>
        <div>
          <small>{professional.specialisation}</small>
          <h3>{professional.name}</h3>
          <p>{professional.businessName}</p>
        </div>
      </div>
      <div className="bnc-booking-details">
        <div className="bnc-booking-slot">
          <span><CalendarCheck2 size={16} /> Next available</span>
          <strong>{professional.nextAvailable}</strong>
        </div>
        <div className="bnc-booking-meta">
          <span><IndianRupee size={15} /><small>Consultation</small><strong>₹{professional.price}</strong></span>
          <span><MapPin size={15} /><small>Location</small><strong>{professional.distanceKm !== undefined ? `${professional.distanceKm} km` : "Local"}</strong></span>
        </div>
      </div>
      <Link href={`/bookings?service=${encodeURIComponent(professional.id)}`}>
        Book now <ArrowRight size={16} />
      </Link>
    </motion.article>
  );
}

export function HomeProductCard({
  product,
  saved,
  onToggleSaved,
}: {
  product: HomeProduct;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  return (
    <motion.article className="bnc-home-product-card" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <Link href={`/products/${product.id}`} className="bnc-home-product-image">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 75vw, 300px"
        />
        <span className="bnc-product-promotions">
          {!!product.unitsSold && <span className="is-best-seller">Best seller</span>}
          {product.sponsored && <span>Sponsored{product.planName ? ` · ${product.planName}` : ""}</span>}
        </span>
      </Link>
      <button
        type="button"
        className={cn("bnc-product-save", saved && "is-saved")}
        onClick={onToggleSaved}
        aria-label={saved ? `Remove ${product.name} from saved products` : `Save ${product.name}`}
        aria-pressed={saved}
      >
        <Heart size={17} fill={saved ? "currentColor" : "none"} />
      </button>
      <div>
        <span>{product.category}</span>
        <h3><Link href={`/products/${product.id}`}>{product.name}</Link></h3>
        <p>{product.shopName}{product.distanceKm !== undefined ? ` · ${product.distanceKm} km` : ""}</p>
        <div className="bnc-product-price">
          <strong>₹{(product.discountPrice ?? product.price).toLocaleString("en-IN")}</strong>
          {product.discountPrice && <del>₹{product.price.toLocaleString("en-IN")}</del>}
        </div>
        {product.courierAvailable
          ? <span className="bnc-delivery-label"><Truck size={14} /> Courier available</span>
          : product.homeDeliveryAvailable && <span className="bnc-delivery-label"><Truck size={14} /> Home delivery available</span>}
        <Link href={`/products/${product.id}#enquire`}>Enquire <Send size={14} /></Link>
      </div>
    </motion.article>
  );
}

export function HomeTopServiceCard({ service }: { service: HomeTopService }) {
  return (
    <article className="bnc-top-service-card">
      <Link href={`/services/${service.id}`} className="bnc-top-service-image">
        <Image src={service.image} alt={`${service.name} by ${service.businessName}`} fill sizes="(max-width: 640px) 76vw, 300px" />
        <span>Top service{service.planName ? ` · ${service.planName}` : ""}</span>
      </Link>
      <div>
        <small>{service.category} · {service.city}</small>
        <h3><Link href={`/services/${service.id}`}>{service.name}</Link></h3>
        <p>{service.businessName}</p>
        <div><span><Star size={13} fill="currentColor" /> {service.rating} ({service.reviewCount})</span><strong>₹{service.startingPrice.toLocaleString("en-IN")} {service.pricingUnit}</strong></div>
        <Link href={`/services/${service.id}`}>View service <ArrowRight size={14} /></Link>
      </div>
    </article>
  );
}

export function HomeJobCard({ job }: { job: HomeJob }) {
  return (
    <motion.article className="bnc-job-card" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <div className="bnc-job-top">
        <span className="bnc-company-logo">{job.companyInitials}</span>
        <span>{job.posted}</span>
      </div>
      <small>{job.employmentType}</small>
      <h3>{job.title}</h3>
      <p>{job.companyName}</p>
      <div className="bnc-job-meta">
        <span><MapPin size={14} /> {job.location}</span>
        <span><IndianRupee size={14} /> {job.salary}</span>
      </div>
      <div className="bnc-job-skills">
        {job.skills.map((skill) => <span key={skill}>{skill}</span>)}
      </div>
      <Link href={`/jobs/${job.id}`}>
        <BriefcaseBusiness size={15} /> Apply now
      </Link>
    </motion.article>
  );
}

export function FeatureCheck({ children }: { children: React.ReactNode }) {
  return <li><CheckCircle2 size={16} /> {children}</li>;
}
