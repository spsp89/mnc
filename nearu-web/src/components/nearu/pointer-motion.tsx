"use client";

import { useEffect } from "react";

const motionSelector = [
  "a[href]",
  "button",
  "article",
  "[data-motion='card']",
  "[class*='shadow-'][class*='border']",
].join(", ");

export function PointerMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let activeElement: HTMLElement | null = null;
    let frame = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let slideX = pointerX;
    let slideY = pointerY;

    const syncSlide = () => {
      slideX += (pointerX - slideX) * 0.14;
      slideY += (pointerY - slideY) * 0.14;
      document.documentElement.style.setProperty("--pointer-slide-x", `${slideX}px`);
      document.documentElement.style.setProperty("--pointer-slide-y", `${slideY}px`);
      frame = window.requestAnimationFrame(syncSlide);
    };

    frame = window.requestAnimationFrame(syncSlide);

    const clearActiveElement = () => {
      if (!activeElement) {
        return;
      }

      activeElement.style.transform = "";
      activeElement.style.setProperty("--motion-light-x", "50%");
      activeElement.style.setProperty("--motion-light-y", "50%");
      activeElement = null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);

      const source = event.target instanceof Element ? event.target : null;
      const motionCard = source?.closest<HTMLElement>("[data-motion='card']") ?? null;
      const target = motionCard ?? source?.closest<HTMLElement>(motionSelector) ?? null;

      if (!target || target.closest("[data-motion='off']") || target.matches("input, textarea, select, label")) {
        clearActiveElement();
        return;
      }

      if (activeElement && activeElement !== target) {
        clearActiveElement();
      }

      activeElement = target;
      const rect = target.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const isPanel = target.tagName === "ARTICLE" || target.dataset.motion === "card" || target.className.includes("shadow-");
      const lift = isPanel ? -5 : -2;
      const rotateX = Math.max(Math.min(y * -5, 5), -5);
      const rotateY = Math.max(Math.min(x * 5, 5), -5);

      target.style.setProperty("--motion-light-x", `${(x + 0.5) * 100}%`);
      target.style.setProperty("--motion-light-y", `${(y + 0.5) * 100}%`);
      target.style.transform = `perspective(800px) translate3d(0, ${lift}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (activeElement && event.relatedTarget instanceof Node && activeElement.contains(event.relatedTarget)) {
        return;
      }

      clearActiveElement();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });
    window.addEventListener("blur", clearActiveElement);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("blur", clearActiveElement);
      window.cancelAnimationFrame(frame);
      clearActiveElement();
    };
  }, []);

  return null;
}
