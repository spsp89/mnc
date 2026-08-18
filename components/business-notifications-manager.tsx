"use client";

import {
  BellRing,
  Check,
  CheckCheck,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MessageCircle,
  MessagesSquare,
  Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type Channel = "inApp" | "push" | "email" | "sms" | "whatsapp";

type Preference = {
  type: string;
  inApp: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
};

type Notification = {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
  createdAt: string;
};

const preferenceTypes = [
  ["NEW_LEAD", "New matching lead"],
  ["NEW_ENQUIRY", "New direct enquiry"],
  ["CUSTOMER_RESPONSE", "Customer response"],
  ["REVIEW_RECEIVED", "New published review"],
  ["ORDER_UPDATE", "Order activity"],
  ["BOOKING_REMINDER", "Booking reminder"],
  ["PAYMENT_CONFIRMATION", "Payment confirmation"],
  ["SUBSCRIPTION_RENEWAL", "Subscription renewal"],
  ["OFFER_EXPIRY", "Offer expiry"],
  ["VERIFICATION_UPDATE", "Verification update"],
] as const;

const channels: Array<{ id: Channel; label: string; icon: typeof BellRing }> = [
  { id: "inApp", label: "In app", icon: BellRing },
  { id: "push", label: "Push", icon: Smartphone },
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: MessagesSquare },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

function readable(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function BusinessNotificationsManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [notificationResponse, preferenceResponse] = await Promise.all([
        fetch(appPath("/api/business/notifications")),
        fetch(appPath("/api/notifications/preferences")),
      ]);
      const notificationBody = await notificationResponse.json() as { data?: Notification[]; message?: string | string[] };
      const preferenceBody = await preferenceResponse.json() as { data?: Preference[]; message?: string | string[] };
      if (!notificationResponse.ok || !preferenceResponse.ok) {
        const errorMessage = notificationBody.message ?? preferenceBody.message;
        throw new Error(Array.isArray(errorMessage) ? errorMessage.join(" ") : errorMessage ?? "Notification settings could not be loaded.");
      }
      setNotifications(notificationBody.data ?? []);
      setPreferences(preferenceBody.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notification settings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const visibleNotifications = useMemo(() => notifications.filter((notification) => {
    const notificationBusinessId = typeof notification.data?.businessId === "string" ? notification.data.businessId : null;
    return !notificationBusinessId || notificationBusinessId === businessId;
  }), [businessId, notifications]);
  const unread = visibleNotifications.filter((notification) => !notification.readAt).length;

  function preference(type: string): Preference {
    return preferences.find((item) => item.type === type) ?? {
      type,
      inApp: true,
      push: true,
      email: false,
      sms: false,
      whatsapp: false,
    };
  }

  async function update(type: string, channel: Channel, enabled: boolean) {
    const key = `${type}:${channel}`;
    const previous = preferences;
    const current = preference(type);
    setPreferences((items) => [...items.filter((item) => item.type !== type), { ...current, [channel]: enabled }]);
    setBusyKey(key);
    setMessage("");
    try {
      const response = await fetch(appPath("/api/notifications/preferences"), {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, [channel]: enabled }),
      });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Preference could not be saved.");
      setMessage(`${readable(type)} ${channels.find((item) => item.id === channel)?.label.toLowerCase()} alerts ${enabled ? "enabled" : "disabled"}.`);
    } catch (error) {
      setPreferences(previous);
      setMessage(error instanceof Error ? error.message : "Preference could not be saved.");
    } finally {
      setBusyKey("");
    }
  }

  async function markRead(notification?: Notification) {
    setBusyKey(notification?.id ?? "all");
    try {
      const response = await fetch(
        appPath(notification ? `/api/business/notifications/${notification.id}/read` : "/api/business/notifications/read-all"),
        { method: "PATCH" },
      );
      if (!response.ok) throw new Error("Read state could not be saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Read state could not be saved.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading"><div><span className="eyebrow">Delivery preferences</span><h1>Notifications</h1><p>Control each real alert channel and review the delivery and read state of workspace notifications.</p></div><div className="business-product-heading-actions">{user.businesses.length > 1 && <label><span>Business</span><select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select></label>}{unread > 0 && <button type="button" onClick={() => void markRead()} disabled={Boolean(busyKey)}><CheckCheck size={15} /> Mark all read</button>}</div></section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={15} /> {message}</p>}
      <section className="manager-table-card business-notification-settings"><header><div><span className="eyebrow">Alert channels</span><h2>Choose how BNC reaches your team</h2></div></header>{loading ? <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading preferences</strong></div> : <div className="business-preference-table"><div className="business-preference-header"><strong>Activity</strong>{channels.map((channel) => <span key={channel.id}>{channel.label}</span>)}</div>{preferenceTypes.map(([type, label]) => { const current = preference(type); return <article key={type}><div><strong>{label}</strong><small>{readable(type)}</small></div>{channels.map((channel) => { const Icon = channel.icon; const key = `${type}:${channel.id}`; return <label key={channel.id} title={`${channel.label}: ${label}`}><Icon size={15} /><input type="checkbox" checked={current[channel.id]} onChange={(event) => void update(type, channel.id, event.target.checked)} disabled={busyKey === key} /><i>{busyKey === key ? <LoaderCircle className="spin" size={13} /> : current[channel.id] ? <Check size={13} /> : null}</i><span className="sr-only">{channel.label}</span></label>; })}</article>; })}</div>}</section>
      <section className="manager-table-card business-notification-feed"><header><div><span className="eyebrow">Delivery history</span><h2>Recent alerts</h2></div><strong>{unread} unread</strong></header>{visibleNotifications.length ? <div>{visibleNotifications.map((notification) => <article className={notification.readAt ? "" : "unread"} key={notification.id}><span><BellRing size={17} /></span><div><small>{readable(notification.type)} · {readable(notification.channel)}</small><h3>{notification.title}</h3><p>{notification.body}</p><time>{new Date(notification.createdAt).toLocaleString("en-IN")}{notification.failedAt ? " · Delivery failed" : notification.sentAt ? " · Sent" : " · Queued"}</time></div>{!notification.readAt && <button type="button" onClick={() => void markRead(notification)} disabled={busyKey === notification.id}><Check size={14} /> Mark read</button>}</article>)}</div> : <div className="admin-empty business-short-empty"><BellRing size={27} /><strong>No notifications for this workspace</strong><span>Lead, enquiry, review, order and billing alerts will appear here.</span></div>}</section>
    </DashboardShell>
  );
}
