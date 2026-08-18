"use client";

import {
  Apple,
  ArrowRight,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Building2,
  CakeSlice,
  Camera,
  CarFront,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HeartPulse,
  Hotel,
  House,
  Laptop,
  Scissors,
  ShieldCheck,
  Stethoscope,
  Store,
  Utensils,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { HomeIconName } from "@/lib/home-types";
import type { BncStarLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons = {
  Apple,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Building2,
  CakeSlice,
  Camera,
  CarFront,
  GraduationCap,
  HeartPulse,
  Hotel,
  House,
  Laptop,
  Scissors,
  ShieldCheck,
  Stethoscope,
  Store,
  Utensils,
  Wrench,
};

export function HomeIcon({
  name,
  size = 22,
}: {
  name: HomeIconName;
  size?: number;
}) {
  const Icon = icons[name] ?? Store;
  return <Icon size={size} aria-hidden="true" />;
}

export function HomeSectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  action,
  light = false,
  headingId,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
  light?: boolean;
  headingId?: string;
}) {
  return (
    <div className={cn("bnc-section-header", light && "is-light")}>
      <div>
        <span className="bnc-eyebrow">{eyebrow}</span>
        <h2 id={headingId}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
      {!action && href && (
        <Link href={href}>
          {linkLabel} <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}

export function BNCStarBadge({
  level,
  premium = false,
  planName,
}: {
  level: BncStarLevel;
  premium?: boolean;
  planName?: string;
}) {
  const fallbackPlanName = {
    0: "",
    1: "Bronze",
    2: "Silver",
    3: "Gold",
    4: "Platinum",
    5: "Diamond",
    6: "Ruby",
  }[level];
  const activePlanName = planName?.trim() || fallbackPlanName;
  if (!activePlanName || level === 0) return null;
  const stars = "⭐".repeat(level);
  return (
    <span
      className={cn("bnc-star-badge", premium && "is-premium")}
      aria-label={`BNC ${level} star ${activePlanName} plan`}
      title="BNC stars reflect the business subscription plan"
    >
      BNC <span aria-hidden="true">{stars}</span> · {activePlanName}
    </span>
  );
}

export function HorizontalCarousel({
  label,
  children,
  className,
  toolbarLabel,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  toolbarLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const distance = Math.min(track.clientWidth * 0.82, 920);
    const reachedEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 12;
    track.scrollTo({
      left: direction === 1 && reachedEnd ? 0 : Math.max(0, track.scrollLeft + direction * distance),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      if (!pausedRef.current && track.scrollWidth > track.clientWidth + 12) scroll(1);
    }, 4_500);
    return () => window.clearInterval(interval);
  }, []);

  const controls = (
    <div className="bnc-carousel-controls">
      <button type="button" onClick={() => scroll(-1)} aria-label={`Scroll ${label} backward`}>
        <ChevronLeft size={19} />
      </button>
      <button type="button" onClick={() => scroll(1)} aria-label={`Scroll ${label} forward`}>
        <ChevronRight size={19} />
      </button>
    </div>
  );

  return (
    <div className={cn("bnc-carousel", className)} aria-label={label}>
      {toolbarLabel ? (
        <div className="bnc-carousel-toolbar">
          <span>{toolbarLabel}</span>
          {controls}
        </div>
      ) : controls}
      <div
        className="bnc-carousel-track"
        ref={trackRef}
        onPointerEnter={() => { pausedRef.current = true; }}
        onPointerLeave={() => { pausedRef.current = false; }}
        onPointerDown={() => { pausedRef.current = true; }}
        onPointerUp={() => { pausedRef.current = false; }}
        onFocusCapture={() => { pausedRef.current = true; }}
        onBlurCapture={() => { pausedRef.current = false; }}
      >
        {children}
      </div>
    </div>
  );
}

export function HomeEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bnc-empty-state">
      <Store size={27} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
