"use client";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Crown,
  Handshake,
  LoaderCircle,
  MapPin,
  MessageSquareText,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type Chapter = {
  id: string;
  name: string;
  city: string;
  district: string;
  description: string | null;
  capacity: number;
  memberships: Array<{ id: string; businessId: string; joinedAt: string }>;
  _count: { memberships: number; messages: number };
};

type ClubMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: { id: string; customerProfile: { displayName: string | null; avatarUrl: string | null } | null };
};

type ClubMember = {
  id: string;
  joinedAt: string;
  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    shortDescription: string | null;
    publicPhone: string | null;
    websiteUrl: string | null;
    categories: Array<{ category: { name: string; slug: string } }>;
    locations: Array<{ locality: string; city: string; district: string }>;
    subscriptions: Array<{ plan: { name: string; starLevel: number } }>;
  };
  user: { id: string; customerProfile: { displayName: string | null; avatarUrl: string | null } | null };
};

type ClubEvent = {
  id: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  status: string;
  registrations: Array<{ id: string; status: "ATTENDING" | "CANCELLED" }>;
  _count: { registrations: number };
};

type ClubReferral = {
  id: string;
  createdById: string;
  contactName: string;
  referredBusiness: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";
  createdAt: string;
  membership: { business: { id: string; name: string; slug: string } };
  createdBy: { customerProfile: { displayName: string | null } | null };
};

type ClubPanel = "chat" | "members" | "events" | "referrals";

function errorMessage(body: { message?: string | string[] }, fallback: string) {
  return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? fallback;
}

