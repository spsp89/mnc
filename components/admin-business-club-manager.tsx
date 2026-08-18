"use client";

import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Crown,
  Handshake,
  LoaderCircle,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type AdminChapter = {
  id: string;
  name: string;
  city: string;
  district: string;
  state: string;
  isActive: boolean;
  capacity: number;
  memberships: Array<{
    id: string;
    status: "ACTIVE" | "SUSPENDED" | "LEFT";
    moderationReason: string | null;
    business: { id: string; name: string; slug: string };
    user: { id: string; email: string | null; customerProfile: { displayName: string | null } | null };
  }>;
  messages: Array<{
    id: string;
    body: string;
    deletedAt: string | null;
    moderationReason: string | null;
    createdAt: string;
    sender: { customerProfile: { displayName: string | null } | null };
  }>;
  events: Array<{ id: string; title: string; status: string; startsAt: string; _count: { registrations: number } }>;
  referrals: Array<{ id: string; contactName: string; status: string; membership: { business: { name: string } } }>;
  _count: { memberships: number; messages: number; events: number; referrals: number };
};

function messageFrom(body: { message?: string | string[] }, fallback: string) {
  return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? fallback;
}

export function AdminBusinessClubManager({ user }: { user: BncSessionUser }) {
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(appPath("/api/admin/business-club"));
      const body = (await response.json()) as { data?: AdminChapter[]; message?: string | string[] };
      if (!response.ok) throw new Error(messageFrom(body, "Business Club moderation could not be loaded."));
      setChapters(body.data ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Business Club moderation could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function createChapter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(appPath("/api/admin/business-club"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
          city: form.get("city"),
          district: form.get("district"),
          state: form.get("state"),
          description: form.get("description"),
          capacity: Number(form.get("capacity") ?? 16),
        }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(messageFrom(body, "Chapter could not be created."));
      event.currentTarget.reset();
      setNotice("Business Club chapter created.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Chapter could not be created.");
    } finally {
      setBusy("");
    }
  }

  async function moderateMembership(id: string, status: "ACTIVE" | "SUSPENDED") {
    const reason = window.prompt(`${status === "SUSPENDED" ? "Suspension" : "Reactivation"} reason`);
    if (!reason?.trim()) return;
    setBusy(id);
    try {
      const response = await fetch(appPath(`/api/admin/business-club/memberships/${id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, reason: reason.trim() }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(messageFrom(body, "Membership could not be moderated."));
      setNotice(`Membership ${status === "SUSPENDED" ? "suspended" : "reactivated"}.`);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Membership could not be moderated.");
    } finally {
      setBusy("");
    }
  }

  async function removeMessage(id: string) {
    const reason = window.prompt("Reason for removing this chapter message");
    if (!reason?.trim()) return;
    setBusy(id);
    try {
      const response = await fetch(appPath(`/api/admin/business-club/messages/${id}`), {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(messageFrom(body, "Message could not be removed."));
      setNotice("Chapter message removed from member view.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Message could not be removed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <DashboardShell mode="admin" user={user}>
      <section className="manager-heading">
        <div>
          <span className="eyebrow">B2B community operations</span>
          <h1>Business Club moderation</h1>
          <p>Create chapters and review members, events, referrals and private chapter messages from one moderation console.</p>
        </div>
      </section>
      {notice && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {notice}</p>}
      <form className="admin-club-create" onSubmit={createChapter}>
        <h2><Plus size={16} /> Create chapter</h2>
        <input name="name" minLength={3} maxLength={140} placeholder="Chapter name" required />
        <input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={160} placeholder="chapter-slug" required />
        <input name="city" minLength={2} maxLength={80} placeholder="City" required />
        <input name="district" minLength={2} maxLength={80} placeholder="District" required />
        <input name="state" minLength={2} maxLength={80} defaultValue="Kerala" placeholder="State" required />
        <textarea name="description" minLength={10} maxLength={1000} placeholder="Chapter purpose and coverage" required />
        <label>Private room size<input name="capacity" type="number" min={2} max={16} defaultValue={16} required /></label>
        <button type="submit" disabled={busy === "create"}>{busy === "create" ? <LoaderCircle className="spin" size={14} /> : <Crown size={14} />} Create chapter</button>
      </form>
      {loading ? (
        <section className="manager-table-card"><div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading club operations</strong></div></section>
      ) : (
        <div className="admin-club-chapters">
          {chapters.map((chapter) => (
            <section className="manager-table-card" key={chapter.id}>
              <header>
                <div><small>{chapter.city}, {chapter.district}</small><h2>{chapter.name}</h2></div>
                <div className="admin-club-counts">
                  <span><Users size={13} /> {chapter._count.memberships}</span>
                  <span><CalendarDays size={13} /> {chapter._count.events}</span>
                  <span><Handshake size={13} /> {chapter._count.referrals}</span>
                  <span><MessageSquareText size={13} /> {chapter._count.messages}</span>
                </div>
              </header>
              <div className="admin-club-columns">
                <div>
                  <h3><Users size={14} /> Memberships</h3>
                  {chapter.memberships.map((membership) => (
                    <article key={membership.id}>
                      <div><strong>{membership.business.name}</strong><small>{membership.user.customerProfile?.displayName ?? membership.user.email}</small></div>
                      <span className={`status-chip ${membership.status.toLowerCase()}`}>{membership.status}</span>
                      <button type="button" disabled={busy === membership.id} onClick={() => moderateMembership(membership.id, membership.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}>{membership.status === "ACTIVE" ? <Ban size={13} /> : <CheckCircle2 size={13} />}{membership.status === "ACTIVE" ? "Suspend" : "Reactivate"}</button>
                    </article>
                  ))}
                </div>
                <div>
                  <h3><ShieldCheck size={14} /> Recent messages</h3>
                  {chapter.messages.map((message) => (
                    <article key={message.id}>
                      <div><strong>{message.sender.customerProfile?.displayName ?? "BNC member"}</strong><small>{message.deletedAt ? `Removed · ${message.moderationReason}` : message.body}</small></div>
                      {!message.deletedAt && <button type="button" disabled={busy === message.id} onClick={() => removeMessage(message.id)}><Ban size={13} /> Remove</button>}
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ))}
          {!chapters.length && <section className="manager-table-card"><div className="admin-empty"><Crown size={28} /><strong>No Business Club chapters</strong><span>Create the first chapter above.</span></div></section>}
        </div>
      )}
    </DashboardShell>
  );
}
