"use client";

import {
  CheckCircle2,
  Download,
  Eye,
  FileLock2,
  Filter,
  LoaderCircle,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { AdminSection } from "@/components/admin-section-view";

type ApiRecord = Record<string, unknown>;

type RecordAction = {
  label: string;
  action: string;
  value?: string;
  valueLabel?: string;
  dangerous?: boolean;
};

type SectionConfig = {
  noun: string;
  actions?: RecordAction[];
  create?: "category" | "subcategory" | "notification" | "service" | "translation";
  immutable?: boolean;
};

type ServiceBusinessOption = {
  id: string;
  name: string;
  status: string;
  categories: Array<{ id: string; name: string; parentId?: string | null; linked: boolean }>;
};

const statusAction = (label: string, value: string, dangerous = false): RecordAction => ({
  label,
  action: "SET_STATUS",
  value,
  dangerous,
});

const configs: Partial<Record<AdminSection, SectionConfig>> = {
  businesses: {
    noun: "business",
    actions: [
      statusAction("Activate business", "ACTIVE"),
      statusAction("Send to verification", "PENDING_VERIFICATION"),
      statusAction("Suspend business", "SUSPENDED", true),
      statusAction("Reject business", "REJECTED", true),
      statusAction("Close business", "CLOSED", true),
      { label: "Mark verified", action: "VERIFY" },
      { label: "Remove verification", action: "UNVERIFY", dangerous: true },
      { label: "Grant premium", action: "SET_PREMIUM" },
      { label: "Remove premium", action: "UNSET_PREMIUM", dangerous: true },
    ],
  },
  users: {
    noun: "user",
    actions: [
      statusAction("Activate user", "ACTIVE"),
      statusAction("Return to pending", "PENDING"),
      statusAction("Suspend user", "SUSPENDED", true),
    ],
  },
  leads: {
    noun: "lead",
    actions: [
      statusAction("Reopen as new", "NEW"),
      statusAction("Start matching", "MATCHING"),
      statusAction("Mark contacted", "CONTACTED"),
      statusAction("Mark converted", "CONVERTED"),
      statusAction("Reject lead", "REJECTED", true),
      statusAction("Mark spam", "SPAM", true),
      statusAction("Expire lead", "EXPIRED", true),
    ],
  },
  enquiries: {
    noun: "enquiry",
    actions: [
      statusAction("Restore submitted", "SUBMITTED"),
      statusAction("Start matching", "MATCHING"),
      statusAction("Mark responded", "RESPONDED"),
      statusAction("Close enquiry", "CLOSED"),
      statusAction("Mark spam", "SPAM", true),
      statusAction("Expire enquiry", "EXPIRED", true),
    ],
  },
  categories: {
    noun: "category",
    create: "category",
    actions: [
      { label: "Activate category", action: "ACTIVATE" },
      { label: "Deactivate category", action: "DEACTIVATE", dangerous: true },
    ],
  },
  subcategories: {
    noun: "subcategory",
    create: "subcategory",
    actions: [
      { label: "Activate subcategory", action: "ACTIVATE" },
      { label: "Deactivate subcategory", action: "DEACTIVATE", dangerous: true },
    ],
  },
  services: {
    noun: "service",
    create: "service",
    actions: [
      { label: "Activate service", action: "ACTIVATE" },
      { label: "Deactivate service", action: "DEACTIVATE", dangerous: true },
    ],
  },
  plans: {
    noun: "plan",
    actions: [
      { label: "Activate plan", action: "ACTIVATE" },
      { label: "Deactivate plan", action: "DEACTIVATE", dangerous: true },
    ],
  },
  orders: {
    noun: "order",
    actions: [
      statusAction("Confirm order", "CONFIRMED"),
      statusAction("Mark preparing", "PREPARING"),
      statusAction("Ready for pickup", "READY_FOR_PICKUP"),
      statusAction("Mark dispatched", "DISPATCHED"),
      statusAction("Mark delivered", "DELIVERED"),
      statusAction("Cancel order", "CANCELLED", true),
      statusAction("Return requested", "RETURN_REQUESTED"),
      statusAction("Mark returned", "RETURNED"),
      statusAction("Mark refunded", "REFUNDED", true),
    ],
  },
  offers: {
    noun: "offer",
    actions: [
      { label: "Approve offer", action: "APPROVE" },
      { label: "Reject offer", action: "REJECT", dangerous: true },
      { label: "Activate offer", action: "ACTIVATE" },
      { label: "Deactivate offer", action: "DEACTIVATE", dangerous: true },
      { label: "Feature offer", action: "FEATURE" },
      { label: "Remove featured placement", action: "UNFEATURE" },
    ],
  },
  advertisements: {
    noun: "advertisement",
    actions: [
      statusAction("Schedule advertisement", "SCHEDULED"),
      statusAction("Activate advertisement", "ACTIVE"),
      statusAction("Pause advertisement", "PAUSED"),
      statusAction("Mark completed", "COMPLETED"),
      statusAction("Reject advertisement", "REJECTED", true),
    ],
  },
  locations: {
    noun: "location",
    actions: [
      { label: "Activate location", action: "ACTIVATE" },
      { label: "Deactivate location", action: "DEACTIVATE", dangerous: true },
      { label: "Make primary location", action: "MAKE_PRIMARY" },
    ],
  },
  reports: {
    noun: "report",
    actions: [
      { label: "Resolve report", action: "RESOLVE" },
      { label: "Dismiss report", action: "DISMISS" },
      { label: "Reopen report", action: "REOPEN" },
    ],
  },
  notifications: { noun: "notification", create: "notification" },
  translations: {
    noun: "translation",
    create: "translation",
    actions: [
      { label: "Mark reviewed", action: "MARK_REVIEWED" },
      { label: "Save manual correction", action: "CORRECT", valueLabel: "Corrected translation" },
    ],
  },
  content: {
    noun: "content asset",
    actions: [
      { label: "Approve scanned asset", action: "APPROVE" },
      { label: "Quarantine asset", action: "QUARANTINE", dangerous: true },
    ],
  },
  settings: {
    noun: "role assignment",
    actions: [
      { label: "Restore role assignment", action: "RESTORE" },
      { label: "Revoke role assignment", action: "REVOKE", dangerous: true },
    ],
  },
  "audit-log": { noun: "audit entry", immutable: true },
};

const objectRecord = (value: unknown): ApiRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as ApiRecord
    : {};

const initialRecords = (payload: ApiRecord | ApiRecord[] | null) =>
  Array.isArray(payload) ? payload.map(objectRecord) : payload ? [objectRecord(payload)] : [];

const readable = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());

