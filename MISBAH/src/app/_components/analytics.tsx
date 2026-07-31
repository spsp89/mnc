"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

type EventProperties = Record<string, string | number | boolean>;

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  plausible?: (event: string, options?: { props?: EventProperties }) => void;
};

export function trackAnalyticsEvent(name: string, properties: EventProperties = {}) {
  if (typeof window === "undefined") return;

  const analyticsWindow = window as AnalyticsWindow;
  const detail = { name, properties };

  window.dispatchEvent(new CustomEvent("misbah:analytics", { detail }));

  analyticsWindow.gtag?.("event", name, properties);
  analyticsWindow.plausible?.(name, { props: properties });
}

function reportWebVital(metric: {
  id: string;
  name: string;
  value: number;
  rating?: string;
}) {
  trackAnalyticsEvent("web_vital", {
    metric_id: metric.id,
    metric_name: metric.name,
    metric_value: Math.round(
      metric.name === "CLS" ? metric.value * 1000 : metric.value,
    ),
    metric_rating: metric.rating || "unknown",
  });
}

export default function Analytics() {
  const pathname = usePathname();

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    trackAnalyticsEvent("page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });

    if (/^\/services\/[^/]+$/.test(pathname)) {
      trackAnalyticsEvent("service_view", { path: pathname });
    } else if (/^\/work\/[^/]+$/.test(pathname)) {
      trackAnalyticsEvent("case_study_view", { path: pathname });
    } else if (pathname === "/contact") {
      trackAnalyticsEvent("contact_view", { path: pathname });
    }
  }, [pathname]);

  useEffect(() => {
    function trackClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const element = target.closest<HTMLElement>("[data-analytics-event]");
      if (!element) return;

      trackAnalyticsEvent(element.dataset.analyticsEvent || "cta_click", {
        path: window.location.pathname,
        location: element.dataset.analyticsLocation || "unknown",
        label: element.dataset.analyticsLabel || element.textContent?.trim() || "unlabelled",
      });
    }

    document.addEventListener("click", trackClick);
    return () => document.removeEventListener("click", trackClick);
  }, []);

  return null;
}
