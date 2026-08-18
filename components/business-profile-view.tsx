"use client";

import {
  BadgeCheck,
  Bookmark,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ContactRound,
  CreditCard,
  ExternalLink,
  Flag,
  Globe2,
  HeartHandshake,
  Languages,
  MapPin,
  Navigation,
  Phone,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { AppShell } from "@/components/app-shell";
import { BncMessageButton } from "@/components/bnc-message-button";
import { BusinessCard } from "@/components/business-card";
import { EnquiryForm } from "@/components/enquiry-form";
import { Rating } from "@/components/rating";
import { WhatsAppInquiryButton } from "@/components/whatsapp-inquiry-button";
import { openStreetMapEmbedUrl } from "@/lib/maps";
import type { Business } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function BusinessProfileView({
  business,
  relatedBusinesses = [],
}: {
  business: Business;
  relatedBusinesses?: Business[];
}) {
  const [saved, setSaved] = useState(false);
  const [activeMedia, setActiveMedia] = useState(0);
  const [helpfulReviews, setHelpfulReviews] = useState<string[]>([]);
  const [paymentQr, setPaymentQr] = useState("");
  const mediaTrackRef = useRef<HTMLDivElement>(null);
  const galleryImages = business.gallery.length ? business.gallery : [business.coverImage];
  const digitalCard = encodeURIComponent([
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${business.name}`,
    `ORG:${business.name}`,
    business.phone ? `TEL:${business.phone}` : "",
    `ADR:;;${business.address};${business.city};${business.state};;India`,
    `URL:/business/${business.slug}`,
    `NOTE:${business.shortDescription}`,
    "END:VCARD",
  ].filter(Boolean).join("\n"));

  useEffect(() => {
    const storageKey = "bnc-recently-viewed-v1";
    try {
      const previous = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
      localStorage.setItem(
        storageKey,
        JSON.stringify([business.id, ...previous.filter((id) => id !== business.id)].slice(0, 6)),
      );
      window.dispatchEvent(new Event("bnc-recently-viewed"));
    } catch {
      // Discovery remains usable when local storage is blocked.
    }
  }, [business.id]);

  useEffect(() => {
    const upiId = business.paymentProfile?.upiId;
    if (!upiId) return;
    let active = true;
    const paymentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(business.paymentProfile?.accountName ?? business.name)}`;
    void QRCode.toDataURL(paymentUri, {
      width: 260,
      margin: 1,
      color: { dark: "#041c61", light: "#ffffff" },
    }).then((url) => {
      if (active) setPaymentQr(url);
    });
    return () => { active = false; };
  }, [business.name, business.paymentProfile?.accountName, business.paymentProfile?.upiId]);

  const showMedia = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, galleryImages.length - 1));
    setActiveMedia(nextIndex);
    mediaTrackRef.current?.scrollTo({
      left: nextIndex * mediaTrackRef.current.clientWidth,
      behavior: "smooth",
    });
  };

  const syncActiveMedia = () => {
    const track = mediaTrackRef.current;
    if (!track?.clientWidth) return;
    setActiveMedia(Math.min(galleryImages.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: business.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <AppShell headerVariant="immersive">
      <div className="profile-spotlight">
        <div className="profile-breadcrumbs">
          <Link href="/">Home</Link><ChevronRight size={13} />
          <Link href={`/search?q=${encodeURIComponent(business.category)}`}>{business.category}</Link><ChevronRight size={13} />
          <span>{business.name}</span>
        </div>

        <div className="profile-sheet">
          <section className="profile-hero">
            <div className="profile-gallery" aria-label={`${business.name} image gallery`}>
              <div className="profile-media-track" ref={mediaTrackRef} onScroll={syncActiveMedia}>
                {galleryImages.map((image, index) => (
                  <figure className="profile-media-slide" key={`${image}-${index}`}>
                    <Image
                      src={image}
                      alt={`${business.name} gallery image ${index + 1} of ${galleryImages.length}`}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 760px) 100vw, 56vw"
                      draggable={false}
                    />
                  </figure>
                ))}
              </div>
              {galleryImages.length > 1 && (
                <>
                  <button className="profile-media-control is-previous" type="button" onClick={() => showMedia(activeMedia - 1)} disabled={activeMedia === 0} aria-label="Show previous image"><ChevronLeft size={20} /></button>
                  <button className="profile-media-control is-next" type="button" onClick={() => showMedia(activeMedia + 1)} disabled={activeMedia === galleryImages.length - 1} aria-label="Show next image"><ChevronRight size={20} /></button>
                </>
              )}
              <div className="profile-media-progress" role="group" aria-label={`Image ${activeMedia + 1} of ${galleryImages.length}`}>
                {galleryImages.map((image, index) => (
                  <button className={index === activeMedia ? "active" : ""} type="button" onClick={() => showMedia(index)} aria-label={`Show image ${index + 1}`} aria-current={index === activeMedia ? "true" : undefined} key={`${image}-progress`}><span /></button>
                ))}
              </div>
            </div>
            <div className="profile-summary-card">
              <h1>{business.name}</h1>
              <p className="profile-category">{business.subcategory} · {business.category}</p>
              <div className="profile-rating-row">
                <Rating value={business.rating} count={business.reviewCount} />
                <span>·</span>
                <a href="#reviews">Read reviews</a>
              </div>
              <p className="profile-short">{business.shortDescription}</p>
              {!!business.permanentDiscountPercent && (
                <div className="profile-permanent-discount">
                  <Sparkles size={17} />
                  <strong>{business.permanentDiscountPercent}% permanent discount</strong>
                  {business.permanentDiscountLabel && <span>{business.permanentDiscountLabel}</span>}
                </div>
              )}
              <div className="profile-status">
                <span className={`status-${business.status}`}><Clock3 size={16} /> Open today until {business.closesAt}</span>
                <span><MapPin size={16} /> {business.locality}{business.distanceKm !== undefined ? ` · ${business.distanceKm} km away` : ""}</span>
              </div>
              <div className="profile-summary-actions">
                <a className="button button-primary" href={`tel:${business.phone.replace(/\s/g, "")}`}><Phone size={17} /> Call</a>
                <WhatsAppInquiryButton className="button" phone={business.whatsapp} recipientName={business.name} message={`Hi ${business.name}, I found your business on BNC and would like more information.`} label="WhatsApp" />
                <a className="button quote-button" href="#enquiry">Get quote</a>
              </div>
              <div className="profile-tertiary-actions">
                <button type="button" onClick={() => setSaved((value) => !value)} className={saved ? "active" : ""}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}</button>
                <button type="button" onClick={share}><Share2 size={16} /> Share</button>
                <a href={`data:text/vcard;charset=utf-8,${digitalCard}`} download={`${business.slug}.vcf`}><ContactRound size={16} /> Digital card</a>
                <a href={`https://www.openstreetmap.org/directions?to=${business.latitude}%2C${business.longitude}`} target="_blank" rel="noreferrer"><Navigation size={16} /> Directions</a>
              </div>
            </div>
          </section>

        </div>
      </div>

      <div className="profile-content-zone">
        <nav className="profile-tabs" aria-label="Business profile sections">
          {["Overview", "Services", "Products", "Reviews", "Location"].map((tab) => (
            <a href={`#${tab.toLowerCase()}`} key={tab}>{tab}</a>
          ))}
        </nav>
        <div className="profile-page-layout">
          <div className="profile-main-column">
          <section className="profile-content-card" id="overview">
            <div className="content-card-heading"><div><span className="eyebrow">About</span><h2>Why customers choose {business.name}</h2></div><ShieldCheck size={25} /></div>
            <p>{business.description}</p>
            <div className="profile-facts">
              <div><CalendarDays size={19} /><span><small>In business</small><strong>{business.yearsInBusiness} years</strong></span></div>
              <div><Languages size={19} /><span><small>Languages</small><strong>{business.languages.join(", ")}</strong></span></div>
              <div><CreditCard size={19} /><span><small>Payments</small><strong>{business.paymentMethods.join(", ")}</strong></span></div>
              <div><UsersRound size={19} /><span><small>Response</small><strong>{business.responseTime}</strong></span></div>
            </div>
            <div className="amenity-list">
              {business.amenities.map((amenity) => <span key={amenity}><Check size={14} /> {amenity}</span>)}
            </div>
          </section>

          {business.offer && (
            <section className="profile-offer-card">
              <span className="offer-star"><Sparkles size={22} /></span>
              <div>
                <span className="eyebrow">Current offer</span>
                <h2>{business.offer.title}</h2>
                <p>{business.offer.description}</p>
                <small>Valid until {business.offer.expiresAt}</small>
              </div>
              <strong>{business.offer.discount}</strong>
            </section>
          )}

          <section className="profile-content-card" id="services">
            <div className="content-card-heading"><div><span className="eyebrow">Services</span><h2>What they can help with</h2></div></div>
            <div className="service-list">
              {business.services.map((service) => (
                <article key={service.id}>
                  <div className="service-list-icon"><HeartHandshake size={20} /></div>
                  <div>
                    <h3><Link href={`/services/${service.id}`}>{service.name}</Link></h3>
                    <p>{service.homeService ? "Available at your location" : "Available at the business"}{service.duration ? ` · ${service.duration}` : ""}</p>
                  </div>
                  <div className="service-price"><small>Starts at</small><strong>{service.startingPrice ? formatCurrency(service.startingPrice) : "Free"}</strong><span>{service.pricingUnit}</span></div>
                  <Link href={`/services/${service.id}`}>View service <ChevronRight size={15} /></Link>
                </article>
              ))}
            </div>
          </section>

          {business.products.length > 0 && (
            <section className="profile-content-card" id="products">
              <div className="content-card-heading"><div><span className="eyebrow">Products</span><h2>Available from this business</h2></div></div>
              <div className="profile-product-grid">
                {business.products.map((product) => (
                  <article key={product.id}>
                    <div><Image src={product.image} alt={product.name} fill sizes="180px" /></div>
                    <span>{product.category}</span>
                    <h3>{product.name}</h3>
                    <p><strong>{formatCurrency(product.discountPrice ?? product.price)}</strong>{product.discountPrice && <del>{formatCurrency(product.price)}</del>}</p>
                    <a href="#enquiry">Check availability</a>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="profile-content-card" id="reviews">
            <div className="content-card-heading review-heading">
              <div><span className="eyebrow">Customer feedback</span><h2>Reviews</h2></div>
              <div className="rating-breakdown"><strong>{business.rating}</strong><span><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></span><small>{business.reviewCount} reviews</small></div>
            </div>
            <div className="review-list">
              {business.reviews.map((review) => (
                <article key={review.id}>
                  <div className="review-avatar">{review.author.split(" ").map((part) => part[0]).join("")}</div>
                  <div>
                    <div className="review-top"><h3>{review.author}</h3><span>{review.date}</span></div>
                    <div className="review-rating"><Rating value={review.rating} compact />{review.verified && <span><BadgeCheck size={13} /> Verified customer</span>}</div>
                    <p>{review.body}</p>
                    <button
                      type="button"
                      className={helpfulReviews.includes(review.id) ? "active" : ""}
                      onClick={() => setHelpfulReviews((current) =>
                        current.includes(review.id)
                          ? current.filter((id) => id !== review.id)
                          : [...current, review.id],
                      )}
                    >
                      <ThumbsUp size={14} /> Helpful ({review.helpful + (helpfulReviews.includes(review.id) ? 1 : 0)})
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <Link className="write-review-button" href="/account/reviews">Write a review</Link>
          </section>

          </div>

          <aside className="profile-sidebar">
            <section className="sidebar-card" id="location">
              <div className="sidebar-heading"><h2>Location &amp; hours</h2><MapPin size={19} /></div>
              <div className="mini-map">
                <iframe title={`${business.name} location`} src={openStreetMapEmbedUrl(business.latitude, business.longitude)} loading="lazy" />
              </div>
              <p>{business.address}</p>
              <a href={`https://www.openstreetmap.org/directions?to=${business.latitude}%2C${business.longitude}`} target="_blank" rel="noreferrer"><Navigation size={15} /> Get directions <ExternalLink size={13} /></a>
              <details className="hours-details" open>
                <summary><span><Clock3 size={15} /> Business hours</span><ChevronRight size={15} /></summary>
                <div><p className="today"><span>Today</span><strong>{business.closesAt ? `Closes at ${business.closesAt}` : "Hours not provided"}</strong></p></div>
              </details>
            </section>

            <section className="sidebar-card contact-card">
              <div className="sidebar-heading"><h2>Contact</h2><Phone size={18} /></div>
              <a href={`tel:${business.phone.replace(/\s/g, "")}`}><span><Phone size={16} /> Phone</span><strong>{business.phone}</strong></a>
              <WhatsAppInquiryButton phone={business.whatsapp} recipientName={business.name} message={`Hi ${business.name}, I found your business on BNC and would like more information.`} label="Direct WhatsApp enquiry" />
              <BncMessageButton businessId={business.id} businessName={business.name} initialMessage={`Hi, I found ${business.name} on BNC and would like more information.`} label="Start BNC chat" />
              {business.websiteUrl ? <a href={business.websiteUrl} target="_blank" rel="noreferrer"><span><Globe2 size={16} /> Website</span><strong>Visit website</strong></a> : <p className="contact-unavailable"><span><Globe2 size={16} /> Website</span><strong>Not provided</strong></p>}
              {Object.entries(business.socialLinks).map(([network, url]) => (
                <a href={url} target="_blank" rel="noreferrer" key={network}><span><Share2 size={16} /> {network === "x" ? "X (Twitter)" : network[0].toUpperCase() + network.slice(1)}</span><strong>Open profile</strong></a>
              ))}
            </section>

            {business.paymentProfile?.upiId && (
              <section className="sidebar-card profile-payment-card">
                <div className="sidebar-heading"><h2>Pay this business</h2><QrCode size={19} /></div>
                <p>Payment goes directly to the merchant. BNC does not collect or hold these funds.</p>
                {paymentQr && <Image src={paymentQr} alt={`UPI QR code for ${business.name}`} width={190} height={190} unoptimized />}
                <strong>{business.paymentProfile.accountName ?? business.name}</strong>
                <button type="button" onClick={() => navigator.clipboard?.writeText(business.paymentProfile!.upiId)}>
                  Copy UPI ID · {business.paymentProfile.upiId}
                </button>
              </section>
            )}

            <section id="enquiry"><EnquiryForm business={business} /></section>
            <Link className="report-profile" href={`/report-abuse?business=${encodeURIComponent(business.name)}&id=${business.id}`}><Flag size={14} /> Report an issue with this listing</Link>
          </aside>
        </div>

        <section className="similar-businesses">
          <div className="section-heading"><div><span className="eyebrow">More nearby</span><h2>Similar businesses you can compare</h2></div><Link href={`/search?q=${encodeURIComponent(business.category)}&radius=10`}>See all <ChevronRight size={16} /></Link></div>
          <div className="business-grid horizontal-on-mobile">
            {relatedBusinesses.filter((item) => item.id !== business.id).slice(0, 4).map((item) => <BusinessCard business={item} key={item.id} />)}
          </div>
        </section>
      </div>

      <div className="profile-mobile-actions">
        <a href={`tel:${business.phone.replace(/\s/g, "")}`}><Phone size={18} /><span>Call</span></a>
        <WhatsAppInquiryButton phone={business.whatsapp} recipientName={business.name} message={`Hi ${business.name}, I found your business on BNC and would like more information.`} label="WhatsApp" />
        <a className="primary" href="#enquiry">Get quote</a>
      </div>

    </AppShell>
  );
}
