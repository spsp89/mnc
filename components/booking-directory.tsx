"use client";

import { CalendarCheck2, CheckCircle2, Clock3, LoaderCircle, MapPin, Search, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PortalHero } from "@/components/portal-hero";
import type { PublicServiceListing } from "@/lib/public-api";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";

export function BookingDirectory({ listings }: { listings: PublicServiceListing[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PublicServiceListing | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(() => new Date(Date.now() + 24 * 60 * 60_000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  const [providerId, setProviderId] = useState("");
  const [providers, setProviders] = useState<Array<{ id: string; name: string; title: string | null }>>([]);
  const [slots, setSlots] = useState<Array<{ startsAt: string; endsAt: string; durationMinutes: number; provider: { id: string; name: string; title: string | null } }>>([]);
  const [slotKey, setSlotKey] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const filtered = useMemo(() => listings.filter((listing) =>
    `${listing.service.name} ${listing.business.name} ${listing.business.category} ${listing.business.city}`
      .toLowerCase().includes(query.toLowerCase()),
  ), [listings, query]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    const providerQuery = new URLSearchParams({
      businessId: selected.business.id,
      serviceId: selected.service.id,
    });
    const slotQuery = new URLSearchParams({
      businessId: selected.business.id,
      serviceId: selected.service.id,
      date,
    });
    if (providerId) slotQuery.set("providerId", providerId);
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setAvailabilityLoading(true);
      setSlotKey("");
      void Promise.all([
        fetch(appPath(`/api/booking-availability/providers?${providerQuery}`), { signal: controller.signal }),
        fetch(appPath(`/api/booking-availability/slots?${slotQuery}`), { signal: controller.signal }),
      ]).then(async ([providerResponse, slotResponse]) => {
        const providerBody = (await providerResponse.json()) as { data?: typeof providers; message?: string | string[] };
        const slotBody = (await slotResponse.json()) as { data?: typeof slots; message?: string | string[] };
        if (!providerResponse.ok) throw new Error(Array.isArray(providerBody.message) ? providerBody.message.join(" ") : providerBody.message ?? "Providers could not be loaded.");
        if (!slotResponse.ok) throw new Error(Array.isArray(slotBody.message) ? slotBody.message.join(" ") : slotBody.message ?? "Available slots could not be loaded.");
        setProviders(providerBody.data ?? []);
        setSlots(slotBody.data ?? []);
      }).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessage(error instanceof Error ? error.message : "Available slots could not be loaded.");
        setSlots([]);
      }).finally(() => {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      });
    });
    return () => controller.abort();
  }, [date, providerId, selected]);

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const selectedSlot = slots.find((slot) => `${slot.provider.id}|${slot.startsAt}` === slotKey);
    if (!selectedSlot) {
      setMessage("Choose one of the provider's available appointment slots.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(appPath("/api/bookings"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId: selected.business.id,
          serviceId: selected.service.id,
          providerId: selectedSlot.provider.id,
          startsAt: selectedSlot.startsAt,
          durationMinutes: selectedSlot.durationMinutes,
          customerNote: form.get("customerNote") || undefined,
        }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (response.status === 401) throw new Error("Please sign in as a customer before booking.");
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Booking could not be created.");
      setMessage("Booking request sent. Track confirmation under My bookings.");
      setSlots((current) => current.filter((slot) => `${slot.provider.id}|${slot.startsAt}` !== slotKey));
      setSlotKey("");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PortalHero eyebrow="Appointments" title={<>Book trusted local <em>clinics and beauty professionals.</em></>} description="Choose a service and request a time without leaving BNC." image={listings[0]?.image} imageAlt="Book a local appointment" tone="marketplace-hero" mediaLabel="Clinic and beauty appointments">
        <label className="catalog-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search doctors, clinics, salons or services" /></label>
      </PortalHero>
      <section className="page-section catalog-section">
        <div className="catalog-toolbar"><strong>{filtered.length} bookable services</strong><Link href="/account/bookings">My bookings</Link></div>
        {filtered.length ? <div className="booking-directory-grid">{filtered.map((listing) => <article key={listing.service.id}><div><CalendarCheck2 size={22} /><span>{listing.business.category}</span></div><h2>{listing.service.name}</h2><strong>{listing.business.name}</strong><p>{listing.description || "Choose a live provider slot and book directly through BNC."}</p><div><span><MapPin size={14} /> {listing.business.locality}, {listing.business.city}</span><span><Clock3 size={14} /> {listing.service.duration ?? "Duration confirmed by provider"}</span></div><small>{listing.service.startingPrice ? `From ${formatCurrency(listing.service.startingPrice)}` : "Ask provider for price"}</small><button type="button" onClick={() => { setSelected(listing); setMessage(""); setProviderId(""); setSlotKey(""); }}><CalendarCheck2 size={15} /> View live slots</button></article>)}</div> : <div className="empty-state"><CalendarCheck2 size={28} /><h2>No matching appointment services</h2><p>Try another clinic, salon, service or city.</p></div>}
      </section>
      {selected && <div className="business-product-dialog-backdrop" role="presentation"><section className="business-product-dialog booking-slot-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-title"><header><div><span className="eyebrow">{selected.business.name}</span><h2 id="booking-title">Book {selected.service.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close booking form"><X size={18} /></button></header><form onSubmit={book}><div className="booking-slot-filters"><label>Appointment date<input value={date} onChange={(event) => setDate(event.target.value)} type="date" min={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })} required /></label><label>Professional<select value={providerId} onChange={(event) => setProviderId(event.target.value)}><option value="">Any available professional</option>{providers.map((provider) => <option value={provider.id} key={provider.id}>{provider.name}{provider.title ? ` · ${provider.title}` : ""}</option>)}</select></label></div><fieldset className="booking-slot-picker"><legend>Available times</legend>{availabilityLoading ? <span><LoaderCircle className="spin" size={16} /> Checking live schedules</span> : slots.length ? <div>{slots.map((slot) => { const key = `${slot.provider.id}|${slot.startsAt}`; return <label className={slotKey === key ? "selected" : ""} key={key}><input type="radio" name="slot" value={key} checked={slotKey === key} onChange={() => setSlotKey(key)} /><strong>{new Date(slot.startsAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}</strong><small>{slot.provider.name}</small></label>; })}</div> : <p>No open slots for this date. Choose another day or professional.</p>}</fieldset><label>Note <small>Optional</small><textarea name="customerNote" maxLength={2000} rows={4} placeholder="Symptoms, preferred treatment, or another useful detail." /></label>{message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}<footer><button type="button" onClick={() => setSelected(null)}>Cancel</button><button type="submit" disabled={busy || !slotKey}>{busy ? <LoaderCircle className="spin" size={16} /> : <CalendarCheck2 size={16} />} Book selected slot</button></footer>{message.startsWith("Please sign in") && <Link href={`/login?returnTo=${encodeURIComponent("/bookings")}`}>Sign in to continue</Link>}</form></section></div>}
    </>
  );
}
