"use client";

import {
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type TeamOwner = {
  id: string;
  userId: string;
  role: "OWNER";
  active: true;
  email: string | null;
  phone: string | null;
  name: string;
};

type TeamMember = {
  id: string;
  role: TeamRole;
  permissions: string[];
  active: boolean;
  email: string | null;
  phone: string | null;
  name: string;
  createdAt: string;
};

type TeamRole = "ADMIN" | "MANAGER" | "CATALOG_EDITOR" | "LEAD_AGENT" | "VIEWER";

type TeamResponse = {
  data?: {
    owner: TeamOwner;
    members: TeamMember[];
  };
  message?: string | string[];
};

const roles: Array<{ value: TeamRole; label: string; summary: string }> = [
  { value: "ADMIN", label: "Administrator", summary: "All business workspace controls" },
  { value: "MANAGER", label: "Manager", summary: "Profile, catalogue, leads, orders and analytics" },
  { value: "CATALOG_EDITOR", label: "Catalogue editor", summary: "Products and services only" },
  { value: "LEAD_AGENT", label: "Lead agent", summary: "Leads, enquiries and orders" },
  { value: "VIEWER", label: "Viewer", summary: "Read-only workspace and analytics" },
];

function errorMessage(value: string | string[] | undefined, fallback: string) {
  return Array.isArray(value) ? value.join(" ") : value ?? fallback;
}

export function BusinessTeamManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [owner, setOwner] = useState<TeamOwner | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("MANAGER");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((business) => business.id === businessId);
  const canManage = workspace?.capabilities.includes("business:team:manage") ?? false;

  const load = useCallback(async () => {
    if (!businessId || !canManage) {
      setOwner(null);
      setMembers([]);
      setState("ready");
      return;
    }
    setState("loading");
    try {
      const response = await fetch(
        appPath(`/api/business/team?businessId=${encodeURIComponent(businessId)}`),
      );
      const body = (await response.json()) as TeamResponse;
      if (!response.ok || !body.data) {
        throw new Error(errorMessage(body.message, "Team access could not be loaded."));
      }
      setOwner(body.data.owner);
      setMembers(body.data.members);
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Team access could not be loaded.");
      setState("error");
    }
  }, [businessId, canManage]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    setBusyId("new");
    setMessage("");
    try {
      const response = await fetch(appPath("/api/business/team"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, email, role }),
      });
      const body = (await response.json()) as TeamResponse;
      if (!response.ok) {
        throw new Error(errorMessage(body.message, "The team member could not be added."));
      }
      setEmail("");
      setMessage(typeof body.message === "string" ? body.message : "Team member added.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The team member could not be added.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateMember(
    member: TeamMember,
    change: { role?: TeamRole; active?: boolean },
  ) {
    setBusyId(member.id);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/team/${member.id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, ...change }),
      });
      const body = (await response.json()) as TeamResponse;
      if (!response.ok) {
        throw new Error(errorMessage(body.message, "Team access could not be updated."));
      }
      setMessage("Team access updated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Team access could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div>
          <span className="eyebrow">Shared workspace</span>
          <h1>Team access</h1>
          <p>Give each colleague only the controls they need. Every membership change is recorded in the audit log.</p>
        </div>
        {user.businesses.length > 1 && (
          <select value={businessId} onChange={(event) => setBusinessId(event.target.value)} aria-label="Business workspace">
            {user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}
          </select>
        )}
      </section>

      {message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}
      {!canManage && (
        <section className="manager-api-state">
          <ShieldCheck />
          <h2>Administrator access required</h2>
          <p>Only the owner or a workspace administrator can manage team access.</p>
        </section>
      )}
      {canManage && state === "loading" && (
        <section className="manager-api-state"><LoaderCircle className="spin" /><p>Loading workspace access…</p></section>
      )}
      {canManage && state === "error" && (
        <section className="manager-api-state"><Users /><h2>Team access is unavailable</h2><p>Try reloading this page.</p></section>
      )}
      {canManage && state === "ready" && (
        <div className="business-team-layout">
          <section className="business-team-directory">
            <header>
              <div><span className="eyebrow">Workspace directory</span><h2>{workspace?.name}</h2></div>
              <strong>{members.filter((member) => member.active).length + 1} active</strong>
            </header>
            {owner && (
              <article className="business-team-member owner">
                <span>{owner.name.slice(0, 2).toUpperCase()}</span>
                <div><strong>{owner.name}</strong><small>{owner.email ?? owner.phone ?? "Business owner"}</small></div>
                <b>Owner</b>
              </article>
            )}
            {members.map((member) => (
              <article className={`business-team-member${member.active ? "" : " inactive"}`} key={member.id}>
                <span>{member.name.slice(0, 2).toUpperCase()}</span>
                <div><strong>{member.name}</strong><small>{member.email ?? member.phone ?? "BNC member"}</small></div>
                <label>
                  <span className="sr-only">Role for {member.name}</span>
                  <select
                    value={member.role}
                    disabled={busyId === member.id || !member.active}
                    onChange={(event) => void updateMember(member, { role: event.target.value as TeamRole })}
                  >
                    {roles.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={busyId === member.id}
                  onClick={() => void updateMember(member, { active: !member.active })}
                >
                  {busyId === member.id
                    ? <LoaderCircle className="spin" size={15} />
                    : member.active
                      ? <UserMinus size={15} />
                      : <UserPlus size={15} />}
                  {member.active ? "Remove" : "Restore"}
                </button>
              </article>
            ))}
            {!members.length && <div className="business-team-empty"><Users size={24} /><p>No colleagues have been added yet.</p></div>}
          </section>

          <aside className="business-team-invite">
            <span><UserPlus size={20} /></span>
            <h2>Add a colleague</h2>
            <p>They must first create and verify their own BNC account. Passwords are never shared between team members.</p>
            <form onSubmit={addMember}>
              <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="colleague@business.com" required /></label>
              <label>Workspace role<select value={role} onChange={(event) => setRole(event.target.value as TeamRole)}>{roles.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
              <small>{roles.find((option) => option.value === role)?.summary}</small>
              <button type="submit" disabled={busyId === "new"}>{busyId === "new" ? <LoaderCircle className="spin" size={16} /> : <UserPlus size={16} />} Add to workspace</button>
            </form>
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}
