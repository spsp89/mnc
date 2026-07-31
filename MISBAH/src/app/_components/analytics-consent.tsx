"use client";

import { useEffect, useState } from "react";

type ConsentWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

const STORAGE_KEY = "misbah-analytics-consent";

export default function AnalyticsConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!localStorage.getItem(STORAGE_KEY));
  }, []);

  function choose(value: "granted" | "denied") {
    localStorage.setItem(STORAGE_KEY, value);
    (window as ConsentWindow).gtag?.("consent", "update", {
      analytics_storage: value,
    });
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <aside className="analytics-consent" aria-label="Analytics preference">
      <div>
        <strong>Your privacy choice</strong>
        <p>
          Optional analytics help improve this website. No analytics storage is
          enabled unless you accept.
        </p>
      </div>
      <div className="analytics-consent__actions">
        <button type="button" onClick={() => choose("denied")}>Decline</button>
        <button type="button" onClick={() => choose("granted")}>Accept analytics</button>
      </div>
    </aside>
  );
}