const textValue = (value: unknown) => typeof value === "string" ? value : "";

function recordTitle(record: ApiRecord, index = 0) {
  const profile = objectRecord(record.customerProfile);
  const business = objectRecord(record.business);
  return textValue(record.name) || textValue(record.title) || textValue(record.subject) ||
    textValue(record.requirement) || textValue(record.orderNumber) || textValue(record.action) ||
    textValue(record.email) || textValue(profile.displayName) || textValue(business.name) ||
    (textValue(record.entityType) && textValue(record.field) ? `${textValue(record.entityType)} · ${textValue(record.field)}` : "") ||
    `Record ${index + 1}`;
}

function recordSubtitle(record: ApiRecord) {
  const business = objectRecord(record.business);
  const user = objectRecord(record.user);
  const category = objectRecord(record.category);
  return [
    textValue(business.name),
    textValue(user.email),
    textValue(record.email),
    textValue(category.name) || textValue(record.category),
    textValue(record.slug),
    textValue(record.city),
    textValue(record.district),
    textValue(record.sourceLanguage) && textValue(record.targetLanguage) ? `${textValue(record.sourceLanguage)} → ${textValue(record.targetLanguage)}` : "",
  ].filter((part, index, parts) => part && parts.indexOf(part) === index).join(" · ");
}

