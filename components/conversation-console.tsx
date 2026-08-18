"use client";

import { Archive, CheckCircle2, LoaderCircle, MessageSquareText, Send } from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type Conversation = {
  id: string;
  status: string;
  updatedAt: string;
  business: { id: string; name: string; slug: string; logoUrl: string | null } | null;
  enquiry: { id: string; requirement: string; status: string } | null;
  messages: Array<{ id: string; senderId: string; body: string | null; type: string; createdAt: string }>;
};

type Message = {
  id: string;
  senderId: string;
  type: string;
  body: string | null;
  attachmentKey: string | null;
  readAt: string | null;
  createdAt: string;
};

function ConsoleBody({ user, initialConversationId }: { user: BncSessionUser; initialConversationId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(appPath("/api/conversations"));
      const body = (await response.json()) as { data?: Conversation[]; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Messages could not be loaded.");
      setConversations(body.data ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Messages could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const open = useCallback(async (conversation: Conversation) => {
    setSelected(conversation);
    setMessages([]);
    setNotice("");
    try {
      const [response] = await Promise.all([
        fetch(appPath(`/api/conversations/${conversation.id}/messages`)),
        fetch(appPath(`/api/conversations/${conversation.id}/read`), { method: "PATCH" }),
      ]);
      const body = (await response.json()) as { data?: Message[]; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Conversation could not be loaded.");
      setMessages(body.data ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Conversation could not be loaded.");
    }
  }, []);

  useEffect(() => {
    if (!initialConversationId || selected || !conversations.length) return;
    const initial = conversations.find((conversation) => conversation.id === initialConversationId);
    if (initial) void Promise.resolve().then(() => open(initial));
  }, [conversations, initialConversationId, open, selected]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const bodyText = String(form.get("body") ?? "").trim();
    if (!bodyText) return;
    setSending(true);
    try {
      const response = await fetch(appPath(`/api/conversations/${selected.id}/messages`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "TEXT", body: bodyText }),
      });
      const body = (await response.json()) as { data?: Message; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Message could not be sent.");
      if (body.data) setMessages((current) => [...current, body.data!]);
      event.currentTarget.reset();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  async function archive() {
    if (!selected) return;
    const response = await fetch(appPath(`/api/conversations/${selected.id}/archive`), { method: "PATCH" });
    if (response.ok) {
      setNotice("Conversation archived.");
      setSelected(null);
      setMessages([]);
      await load();
    }
  }

  return (
    <>
      <section className="manager-heading"><div><span className="eyebrow">BNC private messaging</span><h1>Conversations</h1><p>Customer and business communication stays inside BNC and can be reviewed by authorised moderators.</p></div></section>
      {notice && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {notice}</p>}
      <section className="manager-message-layout">
        <div className="manager-conversation-list">
          {loading ? <div className="admin-empty"><LoaderCircle className="spin" size={24} /><strong>Loading messages</strong></div> : conversations.map((conversation) => <button type="button" className={selected?.id === conversation.id ? "active" : ""} onClick={() => open(conversation)} key={conversation.id}><span>{conversation.business?.name.slice(0, 2).toUpperCase() ?? "BN"}</span><div><strong>{conversation.business?.name ?? "BNC conversation"}</strong><p>{conversation.messages[0]?.body ?? conversation.enquiry?.requirement ?? "No message yet"}</p><small>{conversation.status} · {new Date(conversation.updatedAt).toLocaleDateString("en-IN")}</small></div></button>)}{!loading && !conversations.length && <div className="admin-empty"><MessageSquareText size={28} /><strong>No conversations yet</strong><span>Open an enquiry and choose “Start BNC chat”.</span></div>}
        </div>
        <div className="manager-chat-panel">
          {selected ? <><div><span>{selected.business?.name.slice(0, 2).toUpperCase() ?? "BN"}</span><div><strong>{selected.business?.name ?? "BNC conversation"}</strong><small>{selected.enquiry?.requirement ?? selected.status}</small></div><button type="button" onClick={archive} aria-label="Archive conversation"><Archive size={16} /></button></div><div className="manager-chat-thread">{messages.map((message) => <p className={message.senderId === user.id ? "owner" : ""} key={message.id}>{message.body ?? `Shared ${message.type.toLowerCase()}`}<span>{new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}{message.readAt ? " · Read" : ""}</span></p>)}{!messages.length && <div className="admin-empty"><MessageSquareText size={24} /><strong>No messages yet</strong><span>Send the first message about this enquiry.</span></div>}</div><form onSubmit={send}><input name="body" maxLength={4000} required placeholder="Write a BNC message…" disabled={["BLOCKED", "CLOSED"].includes(selected.status)} /><button type="submit" disabled={sending || ["BLOCKED", "CLOSED"].includes(selected.status)} aria-label="Send message">{sending ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}</button></form></> : <div className="admin-empty"><MessageSquareText size={30} /><strong>Select a conversation</strong><span>Messages, delivery state and read state will appear here.</span></div>}
        </div>
      </section>
    </>
  );
}

export function ConversationConsole({ user, mode, initialConversationId }: { user: BncSessionUser; mode: "customer" | "business"; initialConversationId?: string }) {
  const body: ReactNode = <ConsoleBody user={user} initialConversationId={initialConversationId} />;
  if (mode === "business") return <DashboardShell mode="business" user={user}>{body}</DashboardShell>;
  return <AppShell headerVariant="immersive"><main className="customer-messages-page">{body}</main></AppShell>;
}
