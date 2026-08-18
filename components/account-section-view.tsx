"use client";

import { ArrowLeft, Ban, Bell, Bookmark, CheckCircle2, Clock3, Eye, MapPinned, MessageCircle, Search, Settings, ShieldCheck, Star, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { BncSessionUser } from "@/lib/auth-types";
import { displayNameFor } from "@/lib/auth-types";
import { AppShell } from "@/components/app-shell";
import type { CustomerPortalData } from "@/lib/portal-data";

const sectionMeta = {
  enquiries: { eyebrow: "Requests and responses", title: "Your enquiries", description: "Track each requirement, permitted contact channel and business response." },
  reviews: { eyebrow: "Your contributions", title: "My reviews", description: "See published feedback and manage reviews that still need attention." },
  history: { eyebrow: "Recent discovery", title: "Search history", description: "Return to useful local searches or clear them from this account." },
  addresses: { eyebrow: "Saved places", title: "Your addresses", description: "Keep delivery and service locations ready for faster, consent-aware requests." },
  blocked: { eyebrow: "Contact controls", title: "Blocked businesses", description: "Prevent unwanted businesses from messaging or receiving future matched enquiries." },
  privacy: { eyebrow: "Consent centre", title: "Privacy & consent", description: "Control contact, history and personal data choices without hunting through settings." },
  settings: { eyebrow: "Account preferences", title: "Settings", description: "Choose language, locality and notification defaults for this BNC account." },
} as const;

export type AccountSection = keyof typeof sectionMeta;

export function AccountSectionView({
  section,
  user,
  data,
}: {
  section: AccountSection;
  user: BncSessionUser;
  data: CustomerPortalData;
}) {
  const meta = sectionMeta[section];
  const [history, setHistory] = useState(data.history);
  const [preferences, setPreferences] = useState({ enquiryUpdates: false, offerUpdates: false, personalisedHistory: false, preciseLocation: false });
  const [addresses, setAddresses] = useState(data.addresses);
  const [blocked, setBlocked] = useState(data.blocked);
  const [savedMessage, setSavedMessage] = useState("");

  return (
    <AppShell headerVariant="immersive">
      <section className="account-section-page">
        <div className="account-section-hero">
          <div>
            <Link className="back-link" href="/account"><ArrowLeft size={15} /> Account overview</Link>
            <div className="account-section-heading"><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.title}</h1><p>{meta.description}</p></div>
          </div>
        </div>
        <div className="account-section-content">

        {section === "enquiries" && (
          data.enquiries.length ? (
            <div className="full-enquiry-list">
              {data.enquiries.map((enquiry) => (
                <article key={enquiry.id}>
                  <span className="enquiry-status waiting"><MessageCircle size={18} /></span>
                  <div>
                    <small>{enquiry.status.replaceAll("_", " ")} · {enquiry.urgency}</small>
                    <h2>{enquiry.businessName}</h2>
                    <p>{enquiry.requirement}</p>
                    <div><span><MapPinned size={13} /> {enquiry.location}</span><strong>{enquiry.createdAt.slice(0, 10)}</strong></div>
                  </div>
                  <Link href={`/account/enquiries/${enquiry.id}`}>View enquiry</Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><MessageCircle size={28} /><h2>No enquiries yet</h2><p>Enquiries returned by the backend will appear here.</p><Link href="/enquiry">Start an enquiry</Link></div>
          )
        )}

        {section === "reviews" && (
          data.reviews.length ? (
            <div className="account-review-list">
              {data.reviews.map((review) => (
                <article key={review.id}>
                  <span>{review.rating}/5</span>
                  <div>
                    <small>{review.status.replaceAll("_", " ")} · {review.createdAt.slice(0, 10)}</small>
                    <h2>Demo customer review</h2>
                    <div className="review-stars">{Array.from({ length: review.rating }, (_, index) => <Star key={index} size={13} fill="currentColor" />)}</div>
                    <p>{review.body}</p>
                  </div>
                  <strong>{review.helpfulCount} helpful</strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Star size={28} /><h2>No reviews yet</h2><p>Reviews returned by the backend will appear here.</p></div>
          )
        )}

        {section === "history" && (
          <>
            <div className="account-section-action"><span><Search size={17} /> History is visible only to this account.</span>{history.length > 0 && <button type="button" onClick={() => setHistory([])}><Trash2 size={14} /> Clear history</button>}</div>
            {history.length ? <div className="history-list">{history.map((item) => <Link href={`/search?q=${encodeURIComponent(item.query)}&location=${encodeURIComponent(item.location)}`} key={item.id}><Search size={17} /><div><strong>{item.query}</strong><small>{item.location} · {item.time.slice(0, 10)}</small></div><span>Search again</span></Link>)}</div> : <div className="empty-state"><Eye size={28} /><h2>History cleared</h2><p>New searches will appear here only while personalised history is enabled.</p></div>}
          </>
        )}

        {section === "addresses" && (
          <div className="settings-panel">
            <div className="settings-user-note"><MapPinned size={20} /><div><strong>Saved service and delivery locations</strong><p>Only the address selected for an order or enquiry is shared.</p></div></div>
            {addresses.map((address) => (
              <div className="preference-row" key={address.id}>
                <MapPinned size={18} />
                <div><strong>{address.label}{address.isDefault ? " · Default" : ""}</strong><p>{address.address}</p></div>
                <button type="button" aria-label={`Remove ${address.label}`} onClick={() => setAddresses((items) => items.filter((item) => item.id !== address.id))}><Trash2 size={15} /></button>
              </div>
            ))}
            <form className="account-settings-form" onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const label = String(form.get("label") || "").trim();
              const address = String(form.get("address") || "").trim();
              if (label && address) {
                setAddresses((items) => [...items, { id: `${Date.now()}`, label, address, isDefault: items.length === 0 }]);
                event.currentTarget.reset();
              }
            }}>
              <label>Label<input name="label" required maxLength={40} placeholder="Work" /></label>
              <label>Full address<input name="address" required maxLength={240} placeholder="Locality, city and PIN code" /></label>
              <button type="submit"><MapPinned size={15} /> Save address</button>
            </form>
          </div>
        )}

        {section === "blocked" && (
          <div className="settings-panel">
            <div className="settings-user-note"><Ban size={20} /><div><strong>Businesses cannot override this list</strong><p>Blocking removes the business from future matching and closes direct messaging.</p></div></div>
            {blocked.length ? blocked.map((business) => (
              <div className="preference-row" key={business.id}>
                <Ban size={18} />
                <div><strong>{business.name}</strong><p>{business.reason}</p></div>
                <button type="button" onClick={() => setBlocked((items) => items.filter((item) => item.id !== business.id))}>Unblock</button>
              </div>
            )) : <div className="empty-state"><ShieldCheck size={28} /><h2>No blocked businesses</h2><p>You are in control of who can contact you.</p></div>}
            <p>Use “Report profile” on a business page to send suspected spam or abuse to BNC moderators.</p>
          </div>
        )}

        {section === "privacy" && (
          <div className="settings-panel">
            <div className="settings-user-note"><ShieldCheck size={20} /><div><strong>Signed in as {user.email ?? user.phone}</strong><p>Consent for an individual enquiry can be narrower than these account defaults.</p></div></div>
            <PreferenceRow icon={MessageCircle} title="Enquiry progress updates" detail="Allow service-status messages by the contact channel used in the enquiry." active={preferences.enquiryUpdates} onChange={(value) => setPreferences((current) => ({ ...current, enquiryUpdates: value }))} />
            <PreferenceRow icon={Bookmark} title="Saved-business offer updates" detail="Receive occasional updates only from profiles you save." active={preferences.offerUpdates} onChange={(value) => setPreferences((current) => ({ ...current, offerUpdates: value }))} />
            <PreferenceRow icon={Clock3} title="Personalised search history" detail="Keep recent searches available in this account." active={preferences.personalisedHistory} onChange={(value) => setPreferences((current) => ({ ...current, personalisedHistory: value }))} />
            <PreferenceRow icon={ShieldCheck} title="Precise location by default" detail="Use device location only after browser permission; otherwise use your selected locality." active={preferences.preciseLocation} onChange={(value) => setPreferences((current) => ({ ...current, preciseLocation: value }))} />
            <div className="data-rights"><div><strong>Your data rights</strong><p>Request an export, correction or deletion review from the privacy team.</p></div><Link href="/contact?topic=privacy">Start a privacy request</Link></div>
          </div>
        )}

        {section === "settings" && (
          <form className="settings-panel account-settings-form" onSubmit={(event) => { event.preventDefault(); setSavedMessage("Preferences saved for this session."); }}>
            <div className="settings-user-note"><UserRound size={20} /><div><strong>{displayNameFor(user)}</strong><p>{user.email ?? user.phone} · identity managed by BNC</p></div></div>
            <label>Preferred language<select defaultValue="en"><option value="en">English</option></select></label>
            <label>Default city<select defaultValue="Kochi"><option>Kochi</option><option>Kozhikode</option><option>Thrissur</option><option>Thiruvananthapuram</option></select></label>
            <label>Default search radius<select defaultValue="5"><option value="3">3 km</option><option value="5">5 km</option><option value="10">10 km</option><option value="25">25 km</option></select></label>
            <PreferenceRow icon={Bell} title="Browser notifications" detail="Ask this browser before enabling timely enquiry updates." active={preferences.enquiryUpdates} onChange={(value) => setPreferences((current) => ({ ...current, enquiryUpdates: value }))} />
            {savedMessage && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {savedMessage}</p>}
            <button type="submit"><Settings size={15} /> Save preferences</button>
          </form>
        )}
        </div>
      </section>
    </AppShell>
  );
}

function PreferenceRow({ icon: Icon, title, detail, active, onChange }: { icon: typeof Bell; title: string; detail: string; active: boolean; onChange: (value: boolean) => void }) {
  return <div className="preference-row"><Icon size={18} /><div><strong>{title}</strong><p>{detail}</p></div><button type="button" className={active ? "active" : ""} aria-pressed={active} onClick={() => onChange(!active)}><span /></button></div>;
}
