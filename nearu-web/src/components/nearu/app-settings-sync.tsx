"use client";

import { useEffect } from "react";

type AppSettings = {
  siteName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  mutedTextColor: string;
  updateIntervalSeconds: number;
};

const variableMap: Array<[keyof AppSettings, string]> = [
  ["backgroundColor", "--background"],
  ["primaryColor", "--foreground"],
  ["primaryColor", "--navy"],
  ["primaryColor", "--navy-deep"],
  ["secondaryColor", "--navy-bright"],
  ["accentColor", "--gold"],
  ["surfaceColor", "--paper"],
  ["surfaceColor", "--soft"],
  ["mutedTextColor", "--muted"],
];

export function AppSettingsSync() {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function sync() {
      try {
        const response = await fetch("/api/app-settings", { cache: "no-store" });
        const data = (await response.json()) as { settings?: AppSettings };
        const settings = data.settings;
        if (!settings || cancelled) {
          return;
        }
        document.title = settings.siteName || document.title;
        for (const [key, variable] of variableMap) {
          const value = settings[key];
          if (typeof value === "string" && value.trim()) {
            document.documentElement.style.setProperty(variable, value);
          }
        }
        const interval = Math.max(5, settings.updateIntervalSeconds || 30);
        timer = setTimeout(sync, interval * 1000);
      } catch {
        timer = setTimeout(sync, 30000);
      }
    }

    void sync();
    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  return null;
}
