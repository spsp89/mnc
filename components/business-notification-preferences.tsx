"use client";

import { BellRing, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { appPath } from "@/lib/client-routing";

type Preference = {
  type: string;
  inApp: boolean;
};

export function BusinessNotificationPreferences() {
  const [enabled, setEnabled] = useState(true);
  const [state, setState] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(appPath("/api/notifications/preferences"), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to load notification preferences.");
        const body = await response.json() as { data?: Preference[] };
        const preference = body.data?.find((item) => item.type === "NEW_LEAD");
        setEnabled(preference?.inApp ?? true);
        setState("ready");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMessage(error instanceof Error ? error.message : "Unable to load preferences.");
          setState("error");
        }
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  const update = async (nextEnabled: boolean) => {
    const previous = enabled;
    setEnabled(nextEnabled);
    setState("saving");
    setMessage("");
    try {
      const response = await fetch(appPath("/api/notifications/preferences"), {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "NEW_LEAD", inApp: nextEnabled }),
      });
      if (!response.ok) throw new Error("The preference could not be saved.");
      setState("ready");
      setMessage(nextEnabled ? "New lead notifications are on." : "New lead notifications are off.");
    } catch (error) {
      setEnabled(previous);
      setState("error");
      setMessage(error instanceof Error ? error.message : "The preference could not be saved.");
    }
  };

  return (
    <section className="business-notification-preferences" aria-labelledby="lead-alert-heading">
      <div className="business-notification-icon"><BellRing size={22} /></div>
      <div>
        <span className="eyebrow">Automatic lead alerts</span>
        <h2 id="lead-alert-heading">New matching leads</h2>
        <p>
          Receive an in-app alert when a customer requirement matches your category and service radius.
          Turning this off stops only lead alerts; the matching lead remains available in your console.
        </p>
        {message && <small role={state === "error" ? "alert" : "status"}>{message}</small>}
      </div>
      <label className="notification-preference-toggle">
        <span>{enabled ? "On" : "Off"}</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => void update(event.target.checked)}
          disabled={state === "loading" || state === "saving"}
          aria-label="Enable new lead notifications"
        />
        {state === "loading" || state === "saving" ? <LoaderCircle className="spin" size={17} /> : <i />}
      </label>
    </section>
  );
}