function recordStatus(record: ApiRecord) {
  if (typeof record.status === "string") return record.status;
  if (typeof record.isActive === "boolean") return record.isActive ? "ACTIVE" : "INACTIVE";
  if (typeof record.active === "boolean") return record.active ? "ACTIVE" : "REVOKED";
  if (typeof record.scanStatus === "string") return record.scanStatus.toUpperCase();
  if (record.sentAt) return "SENT";
  return "RECORDED";
}

function recordDetail(record: ApiRecord) {
  const business = objectRecord(record.business);
  return textValue(record.description) || textValue(record.translatedText) || textValue(record.body) || textValue(record.reason) ||
    textValue(record.details) || textValue(record.role) || textValue(business.name) ||
    textValue(record.createdAt) || textValue(record.updatedAt) || "Live BNC administrative record";
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString("en-IN");
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function responseMessage(body: ApiRecord, fallback: string) {
  const message = body.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" ");
  const nested = objectRecord(body.error).message;
  if (typeof nested === "string") return nested;
  if (Array.isArray(nested)) return nested.join(" ");
  return fallback;
}

function normalizedRecord(previous: ApiRecord, updated: ApiRecord) {
  const next = { ...previous, ...updated };
  if (typeof updated.isActive === "boolean") next.status = updated.isActive ? "ACTIVE" : "INACTIVE";
  if (typeof updated.active === "boolean") next.status = updated.active ? "ACTIVE" : "REVOKED";
  if (typeof updated.scanStatus === "string") next.status = updated.scanStatus.toUpperCase();
  if (updated.sentAt && !updated.status) next.status = "SENT";
  return next;
}

