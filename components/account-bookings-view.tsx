"use client";

import { ArrowLeft, CalendarCheck2, CheckCircle2, Clock3, LoaderCircle, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { appPath } from "@/lib/client-routing";

type Booking = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  status: string;
  providerName: string | null;
  business: { id: string; name: string; slug: string; publicPhone: string | null };
  service: { id: string; name: string } | null;
  provider: { id: string; name: string; title: string | null } | null;
};

type Slot = {
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  provider: { id: string; name: string; title: string | null };
};

export function AccountBookingsView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [rescheduling, setRescheduling] = useState<Booking | null>(null);
  const [date, setDate] = useState(() => new Date(Date.now() + 24 * 60 * 60_000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotKey, setSlotKey] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(appPath("/api/bookings/mine"));
      const body = (await response.json()) as { data?: Booking[]; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Bookings could not be loaded.");
      setBookings(body.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bookings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    if (!rescheduling?.service) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      businessId: rescheduling.business.id,
      serviceId: rescheduling.service.id,
      date,
    });
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setSlotsLoading(true);
      setSlotKey("");
      void fetch(appPath(`/api/booking-availability/slots?${query}`), { signal: controller.signal })
        .then(async (response) => {
          const body = (await response.json()) as { data?: Slot[]; message?: string | string[] };
          if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Slots could not be loaded.");
          setSlots(body.data ?? []);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setMessage(error instanceof Error ? error.message : "Slots could not be loaded.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setSlotsLoading(false);
        });
      })
    return () => controller.abort();
  }, [date, rescheduling]);

  async function cancel(id: string) {
    setBusy(id);
    const response = await fetch(appPath(`/api/bookings/${id}/cancel`), { method: "POST" });
    const body = (await response.json()) as { message?: string | string[] };
    if (!response.ok) {
      setMessage(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Booking could not be cancelled.");
      setBusy("");
      return;
    }
    setMessage("Booking cancelled and the business was notified.");
    setBookings((current) => current.map((booking) => booking.id === id ? { ...booking, status: "CANCELLED" } : booking));
    setBusy("");
  }

  async function submitReschedule() {
    if (!rescheduling) return;
    const slot = slots.find((item) => `${item.provider.id}|${item.startsAt}` === slotKey);
    if (!slot) return;
    setBusy(rescheduling.id);
    try {
      const response = await fetch(appPath(`/api/bookings/${rescheduling.id}/reschedule`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ startsAt: slot.startsAt, providerId: slot.provider.id }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Booking could not be rescheduled.");
      setMessage("New slot requested. The provider will reconfirm it, and BNC will refresh your reminders.");
      setRescheduling(null);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking could not be rescheduled.");
    } finally {
      setBusy("");
    }
  }

  return (
    <AppShell headerVariant="immersive">
      <section className="account-section-page">
        <div className="account-section-hero">
          <div>
            <Link className="back-link" href="/account"><ArrowLeft size={15} /> Account overview</Link>
            <div className="account-section-heading">
              <span className="eyebrow">Appointments</span>
              <h1>My bookings</h1>
              <p>Track confirmations, move to another live slot and manage upcoming BNC appointments.</p>
            </div>
          </div>
        </div>
        <div className="account-section-content">
          {message && <p className="settings-saved"><CheckCircle2 size={14} /> {message}</p>}
          {loading ? (
            <div className="empty-state"><LoaderCircle className="spin" size={28} /><h2>Loading bookings</h2></div>
          ) : bookings.length ? (
            <div className="account-booking-list">
              {bookings.map((booking) => (
                <article key={booking.id}>
                  <span><CalendarCheck2 size={19} /></span>
                  <div>
                    <small>{booking.status}</small>
                    <h2>{booking.service?.name ?? "Appointment"}</h2>
                    <p>{booking.business.name} · {new Date(booking.startsAt).toLocaleString("en-IN")} · {booking.durationMinutes} minutes</p>
                    {(booking.provider?.name ?? booking.providerName) && <strong>{booking.provider?.name ?? booking.providerName}</strong>}
                  </div>
                  {["REQUESTED", "CONFIRMED"].includes(booking.status) ? (
                    <div className="account-booking-actions">
                      {booking.service && <button type="button" onClick={() => { setRescheduling(booking); setSlotKey(""); }} disabled={busy === booking.id}><Clock3 size={13} /> Reschedule</button>}
                      <button type="button" onClick={() => cancel(booking.id)} disabled={busy === booking.id}>Cancel</button>
                    </div>
                  ) : <Link href={`/business/${booking.business.slug}`}>View business</Link>}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><CalendarCheck2 size={28} /><h2>No appointments yet</h2><p>Book a clinic or beauty service through BNC.</p><Link href="/bookings">Find appointments</Link></div>
          )}
        </div>
      </section>
      {rescheduling?.service && (
        <div className="business-product-dialog-backdrop" role="presentation">
          <section className="business-product-dialog booking-slot-dialog" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
            <header><div><span className="eyebrow">{rescheduling.business.name}</span><h2 id="reschedule-title">Choose a new live slot</h2></div><button type="button" onClick={() => setRescheduling(null)} aria-label="Close reschedule dialog"><X size={18} /></button></header>
            <div className="booking-reschedule-body">
              <label>Appointment date<input value={date} onChange={(event) => setDate(event.target.value)} type="date" min={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })} /></label>
              <fieldset className="booking-slot-picker"><legend>Available times</legend>{slotsLoading ? <span><LoaderCircle className="spin" size={16} /> Checking schedules</span> : slots.length ? <div>{slots.map((slot) => { const key = `${slot.provider.id}|${slot.startsAt}`; return <label className={slotKey === key ? "selected" : ""} key={key}><input type="radio" name="reschedule-slot" checked={slotKey === key} onChange={() => setSlotKey(key)} /><strong>{new Date(slot.startsAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}</strong><small>{slot.provider.name}</small></label>; })}</div> : <p>No open slots for this day.</p>}</fieldset>
              <footer><button type="button" onClick={() => setRescheduling(null)}>Keep current booking</button><button type="button" onClick={submitReschedule} disabled={!slotKey || busy === rescheduling.id}>Request selected slot</button></footer>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
