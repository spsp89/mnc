"use client";

import { CalendarCheck2, CheckCircle2, Clock3, LoaderCircle, Plus, Trash2, UserRound } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type Booking = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  providerName: string | null;
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  customerNote: string | null;
  service: { id: string; name: string } | null;
  provider: { id: string; name: string; title: string | null } | null;
  customer: { email: string | null; phone: string | null; customerProfile: { displayName: string | null } | null };
};

type BookingSetup = {
  providers: Array<{ id: string; name: string; title: string | null; services: Array<{ service: { id: string; name: string } }> }>;
  schedules: Array<{ id: string; weekday: number; startsMinute: number; endsMinute: number; slotIntervalMinutes: number; provider: { id: string; name: string }; service: { id: string; name: string } | null }>;
  timeOff: Array<{ id: string; startsAt: string; endsAt: string; reason: string | null; provider: { id: string; name: string } }>;
  services: Array<{ id: string; name: string; durationMinutes: number | null }>;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minutesFromTime(value: FormDataEntryValue | null) {
  const [hour, minute] = String(value ?? "00:00").split(":").map(Number);
  return hour * 60 + minute;
}

function displayMinute(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return new Date(Date.UTC(2020, 0, 1, hour, minute)).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

export function BusinessBookingsManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [setup, setSetup] = useState<BookingSetup>({ providers: [], schedules: [], timeOff: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [bookingResponse, setupResponse] = await Promise.all([
        fetch(appPath(`/api/business/bookings?businessId=${encodeURIComponent(businessId)}`)),
        fetch(appPath(`/api/business/bookings/setup?businessId=${encodeURIComponent(businessId)}`)),
      ]);
      const body = (await bookingResponse.json()) as { data?: Booking[]; message?: string | string[] };
      const setupBody = (await setupResponse.json()) as { data?: BookingSetup; message?: string | string[] };
      if (!bookingResponse.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Bookings could not be loaded.");
      if (!setupResponse.ok) throw new Error(Array.isArray(setupBody.message) ? setupBody.message.join(" ") : setupBody.message ?? "Booking setup could not be loaded.");
      setBookings(body.data ?? []);
      if (setupBody.data) setSetup(setupBody.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bookings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function update(id: string, status: Booking["status"]) {
    setBusy(id);
    try {
      const response = await fetch(appPath(`/api/business/bookings/${id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Booking could not be updated.");
      setBookings((current) => current.map((booking) => booking.id === id ? { ...booking, status } : booking));
      setMessage(`Booking marked ${status.toLowerCase()}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking could not be updated.");
    } finally {
      setBusy("");
    }
  }

  async function postSetup(path: string, payload: object, success: string, form?: HTMLFormElement) {
    setBusy(path);
    try {
      const response = await fetch(appPath(`/api/business/bookings/${path}`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Booking setup could not be updated.");
      form?.reset();
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking setup could not be updated.");
    } finally {
      setBusy("");
    }
  }

  async function createProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await postSetup("providers", {
      businessId,
      name: form.get("name"),
      title: form.get("title") || undefined,
      serviceIds: form.getAll("serviceIds"),
    }, "Professional added to the booking roster.", event.currentTarget);
  }

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await postSetup("schedules", {
      businessId,
      providerId: form.get("providerId"),
      serviceId: form.get("serviceId") || undefined,
      weekday: Number(form.get("weekday")),
      startsMinute: minutesFromTime(form.get("startsAt")),
      endsMinute: minutesFromTime(form.get("endsAt")),
      slotIntervalMinutes: Number(form.get("slotIntervalMinutes")),
    }, "Weekly provider schedule published.", event.currentTarget);
  }

  async function createTimeOff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await postSetup("time-off", {
      businessId,
      providerId: form.get("providerId"),
      startsAt: new Date(String(form.get("startsAt"))).toISOString(),
      endsAt: new Date(String(form.get("endsAt"))).toISOString(),
      reason: form.get("reason") || undefined,
    }, "Provider time off blocked from public slots.", event.currentTarget);
  }

  async function deleteSchedule(id: string) {
    setBusy(id);
    try {
      const response = await fetch(appPath(`/api/business/bookings/schedules/${id}`), { method: "DELETE" });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Schedule could not be removed.");
      setMessage("Weekly schedule removed.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Schedule could not be removed.");
    } finally {
      setBusy("");
    }
  }

  async function reschedule(booking: Booking) {
    const value = window.prompt("New appointment date and time (example: 2026-08-21T14:30)");
    if (!value) return;
    const startsAt = new Date(value);
    if (Number.isNaN(startsAt.getTime())) {
      setMessage("Enter a valid date and time.");
      return;
    }
    setBusy(booking.id);
    try {
      const response = await fetch(appPath(`/api/bookings/${booking.id}/reschedule`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ startsAt: startsAt.toISOString(), providerId: booking.provider?.id }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Booking could not be rescheduled.");
      setMessage("Appointment rescheduled and the customer was notified.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking could not be rescheduled.");
    } finally {
      setBusy("");
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading"><div><span className="eyebrow">Appointments</span><h1>Booking calendar</h1><p>Publish staff schedules, block time off, confirm live-slot requests, reschedule appointments and let BNC send automatic reminders.</p></div>{user.businesses.length > 1 && <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select>}</section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}
      <section className="booking-setup-grid">
        <form onSubmit={createProvider}><h2><Plus size={15} /> Add professional</h2><input name="name" minLength={2} maxLength={120} placeholder="Doctor, stylist or consultant name" required /><input name="title" maxLength={120} placeholder="Title or speciality" /><fieldset><legend>Services</legend>{setup.services.map((service) => <label key={service.id}><input name="serviceIds" type="checkbox" value={service.id} /> {service.name}</label>)}</fieldset><button type="submit" disabled={busy === "providers"}>Add to roster</button></form>
        <form onSubmit={createSchedule}><h2><Clock3 size={15} /> Weekly availability</h2><select name="providerId" required><option value="">Professional</option>{setup.providers.map((provider) => <option value={provider.id} key={provider.id}>{provider.name}</option>)}</select><select name="serviceId"><option value="">All assigned services</option>{setup.services.map((service) => <option value={service.id} key={service.id}>{service.name}</option>)}</select><select name="weekday" required>{weekdays.map((day, index) => <option value={index} key={day}>{day}</option>)}</select><label>From<input name="startsAt" type="time" required /></label><label>Until<input name="endsAt" type="time" required /></label><select name="slotIntervalMinutes" defaultValue="30"><option value="15">Every 15 minutes</option><option value="30">Every 30 minutes</option><option value="45">Every 45 minutes</option><option value="60">Every 60 minutes</option></select><button type="submit" disabled={busy === "schedules"}>Publish schedule</button></form>
        <form onSubmit={createTimeOff}><h2><CalendarCheck2 size={15} /> Block time off</h2><select name="providerId" required><option value="">Professional</option>{setup.providers.map((provider) => <option value={provider.id} key={provider.id}>{provider.name}</option>)}</select><label>Starts<input name="startsAt" type="datetime-local" required /></label><label>Ends<input name="endsAt" type="datetime-local" required /></label><input name="reason" maxLength={500} placeholder="Reason (optional)" /><button type="submit" disabled={busy === "time-off"}>Block public slots</button></form>
      </section>
      <section className="booking-schedule-summary manager-table-card"><h2>Published schedules</h2>{setup.schedules.length ? <div>{setup.schedules.map((schedule) => <article key={schedule.id}><div><strong>{schedule.provider.name}</strong><small>{schedule.service?.name ?? "All assigned services"} · {weekdays[schedule.weekday]} · {displayMinute(schedule.startsMinute)}–{displayMinute(schedule.endsMinute)} · every {schedule.slotIntervalMinutes} min</small></div><button type="button" onClick={() => deleteSchedule(schedule.id)} disabled={busy === schedule.id} aria-label="Remove schedule"><Trash2 size={14} /></button></article>)}</div> : <p>No weekly schedules published yet.</p>}</section>
      <section className="manager-table-card">
        {loading ? <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading appointments</strong></div> : bookings.length ? <div className="business-booking-list">{bookings.map((booking) => <article key={booking.id}><span><CalendarCheck2 size={18} /></span><div><small>{booking.status} · {(booking.provider?.name ?? booking.providerName) || "Any provider"}</small><h2>{booking.service?.name ?? "Appointment"}</h2><p>{new Date(booking.startsAt).toLocaleString("en-IN")} · {booking.durationMinutes} minutes</p><span><UserRound size={13} /> {booking.customer.customerProfile?.displayName ?? booking.customer.email ?? booking.customer.phone ?? "Customer"}</span>{booking.customerNote && <p>{booking.customerNote}</p>}</div><div className="booking-row-actions"><button type="button" onClick={() => reschedule(booking)} disabled={busy === booking.id || !["REQUESTED", "CONFIRMED"].includes(booking.status)}><Clock3 size={13} /> Reschedule</button><select value={booking.status} onChange={(event) => update(booking.id, event.target.value as Booking["status"])} disabled={busy === booking.id || ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.status)}><option value="REQUESTED">Requested</option><option value="CONFIRMED">Confirmed</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option><option value="NO_SHOW">No show</option></select></div></article>)}</div> : <div className="admin-empty"><CalendarCheck2 size={28} /><strong>No booking requests</strong><span>Customer requests from the public booking directory will appear here.</span></div>}
      </section>
    </DashboardShell>
  );
}
