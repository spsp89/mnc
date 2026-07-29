"use client";

import { useEffect, type AnchorHTMLAttributes, type ReactNode } from "react";

type AnalyticsEventType =
  | "call_click"
  | "whatsapp_click"
  | "route_click"
  | "business_card_view"
  | "business_card_share_click"
  | "upi_click"
  | "payment_click";

type TrackPayload = {
  businessSlug: string;
  eventType: AnalyticsEventType;
  source: string;
  metadata?: Record<string, string | number | boolean>;
};

export function AnalyticsLink({
  businessSlug,
  eventType,
  source,
  metadata,
  children,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & TrackPayload & { children: ReactNode }) {
  return (
    <a
      {...props}
      onClick={(event) => {
        void trackAnalytics({ businessSlug, eventType, source, metadata });
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}

export function AnalyticsView({
  businessSlug,
  eventType,
  source,
  metadata,
}: TrackPayload) {
  useEffect(() => {
    void trackAnalytics({ businessSlug, eventType, source, metadata });
  }, [businessSlug, eventType, source, metadata]);

  return null;
}

async function trackAnalytics(payload: TrackPayload) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics must never block customer actions.
  }
}
