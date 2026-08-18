"use client";

import {
  ArrowRight,
  Bell,
  Bookmark,
  ChevronRight,
  Clock3,
  Eye,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserRound,
  MapPinned,
  CalendarCheck2,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { MouseEvent, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BusinessCard } from "@/components/business-card";
import type { BncSessionUser } from "@/lib/auth-types";
import { displayNameFor } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import type { CustomerPortalData } from "@/lib/portal-data";

export function CustomerAccountView({
  user,
  data,
  signOutPath,
}: {
  user: BncSessionUser;
  data: CustomerPortalData;
  signOutPath: string;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const displayName = displayNameFor(user);
  const activeEnquiries = data.enquiries.filter(
    (enquiry) => !["CLOSED", "EXPIRED", "SPAM"].includes(enquiry.status),
  );

  async function signOut(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setSigningOut(true);
    try {
      const response = await fetch(appPath(signOutPath), {
        method: "POST",
        redirect: "follow",
      });
      window.location.assign(response.url || appPath("/"));
    } catch {
      setSigningOut(false);
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <AppShell headerVariant="immersive">
      <div className="account-page">
        <aside className="account-sidebar">
          <div className="account-user"><span>{displayName.slice(0, 2).toUpperCase()}</span><div><strong>{displayName}</strong><small>{user.email ?? user.phone}</small></div></div>
          <nav>
            <Link className="active" href="/account"><UserRound size={16} /> Overview</Link>
            <Link href="/account/enquiries"><MessageCircle size={16} /> Enquiries</Link>
            <Link href="/account/messages"><MessageCircle size={16} /> Messages</Link>
            <Link href="/account/bookings"><CalendarCheck2 size={16} /> My bookings</Link>
            <Link href="/saved"><Bookmark size={16} /> Saved</Link>
            <Link href="/account/reviews"><Star size={16} /> My reviews</Link>
            <Link href="/account/history"><Clock3 size={16} /> Search history</Link>
            <Link href="/account/addresses"><MapPinned size={16} /> Saved addresses</Link>
            <Link href="/account/blocked"><Ban size={16} /> Blocked businesses</Link>
            <Link href="/notifications"><Bell size={16} /> Notifications</Link>
            <Link href="/account/privacy"><ShieldCheck size={16} /> Privacy &amp; consent</Link>
            <Link href="/account/settings"><Settings size={16} /> Settings</Link>
          </nav>
          <form action={appPath(signOutPath)} method="post">
            <button className="account-signout" type="submit" disabled={signingOut} onClick={signOut}>
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </form>
        </aside>
        <div className="account-main">
          <section className="account-welcome">
            <div><span className="eyebrow">Your BNC</span><h1>Good to have you here.</h1><p>Continue local decisions without starting over.</p></div>
            <Link href="/search"><Search size={16} /> Find something nearby</Link>
          </section>
          <section className="account-stat-grid">
            <article><span><Bookmark size={18} /></span><div><strong>{data.savedBusinesses.length}</strong><small>Saved businesses</small></div><Link href="/saved"><ChevronRight size={16} /></Link></article>
            <article><span><MessageCircle size={18} /></span><div><strong>{activeEnquiries.length}</strong><small>Active enquiries</small></div><Link href="/account/enquiries"><ChevronRight size={16} /></Link></article>
            <article><span><Eye size={18} /></span><div><strong>{data.recentBusinessCount}</strong><small>Recently viewed</small></div><Link href="/account/history"><ChevronRight size={16} /></Link></article>
            <article><span><Star size={18} /></span><div><strong>{data.reviews.length}</strong><small>Reviews submitted</small></div><Link href="/account/reviews"><ChevronRight size={16} /></Link></article>
          </section>
          <section className="account-card">
            <div className="account-card-heading"><div><span className="eyebrow">In progress</span><h2>Your enquiries</h2></div><Link href="/account/enquiries">View all <ArrowRight size={15} /></Link></div>
            {data.enquiries.length ? (
              <div className="account-enquiry-list">
                {data.enquiries.slice(0, 4).map((enquiry) => (
                  <article key={enquiry.id}>
                    <span className={`enquiry-status ${enquiry.status === "RESPONDED" ? "responding" : "waiting"}`}><MessageCircle size={17} /></span>
                    <div>
                      <strong>{enquiry.businessName}</strong>
                      <small>{enquiry.status.replaceAll("_", " ")} · {enquiry.location}</small>
                      <p>{enquiry.requirement}</p>
                    </div>
                    <span><b>{enquiry.urgency}</b></span>
                    <Link href={`/account/enquiries/${enquiry.id}`}><ChevronRight size={16} /></Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><MessageCircle size={28} /><h2>No enquiries yet</h2><p>Submitted enquiries and replies will appear here.</p><Link href="/enquiry">Start an enquiry</Link></div>
            )}
          </section>
          <section className="account-card">
            <div className="account-card-heading"><div><span className="eyebrow">Your shortlist</span><h2>Saved for later</h2></div><Link href="/saved">Open saved <ArrowRight size={15} /></Link></div>
            {data.savedBusinesses.length ? <div className="business-grid account-business-grid">
              {data.savedBusinesses.slice(0, 3).map((business) => <BusinessCard business={business} key={business.id} />)}
            </div> : <div className="empty-state"><Bookmark size={28} /><h2>No saved businesses</h2><p>Your backend-synced shortlist will appear here.</p></div>}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
