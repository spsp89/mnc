"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function AutoSlideRail({
  children,
  className,
  intervalMs = 2800,
}: {
  children: ReactNode;
  className: string;
  intervalMs?: number;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const timer = window.setInterval(() => {
      if (pausedRef.current || rail.scrollWidth <= rail.clientWidth) return;

      const card = rail.querySelector<HTMLElement>("[data-auto-slide-item]");
      const step = card ? card.offsetWidth + 12 : Math.floor(rail.clientWidth * 0.82);
      const nearEnd = rail.scrollLeft + rail.clientWidth + step >= rail.scrollWidth;

      rail.scrollTo({
        left: nearEnd ? 0 : rail.scrollLeft + step,
        behavior: "smooth",
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return (
    <div
      ref={railRef}
      className={className}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      onFocus={() => {
        pausedRef.current = true;
      }}
      onBlur={() => {
        pausedRef.current = false;
      }}
    >
      {children}
    </div>
  );
}
