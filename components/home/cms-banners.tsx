"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Banner = { id: string; title: string; subtitle: string | null; ctaText: string | null; ctaUrl: string | null; imageUrl: string; placement: string };

export function CmsBanners({ placement }: { placement: "HOME_HERO" | "HOME_SECONDARY" }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/content/banners?placement=${placement}`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ data?: Banner[] }> : { data: [] })
      .then((body) => setBanners(body.data ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [placement]);
  if (!banners.length) return null;
  return <section className="bnc-cms-banners" aria-label="Featured announcements">{banners.map((banner) => <article key={banner.id}>
    <Image unoptimized src={banner.imageUrl} alt="" fill sizes="100vw"/>
    <div><h2>{banner.title}</h2>{banner.subtitle && <p>{banner.subtitle}</p>}{banner.ctaText && banner.ctaUrl && (banner.ctaUrl.startsWith("/") ? <Link href={banner.ctaUrl}>{banner.ctaText}</Link> : <a href={banner.ctaUrl} rel="noopener noreferrer">{banner.ctaText}</a>)}</div>
  </article>)}</section>;
}
