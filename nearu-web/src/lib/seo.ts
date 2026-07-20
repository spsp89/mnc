import type { Metadata } from "next";

export const siteName = "Nearu";
export const siteDescription =
  "Discover trusted local businesses, categories, offers, and services near you with the Nearu marketplace.";

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${normalizedPath}`;
}

export function pageTitle(title?: string) {
  return title ? `${title} | ${siteName}` : `${siteName} | Local Marketplace`;
}

export function defaultOpenGraph(overrides: Metadata["openGraph"] = {}) {
  return {
    siteName,
    type: "website",
    locale: "en_US",
    ...overrides,
  } satisfies Metadata["openGraph"];
}

export function imageForMeta(url?: string) {
  if (!url) {
    return absoluteUrl("/mockup/im-restaurant.jpg");
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return absoluteUrl(url);
}
