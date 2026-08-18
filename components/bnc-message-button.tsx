"use client";

import { LoaderCircle, MessageCircle } from "lucide-react";
import { useState } from "react";
import { appPath, readJsonResponse } from "@/lib/client-routing";
import { cn } from "@/lib/utils";

type ConversationResponse = {
  data?: { id?: string };
  message?: string | string[];
};

export function BncMessageButton({
  businessId,
  businessName,
  initialMessage,
  label = "Message on BNC",
  className,
}: {
  businessId: string;
  businessName: string;
  initialMessage: string;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startConversation() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(appPath("/api/conversations"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, initialMessage }),
      });
      if (response.status === 401) {
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.href = appPath(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      const body = await readJsonResponse<ConversationResponse>(
        response,
        "The BNC conversation could not be started.",
      );
      if (!response.ok || !body.data?.id) {
        throw new Error(
          Array.isArray(body.message)
            ? body.message.join(" ")
            : body.message ?? "The BNC conversation could not be started.",
        );
      }
      window.location.href = appPath(
        `/account/messages?conversation=${encodeURIComponent(body.data.id)}`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The BNC conversation could not be started.");
      setBusy(false);
    }
  }

  return (
    <span className="bnc-message-action">
      <button
        type="button"
        className={cn("bnc-message-button", className)}
        onClick={startConversation}
        disabled={busy}
        aria-label={`${label} with ${businessName}`}
      >
        {busy ? <LoaderCircle className="spin" size={16} /> : <MessageCircle size={16} />}
        {busy ? "Opening…" : label}
      </button>
      {error && <small role="alert">{error}</small>}
    </span>
  );
}