export function AdminRecordsManager({
  section,
  payload,
  parentCategories = [],
}: {
  section: AdminSection;
  payload: ApiRecord | ApiRecord[] | null;
  parentCategories?: ApiRecord[];
}) {
  const config = configs[section] ?? { noun: "record", immutable: true };
  const [records, setRecords] = useState(() => initialRecords(payload));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<ApiRecord | null>(null);
  const [managed, setManaged] = useState<ApiRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");

  const statuses = useMemo(
    () => [...new Set(records.map(recordStatus))].sort(),
    [records],
  );
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (status !== "ALL" && recordStatus(record) !== status) return false;
      return !needle || JSON.stringify(record).toLowerCase().includes(needle);
    });
  }, [query, records, status]);

  const exportCsv = () => {
    const fields = [...new Set(visible.flatMap((record) => Object.keys(record)))];
    const escape = (value: unknown) => `"${displayValue(value).replaceAll('"', '""')}"`;
    const csv = [fields.map(escape).join(","), ...visible.map((record) => fields.map((field) => escape(record[field])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bnc-admin-${section}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${visible.length} ${visible.length === 1 ? config.noun : `${config.noun}s`}.`);
  };

  const updateRecord = (id: string, updated: ApiRecord, action: RecordAction) => {
    setRecords((current) => current.map((record) => {
      const recordBusinessId = textValue(record.businessId) || textValue(objectRecord(record.business).id);
      if (action.action === "MAKE_PRIMARY" && updated.businessId && recordBusinessId === updated.businessId) {
        return record.id === id
          ? normalizedRecord(record, updated)
          : { ...record, isPrimary: false };
      }
      return record.id === id ? normalizedRecord(record, updated) : record;
    }));
  };

  const addRecord = (created: ApiRecord) => setRecords((current) => [normalizedRecord({}, created), ...current]);

  return (
    <section className="admin-records-card" aria-label={`${readable(section)} management`}>
      <div className="admin-records-toolbar">
        <label className="admin-records-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search {section}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${section.replaceAll("-", " ")}`} />
        </label>
        <label className="admin-records-filter">
          <Filter size={16} aria-hidden="true" />
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">All statuses</option>
            {statuses.map((item) => <option key={item} value={item}>{readable(item)}</option>)}
          </select>
        </label>
        <button type="button" onClick={exportCsv} disabled={!visible.length}><Download size={16} /> Export CSV</button>
        {config.create ? <button className="primary" type="button" onClick={() => setCreating(true)}><Plus size={16} /> New {config.noun}</button> : null}
      </div>

      {notice ? <div className="admin-records-notice" role="status"><CheckCircle2 size={16} />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={14} /></button></div> : null}
      {config.immutable ? <div className="admin-immutable-note"><FileLock2 size={17} /><span><strong>Protected records</strong> This section is intentionally read-only; inspect and export are available, but source records cannot be changed here.</span></div> : null}

      {visible.length ? (
        <div className="admin-records-table-wrap">
          <div className="admin-records-table" role="table">
            <div className="admin-records-header" role="row">
              <span role="columnheader">Record</span><span role="columnheader">Status</span><span role="columnheader">Details</span><span role="columnheader">Controls</span>
            </div>
            {visible.map((record, index) => (
              <article key={textValue(record.id) || `${index}`} role="row">
                <div role="cell"><span>{recordTitle(record, index).slice(0, 2).toUpperCase()}</span><div><strong>{recordTitle(record, index)}</strong><small>{recordSubtitle(record) || `BNC ${config.noun}`}</small></div></div>
                <div role="cell"><b className={`admin-record-status ${recordStatus(record).toLowerCase()}`}>{readable(recordStatus(record))}</b></div>
                <p role="cell">{recordDetail(record)}</p>
                <div className="admin-record-controls" role="cell">
                  <button type="button" onClick={() => setSelected(record)}><Eye size={15} /> Inspect</button>
                  {config.actions?.length ? <button className="manage" type="button" onClick={() => setManaged(record)}><Settings2 size={15} /> Manage</button> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="admin-records-empty"><Search size={26} /><strong>No matching records</strong><span>Adjust the search text or status filter.</span></div>
      )}
      <footer><span>Showing {visible.length} of {records.length} records</span><small>Live authorised data · client-side filters · CSV export</small></footer>

      {selected ? <RecordDetail record={selected} noun={config.noun} onClose={() => setSelected(null)} /> : null}
      {managed && config.actions ? (
        <ActionDialog
          section={section}
          noun={config.noun}
          record={managed}
          actions={config.actions}
          onClose={() => setManaged(null)}
          onSaved={(updated, action) => {
            updateRecord(textValue(managed.id), updated, action);
            setManaged(null);
            setNotice(`${recordTitle(managed)} updated. The reason was written to the audit log.`);
          }}
        />
      ) : null}
      {creating && config.create ? (
        <CreateDialog
          section={section}
          kind={config.create}
          records={records}
          parentCategories={parentCategories}
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            addRecord(created);
            setCreating(false);
            setNotice(`New ${config.noun} created with an audit entry.`);
          }}
        />
      ) : null}
    </section>
  );
}

function RecordDetail({ record, noun, onClose }: { record: ApiRecord; noun: string; onClose: () => void }) {
  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <section className="admin-record-dialog admin-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="record-detail-title">
        <header><div><span className="eyebrow">{readable(noun)} details</span><h2 id="record-detail-title">{recordTitle(record)}</h2></div><button type="button" onClick={onClose} aria-label="Close details"><X size={20} /></button></header>
        {textValue(record.publicUrl) ? <a className="admin-content-preview" href={textValue(record.publicUrl)} target="_blank" rel="noreferrer"><Image unoptimized src={textValue(record.publicUrl)} alt={textValue(record.altText) || "Content preview"} width={720} height={400} /><span>Open original asset</span></a> : null}
        <dl className="admin-record-fields">
          {Object.entries(record).map(([key, value]) => <div key={key}><dt>{readable(key)}</dt><dd>{displayValue(value)}</dd></div>)}
        </dl>
        <footer><button type="button" onClick={onClose}>Close</button></footer>
      </section>
    </div>
  );
}

function ActionDialog({
  section,
  noun,
  record,
  actions,
  onClose,
  onSaved,
}: {
  section: AdminSection;
  noun: string;
  record: ApiRecord;
  actions: RecordAction[];
  onClose: () => void;
  onSaved: (record: ApiRecord, action: RecordAction) => void;
}) {
  const [actionIndex, setActionIndex] = useState(0);
  const [value, setValue] = useState(actions[0]?.value ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const action = actions[actionIndex];
  const auditReasonLength = reason.trim().length;
  const auditReasonValid = auditReasonLength >= 8;

  const chooseAction = (index: number) => {
    setActionIndex(index);
    setValue(actions[index]?.value ?? "");
    setError("");
  };

  const submit = async () => {
    if (!action || !auditReasonValid || (action.valueLabel && !value.trim())) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/operations/${section}/${encodeURIComponent(textValue(record.id))}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: action.action, value: action.valueLabel ? value.trim() : action.value, reason: reason.trim() }),
      });
      const body = objectRecord(await response.json());
      if (!response.ok) throw new Error(responseMessage(body, `Unable to update this ${noun}.`));
      onSaved(objectRecord(body.data), action);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable to update this ${noun}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <section className="admin-record-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-action-title">
        <header><div><span className="eyebrow">Audited admin action</span><h2 id="admin-action-title">Manage {recordTitle(record)}</h2></div><button type="button" onClick={onClose} aria-label="Close action dialog"><X size={20} /></button></header>
        <div className="admin-dialog-body">
          <label><span>Action</span><select value={actionIndex} onChange={(event) => chooseAction(Number(event.target.value))}>{actions.map((item, index) => <option key={`${item.action}-${item.value ?? index}`} value={index}>{item.label}</option>)}</select></label>
          {action?.valueLabel ? <label><span>{action.valueLabel}</span><textarea value={value} onChange={(event) => setValue(event.target.value)} rows={4} placeholder="Enter the approved replacement text" /></label> : null}
          <label>
            <span>Reason for audit log</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              minLength={8}
              maxLength={500}
              required
              aria-describedby="admin-action-reason-help"
              placeholder="Explain why this action is necessary"
            />
            <small
              id="admin-action-reason-help"
              className={`admin-field-hint${reason && !auditReasonValid ? " invalid" : auditReasonValid ? " valid" : ""}`}
              aria-live="polite"
            >
              {auditReasonValid
                ? `Audit reason accepted (${auditReasonLength} characters).`
                : `${Math.max(8 - auditReasonLength, 0)} more ${8 - auditReasonLength === 1 ? "character" : "characters"} required.`}
            </small>
          </label>
          {action?.dangerous ? <p className="admin-action-warning">This action can remove or limit marketplace access. Confirm the record and reason before applying it.</p> : null}
          {error ? <p className="admin-dialog-error" role="alert">{error}</p> : null}
        </div>
        <footer><button type="button" onClick={onClose}>Cancel</button><button className="primary" type="button" onClick={submit} disabled={saving || !action || !auditReasonValid || Boolean(action.valueLabel && !value.trim())}>{saving ? <LoaderCircle className="spin" size={16} /> : null}Apply action</button></footer>
      </section>
    </div>
  );
}

