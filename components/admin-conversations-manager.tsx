"use client";

import { CheckCircle2, LoaderCircle, MessageSquareText, ShieldAlert, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type Conversation = {
  id: string;
  status: "OPEN" | "ARCHIVED" | "BLOCKED" | "CLOSED";
  updatedAt: string;
  business: { name: string } | null;
  enquiry: { requirement: string; status: string } | null;
  members: Array<{ user: { id: string; email: string | null; phone: string | null; customerProfile: { displayName: string | null } | null } }>;
  messages: Array<{ body: string | null; type: string; createdAt: string }>;
  _count: { messages: number };
};

type Message = {
  id: string;
  body: string | null;
  type: string;
  createdAt: string;
  sender: { id: string; email: string | null; phone: string | null; customerProfile: { displayName: string | null } | null };
};

export function AdminConversationsManager({ user }: { user: BncSessionUser }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(appPath("/api/admin/conversations"));
      const body = (await response.json()) as { data?: Conversation[]; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Conversations could not be loaded.");
      setConversations(body.data ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Conversations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function inspect(conversation: Conversation) {
    setSelected(conversation);
    setMessages([]);
    const response = await fetch(appPath(`/api/admin/conversations/${conversation.id}/messages`));
    const body = (await response.json()) as { data?: Message[]; message?: string | string[] };
    if (response.ok) setMessages(body.data ?? []);
    else setNotice(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Messages could not be loaded.");
  }

  async function moderate(status: "OPEN" | "BLOCKED" | "CLOSED") {
    if (!selected || reason.trim().length < 5) {
      setNotice("Enter a moderation reason of at least 5 characters.");
      return;
    }
    const response = await fetch(appPath(`/api/admin/conversations/${selected.id}`), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    const body = (await response.json()) as { message?: string | string[] };
    if (!response.ok) {
      setNotice(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Conversation could not be moderated.");
      return;
    }
    setSelected({ ...selected, status });
    setConversations((current) => current.map((item) => item.id === selected.id ? { ...item, status } : item));
    setReason("");
    setNotice(`Conversation marked ${status.toLowerCase()}; the action was added to the audit log.`);
  }

  return (
    <DashboardShell mode="admin" user={user}>
      <section className="manager-heading"><div><span className="eyebrow">Safety oversight</span><h1>Conversation monitoring</h1><p>Inspect in-app customer–business threads and block or close unsafe conversations with an audited reason.</p></div></section>
      {notice && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {notice}</p>}
      <section className="admin-conversation-layout">
        <div className="admin-conversation-list">{loading ? <div className="admin-empty"><LoaderCircle className="spin" size={26} /><strong>Loading conversations</strong></div> : conversations.map((conversation) => <button type="button" className={selected?.id === conversation.id ? "active" : ""} onClick={() => inspect(conversation)} key={conversation.id}><span><MessageSquareText size={17} /></span><div><small>{conversation.status} · {conversation._count.messages} messages</small><strong>{conversation.business?.name ?? "Customer conversation"}</strong><p>{conversation.messages[0]?.body ?? conversation.enquiry?.requirement ?? "No message content"}</p></div></button>)}</div>
        <div className="admin-conversation-inspector">{selected ? <><header><div><small>{selected.status}</small><h2>{selected.business?.name ?? "BNC conversation"}</h2><p><Users size={14} /> {selected.members.map((member) => member.user.customerProfile?.displayName ?? member.user.email ?? member.user.phone ?? "Member").join(" · ")}</p></div><ShieldAlert size={22} /></header><div className="admin-monitored-thread">{messages.map((message) => <article key={message.id}><strong>{message.sender.customerProfile?.displayName ?? message.sender.email ?? message.sender.phone ?? "Member"}</strong><p>{message.body ?? `Shared ${message.type.toLowerCase()}`}</p><small>{new Date(message.createdAt).toLocaleString("en-IN")}</small></article>)}</div><footer><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Required moderation reason" /><div><button type="button" onClick={() => moderate("OPEN")}>Reopen</button><button type="button" onClick={() => moderate("BLOCKED")}>Block</button><button type="button" onClick={() => moderate("CLOSED")}>Close</button></div></footer></> : <div className="admin-empty"><ShieldAlert size={28} /><strong>Select a conversation</strong><span>Authorised moderation access is recorded through the admin role.</span></div>}</div>
      </section>
    </DashboardShell>
  );
}
