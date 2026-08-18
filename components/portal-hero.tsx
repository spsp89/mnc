import Image from "next/image";
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export function PortalHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  tone,
  mediaLabel,
  prelude,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  image?: string;
  imageAlt?: string;
  tone: string;
  mediaLabel?: string;
  prelude?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={`catalog-hero catalog-hero-split ${tone}`}>
      <div className="catalog-hero-copy">
        {prelude}
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </div>
      <div className={`catalog-hero-media${image ? "" : " catalog-hero-media-empty"}`}>
        {image ? (
          <Image src={image} alt={imageAlt ?? ""} fill priority sizes="(max-width: 800px) 100vw, 54vw" />
        ) : (
          <div className="catalog-hero-placeholder" aria-hidden="true"><Sparkles size={42} /></div>
        )}
        {mediaLabel && <span><Sparkles size={15} /> {mediaLabel}</span>}
      </div>
    </section>
  );
}
