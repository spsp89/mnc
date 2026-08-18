"use client";

import { ArrowDown, ArrowUp, LoaderCircle, MapPin, Plus, ShieldAlert, Tags, Trash2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type Row = {
  id: string;
  name: string;
  slug: string;
  type?: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  parent?: { name: string } | null;
  _count: Record<string, number>;
};

type ApiErrorBody = {
  message?: string | string[];
  error?: { message?: string | string[] };
};

function apiErrorMessage(body: ApiErrorBody | null, fallback: string) {
  const message = body?.error?.message ?? body?.message;
  return Array.isArray(message) ? message.join(" ") : message ?? fallback;
}

export function AdminTaxonomyManager({
  user,
  kind,
}: {
  user: BncSessionUser;
  kind: "categories" | "locations";
}) {
  const locations = kind === "locations";
  const endpoint = locations ? "/api/admin/managed-locations" : "/api/admin/categories";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(appPath(endpoint));
      const body = (await response.json()) as { data?: Row[]; message?: string };
      if (!response.ok || !body.data) {
        throw new Error(body.message ?? "Taxonomy could not be loaded.");
      }
      setRows(body.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Taxonomy could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name")),
      slug: String(form.get("slug")),
      parentId: String(form.get("parentId") || "") || null,
      sortOrder: Number(form.get("sortOrder") || 0),
      isActive: form.get("isActive") === "on",
      ...(locations ? { type: String(form.get("type")) } : {}),
    };
    const response = await fetch(appPath(editing ? `${endpoint}/${editing.id}` : endpoint), {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    if (!response.ok) {
      setError(apiErrorMessage(body, "Save failed."));
      return;
    }
    setNotice(`${locations ? "Location" : "Category"} saved.`);
    setEditing(null);
    event.currentTarget.reset();
    await load();
  }

  async function patch(row: Row, data: object) {
    setError("");
    setNotice("");
    const response = await fetch(appPath(`${endpoint}/${row.id}`), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
      setError(apiErrorMessage(body, "Update failed."));
      return;
    }
    await load();
  }

  async function remove(row: Row) {
    setError("");
    setNotice("");
    const response = await fetch(appPath(`${endpoint}/${row.id}`), { method: "DELETE" });
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    if (!response.ok) {
      setError(apiErrorMessage(body, "This record cannot be deleted while it is in use."));
      return;
    }
    setNotice(`${row.name} deleted.`);
    await load();
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const items = rows.map((row, position) => ({
      id: row.id,
      sortOrder: position === index ? target : position === target ? index : position,
    }));
    const response = await fetch(appPath(`${endpoint}/reorder`), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) {
      setError("Reorder failed.");
      return;
    }
    await load();
  }

  return (
    <DashboardShell mode="admin" user={user}>
      <section className="manager-heading">
        <div>
          <span className="eyebrow">Platform taxonomy</span>
          <h1>{locations ? "Location management" : "Category management"}</h1>
          <p>Create and maintain the hierarchy used by merchant listings.</p>
        </div>
      </section>
      {notice && <p className="settings-saved">{notice}</p>}
      {error && <p className="form-error" role="alert"><ShieldAlert size={16} /> {error}</p>}
      <form
        key={editing?.id ?? "create"}
        className="admin-operations-card admin-taxonomy-form"
        onSubmit={submit}
      >
        <h2>{editing ? `Edit ${editing.name}` : `Create ${locations ? "location" : "category"}`}</h2>
        <div className="form-two-column">
          <label>Name<input name="name" defaultValue={editing?.name} minLength={2} maxLength={120} required /></label>
          <label>Slug<input name="slug" defaultValue={editing?.slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
          {locations && (
            <label>Type<select name="type" defaultValue={editing?.type ?? "CITY"}>
              {["COUNTRY", "STATE", "DISTRICT", "CITY", "CONSTITUENCY", "LOCALITY"].map((type) => <option key={type}>{type}</option>)}
            </select></label>
          )}
          <label>Parent<select name="parentId" defaultValue={editing?.parentId ?? ""}>
            <option value="">Root</option>
            {rows.filter((row) => row.id !== editing?.id).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select></label>
          <label>Sort order<input name="sortOrder" type="number" min="0" defaultValue={editing?.sortOrder ?? rows.length} /></label>
          <label><input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} /> Active</label>
        </div>
        <button className="admin-primary-button" type="submit"><Plus size={15} /> {editing ? "Save changes" : "Create"}</button>
        {editing && <button type="button" onClick={() => setEditing(null)}>Cancel</button>}
      </form>
      <section className="admin-operations-card">
        {loading ? (
          <div className="admin-empty"><LoaderCircle className="spin" size={30} /><strong>Loading</strong></div>
        ) : (
          <div className="admin-record-list">
            {rows.map((row, index) => (
              <article key={row.id}>
                <span className="admin-record-icon">{locations ? <MapPin size={19} /> : <Tags size={19} />}</span>
                <div className="admin-record-copy">
                  <h2>{row.name}</h2>
                  <p>{row.parent?.name ? `${row.parent.name} · ` : ""}{row.type ?? "Category"} · {row.isActive ? "Active" : "Inactive"}</p>
                  <small>{Object.values(row._count).reduce((sum, count) => sum + count, 0)} linked records</small>
                </div>
                <div className="admin-verification-actions">
                  <button type="button" onClick={() => setEditing(row)}>Edit</button>
                  <button type="button" onClick={() => void patch(row, { isActive: !row.isActive })}>{row.isActive ? "Deactivate" : "Activate"}</button>
                  <button type="button" disabled={index === 0} onClick={() => void move(index, -1)}><ArrowUp size={14} /></button>
                  <button type="button" disabled={index === rows.length - 1} onClick={() => void move(index, 1)}><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => void remove(row)}><Trash2 size={14} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
