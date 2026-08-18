"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const notifications: Array<{ id: string; title: string; body: string; time: string; href: string }> = [];

export function NotificationsView() {
  const [read, setRead] = useState<string[]>([]);
  return (
    <section className="page-section personal-list-page notifications-page">
      <div className="catalog-heading">
        <div><span className="eyebrow">Useful updates only</span><h1>Notifications</h1><p>Responses, saved-business changes and enquiry progress.</p></div>
        <button type="button" disabled={!notifications.length} onClick={() => setRead(notifications.map((item) => item.id))}><CheckCheck size={15} /> Mark all read</button>
      </div>
      <div className="notification-list">
        {notifications.map((item) => (
            <Link className={read.includes(item.id) ? "read" : ""} href={item.href} key={item.id} onClick={() => setRead((current) => [...new Set([...current, item.id])])}>
              <span><Bell size={19} /></span>
              <div><strong>{item.title}</strong><p>{item.body}</p><small>{item.time}</small></div>
              {!read.includes(item.id) && <i aria-label="Unread" />}
            </Link>
        ))}
        {!notifications.length && <div className="empty-state"><Bell size={28} /><h2>No notifications yet</h2><p>Backend-delivered account updates will appear here.</p></div>}
      </div>
      <div className="notification-settings-note"><Bell size={18} /><div><strong>You control the noise.</strong><p>Manage channel and consent preferences from your account settings.</p></div><Link href="/account/settings">Notification settings</Link></div>
    </section>
  );
}