export function BusinessClubManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selected, setSelected] = useState<Chapter | null>(null);
  const [panel, setPanel] = useState<ClubPanel>("chat");
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [referrals, setReferrals] = useState<ClubReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelLoading, setPanelLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [totals, setTotals] = useState({ registeredBusinesses: 0, clubMembers: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(appPath("/api/business/club/chapters"));
      const body = (await response.json()) as {
        data?: Chapter[];
        meta?: { registeredBusinesses: number; clubMembers: number };
        message?: string | string[];
      };
      if (!response.ok) throw new Error(errorMessage(body, "Business Club could not be loaded."));
      setChapters(body.data ?? []);
      setTotals(body.meta ?? { registeredBusinesses: 0, clubMembers: 0 });
      setSelected((current) => current
        ? (body.data ?? []).find((chapter) => chapter.id === current.id) ?? null
        : null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Business Club could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function join(chapter: Chapter) {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(appPath(`/api/business/club/chapters/${chapter.id}/join`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(errorMessage(body, "Chapter could not be joined."));
      setNotice("Chapter membership activated.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Chapter could not be joined.");
    } finally {
      setBusy(false);
    }
  }

  async function loadPanel(chapter: Chapter, nextPanel: ClubPanel) {
    setSelected(chapter);
    setPanel(nextPanel);
    setPanelLoading(true);
    setNotice("");
    try {
      const endpoint = nextPanel === "chat" ? "messages" : nextPanel;
      const response = await fetch(appPath(`/api/business/club/chapters/${chapter.id}/${endpoint}`));
      const body = (await response.json()) as {
        data?: ClubMessage[] | ClubMember[] | ClubEvent[] | ClubReferral[];
        message?: string | string[];
      };
      if (!response.ok) throw new Error(errorMessage(body, `Chapter ${nextPanel} could not be loaded.`));
      if (nextPanel === "chat") setMessages((body.data ?? []) as ClubMessage[]);
      if (nextPanel === "members") setMembers((body.data ?? []) as ClubMember[]);
      if (nextPanel === "events") setEvents((body.data ?? []) as ClubEvent[]);
      if (nextPanel === "referrals") setReferrals((body.data ?? []) as ClubReferral[]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `Chapter ${nextPanel} could not be loaded.`);
    } finally {
      setPanelLoading(false);
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const bodyText = String(form.get("body") ?? "").trim();
    if (!bodyText) return;
    setBusy(true);
    try {
      const response = await fetch(appPath(`/api/business/club/chapters/${selected.id}/messages`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: bodyText }),
      });
      const body = (await response.json()) as { data?: ClubMessage; message?: string | string[] };
      if (!response.ok) throw new Error(errorMessage(body, "Message could not be sent."));
      if (body.data) setMessages((current) => [...current, body.data!]);
      event.currentTarget.reset();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(appPath(`/api/business/club/chapters/${selected.id}/events`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          venue: form.get("venue"),
          startsAt: new Date(String(form.get("startsAt"))).toISOString(),
          endsAt: new Date(String(form.get("endsAt"))).toISOString(),
          capacity: form.get("capacity") ? Number(form.get("capacity")) : undefined,
        }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(errorMessage(body, "Event could not be created."));
      event.currentTarget.reset();
      setNotice("Chapter event published.");
      await loadPanel(selected, "events");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Event could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRegistration(clubEvent: ClubEvent) {
    if (!selected) return;
    const attending = clubEvent.registrations[0]?.status === "ATTENDING";
    setBusy(true);
    try {
      const response = await fetch(
        appPath(`/api/business/club/chapters/${selected.id}/events/${clubEvent.id}/register`),
        { method: attending ? "DELETE" : "POST" },
      );
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(errorMessage(body, "Event registration could not be updated."));
      await loadPanel(selected, "events");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Event registration could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function createReferral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(appPath(`/api/business/club/chapters/${selected.id}/referrals`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contactName: form.get("contactName"),
          referredBusiness: form.get("referredBusiness") || undefined,
          phone: form.get("phone") || undefined,
          email: form.get("email") || undefined,
          notes: form.get("notes") || undefined,
        }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(errorMessage(body, "Referral could not be added."));
      event.currentTarget.reset();
      setNotice("Chapter referral added.");
      await loadPanel(selected, "referrals");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Referral could not be added.");
    } finally {
      setBusy(false);
    }
  }

  async function updateReferral(referralId: string, status: ClubReferral["status"]) {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await fetch(
        appPath(`/api/business/club/chapters/${selected.id}/referrals/${referralId}`),
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(errorMessage(body, "Referral could not be updated."));
      await loadPanel(selected, "referrals");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Referral could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div>
          <span className="eyebrow">B2B member network</span>
          <h1>Business Club</h1>
          <p>Top-tier 5-star and 6-star members collaborate in private BNC rooms of no more than 16 businesses.</p>
          <div className="club-platform-totals">
            <span><Building2 size={15} /> {totals.registeredBusinesses} registered businesses</span>
            <span><Users size={15} /> {totals.clubMembers} Business Club memberships</span>
          </div>
        </div>
        {user.businesses.length > 1 && (
          <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>
            {user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}
          </select>
        )}
      </section>
      {notice && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {notice}</p>}
      {loading ? (
        <section className="manager-table-card">
          <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading chapters</strong></div>
        </section>
      ) : (
        <div className="business-club-layout">
          <section className="business-club-chapters">
            {chapters.map((chapter) => {
              const membership = chapter.memberships.find((item) => item.businessId === businessId)
                ?? chapter.memberships[0];
              return (
                <article className={selected?.id === chapter.id ? "active" : ""} key={chapter.id}>
                  <div><Crown size={20} /><span>{chapter.city}</span></div>
                  <h2>{chapter.name}</h2>
                  <p>{chapter.description}</p>
                  <small><MapPin size={13} /> {chapter.city}, {chapter.district}</small>
                  <small><Users size={13} /> {chapter._count.memberships}/{chapter.capacity} member businesses</small>
                  {membership ? (
                    <button type="button" onClick={() => loadPanel(chapter, "chat")}>
                      <MessageSquareText size={14} /> Open chapter workspace
                    </button>
                  ) : (
                    <button type="button" onClick={() => join(chapter)} disabled={busy}>
                      <Crown size={14} /> Join with eligible plan
                    </button>
                  )}
                </article>
              );
            })}
            {!chapters.length && (
              <div className="admin-empty">
                <Crown size={28} /><strong>No active chapters</strong>
                <span>An administrator can create city and district chapters.</span>
              </div>
            )}
          </section>
          <section className="business-club-chat business-club-workspace">
            {selected ? (
              <>
                <header>
                  <div><small>Private chapter workspace</small><h2>{selected.name}</h2></div>
                  <Users size={19} />
                </header>
                <nav className="club-workspace-tabs" aria-label="Chapter workspace">
                  <button className={panel === "chat" ? "active" : ""} type="button" onClick={() => loadPanel(selected, "chat")}><MessageSquareText size={14} /> Chat</button>
                  <button className={panel === "members" ? "active" : ""} type="button" onClick={() => loadPanel(selected, "members")}><Building2 size={14} /> Members</button>
                  <button className={panel === "events" ? "active" : ""} type="button" onClick={() => loadPanel(selected, "events")}><CalendarDays size={14} /> Events</button>
                  <button className={panel === "referrals" ? "active" : ""} type="button" onClick={() => loadPanel(selected, "referrals")}><Handshake size={14} /> Referrals</button>
                </nav>
                {panelLoading ? (
                  <div className="admin-empty club-panel-loading"><LoaderCircle className="spin" size={25} /><strong>Loading {panel}</strong></div>
                ) : panel === "chat" ? (
                  <>
                    <div className="club-chat-thread">
                      {messages.map((message) => (
                        <article className={message.senderId === user.id ? "owner" : ""} key={message.id}>
                          <strong>{message.sender.customerProfile?.displayName ?? (message.senderId === user.id ? "You" : "BNC member")}</strong>
                          <p>{message.body}</p>
                          <small>{new Date(message.createdAt).toLocaleString("en-IN")}</small>
                        </article>
                      ))}
                      {!messages.length && <div className="admin-empty"><MessageSquareText size={24} /><strong>Start the chapter conversation</strong><span>Only active members can read and reply.</span></div>}
                    </div>
                    <form className="club-chat-form" onSubmit={send}>
                      <input name="body" maxLength={2000} placeholder={`Message ${selected.name}`} required />
                      <button type="submit" disabled={busy} aria-label="Send chapter message"><Send size={16} /></button>
                    </form>
                  </>
                ) : panel === "members" ? (
                  <div className="club-member-directory">
                    {members.map((member) => (
                      <article key={member.id}>
                        <span>{member.business.logoUrl ? <Image src={member.business.logoUrl} alt="" width={44} height={44} unoptimized /> : member.business.name.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <small>{member.business.subscriptions[0]?.plan.starLevel ?? 0} BNC stars · Joined {new Date(member.joinedAt).toLocaleDateString("en-IN")}</small>
                          <h3>{member.business.name}</h3>
                          <p>{member.business.shortDescription ?? member.business.categories.map((item) => item.category.name).join(" · ")}</p>
                          <em>{member.business.locations[0]?.locality}, {member.business.locations[0]?.city}</em>
                        </div>
                        <a href={appPath(`/business/${member.business.slug}`)}>View profile</a>
                      </article>
                    ))}
                    {!members.length && <div className="admin-empty"><Users size={24} /><strong>No active members</strong></div>}
                  </div>
                ) : panel === "events" ? (
                  <div className="club-records-panel">
                    <form className="club-inline-form" onSubmit={createEvent}>
                      <h3><Plus size={15} /> Publish chapter event</h3>
                      <input name="title" minLength={3} maxLength={160} placeholder="Event title" required />
                      <input name="venue" minLength={3} maxLength={240} placeholder="Venue or meeting link" required />
                      <textarea name="description" minLength={10} maxLength={2000} placeholder="Event agenda" required />
                      <label>Starts<input name="startsAt" type="datetime-local" required /></label>
                      <label>Ends<input name="endsAt" type="datetime-local" required /></label>
                      <input name="capacity" type="number" min={2} max={10000} placeholder="Capacity (optional)" />
                      <button type="submit" disabled={busy}><CalendarDays size={14} /> Publish event</button>
                    </form>
                    <div className="club-event-list">
                      {events.map((clubEvent) => {
                        const attending = clubEvent.registrations[0]?.status === "ATTENDING";
                        return (
                          <article key={clubEvent.id}>
                            <div><CalendarDays size={18} /><small>{new Date(clubEvent.startsAt).toLocaleString("en-IN")}</small></div>
                            <h3>{clubEvent.title}</h3>
                            <p>{clubEvent.description}</p>
                            <span>{clubEvent.venue} · {clubEvent._count.registrations}{clubEvent.capacity ? `/${clubEvent.capacity}` : ""} attending</span>
                            <button type="button" disabled={busy} onClick={() => toggleRegistration(clubEvent)}>{attending ? "Cancel RSVP" : "Attend event"}</button>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="club-records-panel">
                    <form className="club-inline-form" onSubmit={createReferral}>
                      <h3><Plus size={15} /> Add chapter referral</h3>
                      <input name="contactName" minLength={2} maxLength={120} placeholder="Contact name" required />
                      <input name="referredBusiness" maxLength={160} placeholder="Business or organisation" />
                      <input name="phone" maxLength={30} placeholder="Phone" />
                      <input name="email" type="email" maxLength={254} placeholder="Email" />
                      <textarea name="notes" maxLength={2000} placeholder="Need, introduction or follow-up notes" />
                      <button type="submit" disabled={busy}><Handshake size={14} /> Add referral</button>
                    </form>
                    <div className="club-referral-list">
                      {referrals.map((referral) => (
                        <article key={referral.id}>
                          <div><small>{referral.membership.business.name} · {new Date(referral.createdAt).toLocaleDateString("en-IN")}</small><strong>{referral.status}</strong></div>
                          <h3>{referral.contactName}</h3>
                          <p>{referral.referredBusiness}{referral.notes ? ` · ${referral.notes}` : ""}</p>
                          <span>{referral.phone ?? referral.email ?? "Contact shared with chapter"}</span>
                          {referral.createdById === user.id && (
                            <select value={referral.status} onChange={(event) => updateReferral(referral.id, event.target.value as ClubReferral["status"])} disabled={busy}>
                              <option value="NEW">New</option>
                              <option value="CONTACTED">Contacted</option>
                              <option value="CONVERTED">Converted</option>
                              <option value="CLOSED">Closed</option>
                            </select>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="admin-empty">
                <MessageSquareText size={28} /><strong>Select a joined chapter</strong>
                <span>Member directory, events, referrals and chat stay inside BNC.</span>
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