function CreateDialog({
  section,
  kind,
  records,
  parentCategories,
  onClose,
  onCreated,
}: {
  section: AdminSection;
  kind: "category" | "subcategory" | "notification" | "service" | "translation";
  records: ApiRecord[];
  parentCategories: ApiRecord[];
  onClose: () => void;
  onCreated: (record: ApiRecord) => void;
}) {
  const [data, setData] = useState<Record<string, string>>(
    kind === "translation" ? { sourceLanguage: "en" } : {},
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [serviceBusinesses, setServiceBusinesses] = useState<ServiceBusinessOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(kind === "service");
  const [optionsError, setOptionsError] = useState("");
  useEffect(() => {
    if (kind !== "service") return;
    const controller = new AbortController();
    const load = async () => {
      setOptionsLoading(true);
      setOptionsError("");
      try {
        const response = await fetch("/api/admin/service-options", { signal: controller.signal });
        const body = objectRecord(await response.json());
        if (!response.ok) throw new Error(responseMessage(body, "Unable to load businesses and categories."));
        const options = Array.isArray(body.data) ? body.data.map(objectRecord) : [];
        setServiceBusinesses(options.map((option) => ({
          id: textValue(option.id),
          name: textValue(option.name),
          status: textValue(option.status),
          categories: Array.isArray(option.categories)
            ? option.categories.map(objectRecord).map((category) => ({
              id: textValue(category.id),
              name: textValue(category.name),
              parentId: textValue(category.parentId) || null,
              linked: category.linked === true,
            }))
            : [],
        })).filter((option) => option.id && option.name));
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setOptionsError(caught instanceof Error ? caught.message : "Unable to load businesses and categories.");
      } finally {
        if (!controller.signal.aborted) setOptionsLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [kind]);
  const parents = useMemo(() => {
    const options = new Map<string, string>();
    const source = kind === "subcategory" && parentCategories.length ? parentCategories : records;
    source.forEach((record) => {
      const ownId = textValue(record.id);
      const ownName = textValue(record.name);
      if (kind === "subcategory" && ownId && ownName && !textValue(record.parentId)) {
        options.set(ownId, ownName);
        return;
      }
      const parent = objectRecord(record.parent);
      const id = textValue(parent.id) || textValue(record.parentId);
      const name = textValue(parent.name) || textValue(record.category);
      if (id && name) options.set(id, name);
    });
    return [...options.entries()];
  }, [kind, parentCategories, records]);
  const set = (key: string, value: string) => setData((current) => ({ ...current, [key]: value }));
  const selectedBusiness = serviceBusinesses.find((business) => business.id === data.businessId);
  const rawServicePrice = data.startingPrice?.trim() ?? "";
  const parsedServicePrice = Number(rawServicePrice);
  const servicePriceValid = data.pricingType === "QUOTE" || Boolean(
    rawServicePrice && Number.isFinite(parsedServicePrice) && parsedServicePrice >= 0 && parsedServicePrice <= 999999999.99,
  );
  const rawServiceDuration = data.durationMinutes?.trim() ?? "";
  const parsedServiceDuration = Number(rawServiceDuration);
  const serviceDurationValid = !rawServiceDuration || (
    Number.isInteger(parsedServiceDuration) && parsedServiceDuration >= 1 && parsedServiceDuration <= 10080
  );
  const required = kind === "notification"
    ? Boolean(data.recipientEmail?.trim() && data.title?.trim() && data.body?.trim().length >= 8)
    : kind === "translation"
      ? Boolean(data.entityType && data.entityId?.trim() && data.field?.trim() && data.sourceLanguage && data.targetLanguage && data.sourceLanguage !== data.targetLanguage && data.originalText?.trim() && data.translatedText?.trim())
    : kind === "service"
      ? Boolean(data.businessId && data.categoryId && data.name?.trim() && data.slug?.trim() && data.description?.trim().length >= 8 && servicePriceValid && serviceDurationValid)
      : Boolean(data.name?.trim() && data.slug?.trim() && (kind !== "subcategory" || data.parentId));
  const auditReasonLength = reason.trim().length;
  const auditReasonValid = auditReasonLength >= 8;

  const submit = async () => {
    if (!required || !auditReasonValid) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/operations/${section}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data, reason: reason.trim() }),
      });
      const body = objectRecord(await response.json());
      if (!response.ok) throw new Error(responseMessage(body, `Unable to create this ${kind}.`));
      onCreated(objectRecord(body.data));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable to create this ${kind}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <section className="admin-record-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-create-title">
        <header><div><span className="eyebrow">Create operational record</span><h2 id="admin-create-title">New {kind}</h2></div><button type="button" onClick={onClose} aria-label="Close creation dialog"><X size={20} /></button></header>
        <div className="admin-dialog-body admin-create-fields">
          {kind === "notification" ? (
            <>
              <label><span>Recipient email</span><input type="email" value={data.recipientEmail ?? ""} onChange={(event) => set("recipientEmail", event.target.value)} placeholder="user@example.com" /></label>
              <label><span>Notification title</span><input value={data.title ?? ""} onChange={(event) => set("title", event.target.value)} placeholder="Important account update" /></label>
              <label><span>Message</span><textarea rows={4} value={data.body ?? ""} onChange={(event) => set("body", event.target.value)} placeholder="Write the in-app notification" /></label>
            </>
          ) : kind === "translation" ? (
            <>
              <label><span>Content type</span><select value={data.entityType ?? ""} onChange={(event) => set("entityType", event.target.value)}><option value="">Select content type</option><option value="WEBSITE">Website copy</option><option value="BUSINESS">Business</option><option value="PRODUCT">Product</option><option value="SERVICE">Service</option><option value="CATEGORY">Category</option><option value="OFFER">Offer</option></select></label>
              <label><span>Content record ID or page key</span><input value={data.entityId ?? ""} onChange={(event) => set("entityId", event.target.value)} maxLength={160} placeholder="business-id or homepage.hero" /></label>
              <label><span>Field</span><input value={data.field ?? ""} onChange={(event) => set("field", event.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, "_"))} maxLength={80} placeholder="title or description" /></label>
              <label><span>Source language</span><select value={data.sourceLanguage ?? "en"} onChange={(event) => set("sourceLanguage", event.target.value)}><option value="en">English (en)</option><option value="ml">Malayalam (ml)</option><option value="hi">Hindi (hi)</option><option value="ta">Tamil (ta)</option><option value="ar">Arabic (ar)</option></select></label>
              <label><span>Target language</span><select value={data.targetLanguage ?? ""} onChange={(event) => set("targetLanguage", event.target.value)}><option value="">Select target language</option><option value="ml">Malayalam (ml)</option><option value="hi">Hindi (hi)</option><option value="ta">Tamil (ta)</option><option value="ar">Arabic (ar)</option><option value="en">English (en)</option></select></label>
              <label><span>Source text</span><textarea rows={4} value={data.originalText ?? ""} onChange={(event) => set("originalText", event.target.value)} maxLength={2000} placeholder="Original approved content" /></label>
              <label><span>Translated text</span><textarea rows={4} value={data.translatedText ?? ""} onChange={(event) => set("translatedText", event.target.value)} maxLength={2000} placeholder="Approved translated content" /></label>
              <p className="admin-create-note">Manual translations are stored with administrator attribution and an immutable audit reason. Existing records can be reviewed or corrected from Manage.</p>
            </>
          ) : kind === "service" ? (
            <>
              {optionsLoading ? <p className="admin-create-note"><LoaderCircle className="spin" size={16} /> Loading authorised businesses and categories…</p> : null}
              {optionsError ? <p className="admin-dialog-error" role="alert">{optionsError}</p> : null}
              {!optionsLoading && !optionsError && !serviceBusinesses.length ? <p className="admin-create-note">No businesses are available. Create a business and link at least one active category before adding a service.</p> : null}
              <label>
                <span>Business</span>
                <select
                  value={data.businessId ?? ""}
                  disabled={optionsLoading}
                  onChange={(event) => setData((current) => ({ ...current, businessId: event.target.value, categoryId: "" }))}
                >
                  <option value="">Select a business</option>
                  {serviceBusinesses.map((business) => <option key={business.id} value={business.id}>{business.name} · {readable(business.status)}</option>)}
                </select>
              </label>
              <label>
                <span>Category</span>
                <select value={data.categoryId ?? ""} disabled={!selectedBusiness} onChange={(event) => set("categoryId", event.target.value)}>
                  <option value="">{selectedBusiness ? "Select a linked category" : "Select a business first"}</option>
                  {selectedBusiness?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.linked ? "" : " · link to business"}</option>)}
                </select>
              </label>
              {selectedBusiness && !selectedBusiness.categories.length ? <p className="admin-dialog-error" role="alert">This business has no active linked categories. Link a category before creating a service.</p> : null}
              <label><span>Service name</span><input value={data.name ?? ""} onChange={(event) => set("name", event.target.value)} placeholder="Air conditioning repair" maxLength={160} /></label>
              <label><span>Slug</span><input value={data.slug ?? ""} onChange={(event) => set("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""))} placeholder="air-conditioning-repair" maxLength={180} /></label>
              <label><span>Description</span><textarea rows={4} value={data.description ?? ""} onChange={(event) => set("description", event.target.value)} placeholder="Describe the service, scope, and customer expectations" maxLength={5000} /></label>
              <label>
                <span>Pricing type</span>
                <select value={data.pricingType ?? "STARTING_AT"} onChange={(event) => set("pricingType", event.target.value)}>
                  <option value="FIXED">Fixed price</option><option value="STARTING_AT">Starting at</option><option value="HOURLY">Hourly</option><option value="DAILY">Daily</option><option value="PER_UNIT">Per unit</option><option value="QUOTE">Quote required</option>
                </select>
              </label>
              <label><span>Starting price (₹)</span><input type="number" min="0" step="0.01" disabled={data.pricingType === "QUOTE"} value={data.startingPrice ?? ""} onChange={(event) => set("startingPrice", event.target.value)} placeholder={data.pricingType === "QUOTE" ? "Not required for quotes" : "500.00"} />{data.pricingType !== "QUOTE" && rawServicePrice && !servicePriceValid ? <small className="admin-field-hint invalid">Enter a non-negative price up to ₹999,999,999.99.</small> : null}</label>
              <label><span>Duration (minutes, optional)</span><input type="number" min="1" max="10080" step="1" value={data.durationMinutes ?? ""} onChange={(event) => set("durationMinutes", event.target.value)} placeholder="60" />{rawServiceDuration && !serviceDurationValid ? <small className="admin-field-hint invalid">Enter a whole number from 1 to 10,080 minutes.</small> : null}</label>
              <label className="admin-checkbox-field"><input type="checkbox" checked={data.homeService === "true"} onChange={(event) => set("homeService", String(event.target.checked))} /><span>Available at customer location</span></label>
              <label className="admin-checkbox-field"><input type="checkbox" checked={data.isActive !== "false"} onChange={(event) => set("isActive", String(event.target.checked))} /><span>Active immediately</span></label>
            </>
          ) : (
            <>
              <label><span>Name</span><input value={data.name ?? ""} onChange={(event) => set("name", event.target.value)} placeholder={kind === "category" ? "Home services" : "Air conditioning"} /></label>
              <label><span>Slug</span><input value={data.slug ?? ""} onChange={(event) => set("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))} placeholder="lowercase-url-slug" /></label>
              {kind === "subcategory" ? <label><span>Parent category</span><select value={data.parentId ?? ""} onChange={(event) => set("parentId", event.target.value)}><option value="">Select a category</option>{parents.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label> : null}
              <label><span>Description</span><textarea rows={3} value={data.description ?? ""} onChange={(event) => set("description", event.target.value)} placeholder="Describe what belongs in this category" /></label>
            </>
          )}
          <label>
            <span>Reason for audit log</span>
            <textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={8}
              maxLength={500}
              required
              aria-describedby="admin-create-reason-help"
              placeholder="Why this record is being created"
            />
            <small
              id="admin-create-reason-help"
              className={`admin-field-hint${reason && !auditReasonValid ? " invalid" : auditReasonValid ? " valid" : ""}`}
              aria-live="polite"
            >
              {auditReasonValid
                ? `Audit reason accepted (${auditReasonLength} characters).`
                : `${Math.max(8 - auditReasonLength, 0)} more ${8 - auditReasonLength === 1 ? "character" : "characters"} required.`}
            </small>
          </label>
          {kind === "notification" ? <p className="admin-create-note">This sends a targeted in-app support update. It does not expose customer contact data or send through an unconfigured external channel.</p> : null}
          {error ? <p className="admin-dialog-error" role="alert">{error}</p> : null}
        </div>
        <footer><button type="button" onClick={onClose}>Cancel</button><button className="primary" type="button" onClick={submit} disabled={saving || !required || !auditReasonValid}>{saving ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}Create {kind}</button></footer>
      </section>
    </div>
  );
}
