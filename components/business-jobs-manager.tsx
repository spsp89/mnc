"use client";

import { BriefcaseBusiness, CheckCircle2, Eye, LoaderCircle, Plus, Send, Users, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type ManagedJob = {
  id: string;
  title: string;
  description: string;
  employmentType: string;
  workplaceType: string;
  skills: string[];
  salaryMin: string | number | null;
  salaryMax: string | number | null;
  city: string;
  district: string;
  state: string;
  contactEmail: string | null;
  closesAt: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  _count?: { applications: number };
};

type Applicant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  coverNote: string | null;
  status: "APPLIED" | "SHORTLISTED" | "REJECTED" | "HIRED";
  createdAt: string;
};

const emptyForm = {
  title: "",
  description: "",
  employmentType: "FULL_TIME",
  workplaceType: "ON_SITE",
  skills: "",
  salaryMin: "",
  salaryMax: "",
  city: "",
  district: "",
  state: "Kerala",
  contactEmail: "",
  closesAt: "",
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function BusinessJobsManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [jobs, setJobs] = useState<ManagedJob[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedJob, setSelectedJob] = useState<ManagedJob | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((business) => business.id === businessId);
  const canManage = workspace?.capabilities.includes("business:catalog:manage") ?? false;

  const load = useCallback(async () => {
    if (!businessId) {
      setJobs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(appPath(`/api/business/jobs?businessId=${encodeURIComponent(businessId)}`));
      const body = (await response.json()) as { data?: ManagedJob[]; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Jobs could not be loaded.");
      setJobs(body.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Jobs could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function createJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace || !canManage) return;
    setBusy(true);
    setMessage("");
    try {
      const payload = {
        businessId: workspace.id,
        title: form.title,
        slug: `${slugify(form.title)}-${Date.now().toString(36)}`,
        description: form.description,
        employmentType: form.employmentType,
        workplaceType: form.workplaceType,
        skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        city: form.city,
        district: form.district,
        state: form.state,
        contactEmail: form.contactEmail || undefined,
        closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : undefined,
      };
      const response = await fetch(appPath("/api/business/jobs"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Job could not be created.");
      setFormOpen(false);
      setForm(emptyForm);
      setMessage("Job draft created. Publish it when the vacancy is ready.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Job could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function changeJob(job: ManagedJob, action: "publish" | "close") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/jobs/${job.id}/${action}`), { method: "POST" });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Job could not be updated.");
      setMessage(action === "publish" ? "Vacancy published on BNC." : "Vacancy closed.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Job could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function viewApplicants(job: ManagedJob) {
    setSelectedJob(job);
    setApplicants([]);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/jobs/${job.id}/applications`));
      const body = (await response.json()) as { data?: Applicant[]; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Applicants could not be loaded.");
      setApplicants(body.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Applicants could not be loaded.");
    }
  }

  async function changeApplicant(applicationId: string, status: Applicant["status"]) {
    setBusy(true);
    try {
      const response = await fetch(appPath(`/api/business/job-applications/${applicationId}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Applicant status could not be updated.");
      setApplicants((current) => current.map((applicant) => applicant.id === applicationId ? { ...applicant, status } : applicant));
      setMessage("Applicant status updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Applicant status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div><span className="eyebrow">Local hiring</span><h1>Jobs &amp; applicants</h1><p>Create vacancies, publish them publicly and manage every application in one console.</p></div>
        <div className="business-product-heading-actions">
          {user.businesses.length > 1 && (
            <label><span>Business</span><select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select></label>
          )}
          <button type="button" onClick={() => setFormOpen(true)} disabled={!canManage}><Plus size={15} /> Post a job</button>
        </div>
      </section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}
      <section className="manager-table-card">
        {loading ? (
          <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading vacancies</strong></div>
        ) : jobs.length ? (
          <div className="business-job-list">
            {jobs.map((job) => (
              <article key={job.id}>
                <span>{job.status}</span>
                <div><small>{job.employmentType.replaceAll("_", " ")} · {job.city}</small><h2>{job.title}</h2><p>{job.description}</p></div>
                <strong><Users size={15} /> {job._count?.applications ?? 0} applicants</strong>
                <div>
                  <button type="button" onClick={() => viewApplicants(job)}><Eye size={14} /> Applicants</button>
                  {job.status === "DRAFT" && <button type="button" onClick={() => changeJob(job, "publish")} disabled={busy}><Send size={14} /> Publish</button>}
                  {job.status === "PUBLISHED" && <button type="button" onClick={() => changeJob(job, "close")} disabled={busy}><X size={14} /> Close</button>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty"><BriefcaseBusiness size={28} /><strong>No vacancies yet</strong><span>Create a job draft, then publish it to the public Jobs directory.</span><button type="button" onClick={() => setFormOpen(true)}><Plus size={15} /> Create first job</button></div>
        )}
      </section>

      {formOpen && (
        <div className="business-product-dialog-backdrop" role="presentation">
          <section className="business-product-dialog" role="dialog" aria-modal="true" aria-labelledby="job-form-title">
            <header><div><span className="eyebrow">New vacancy</span><h2 id="job-form-title">Create a job draft</h2></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Close form"><X size={18} /></button></header>
            <form onSubmit={createJob}>
              <label>Job title<input required minLength={3} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
              <label>Description<textarea required minLength={30} maxLength={8000} rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <div className="form-two-column">
                <label>Employment type<select value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })}><option value="FULL_TIME">Full time</option><option value="PART_TIME">Part time</option><option value="CONTRACT">Contract</option><option value="INTERNSHIP">Internship</option><option value="TEMPORARY">Temporary</option></select></label>
                <label>Workplace<select value={form.workplaceType} onChange={(event) => setForm({ ...form, workplaceType: event.target.value })}><option value="ON_SITE">On site</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option></select></label>
              </div>
              <label>Skills <small>Comma separated</small><input required value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="Sales, customer service, Malayalam" /></label>
              <div className="form-two-column">
                <label>Minimum salary<input type="number" min="0" value={form.salaryMin} onChange={(event) => setForm({ ...form, salaryMin: event.target.value })} /></label>
                <label>Maximum salary<input type="number" min="0" value={form.salaryMax} onChange={(event) => setForm({ ...form, salaryMax: event.target.value })} /></label>
              </div>
              <div className="form-two-column">
                <label>City<input required maxLength={80} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
                <label>District<input required maxLength={80} value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} /></label>
              </div>
              <div className="form-two-column">
                <label>State<input required maxLength={80} value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /></label>
                <label>Closing date<input type="date" value={form.closesAt} onChange={(event) => setForm({ ...form, closesAt: event.target.value })} /></label>
              </div>
              <label>Application contact email<input type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} /></label>
              <footer><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <BriefcaseBusiness size={16} />} Save draft</button></footer>
            </form>
          </section>
        </div>
      )}

      {selectedJob && (
        <div className="business-product-dialog-backdrop" role="presentation">
          <section className="business-product-dialog business-applicants-dialog" role="dialog" aria-modal="true" aria-labelledby="applicants-title">
            <header><div><span className="eyebrow">Applicants</span><h2 id="applicants-title">{selectedJob.title}</h2></div><button type="button" onClick={() => setSelectedJob(null)} aria-label="Close applicants"><X size={18} /></button></header>
            <div className="business-applicant-list">
              {applicants.map((applicant) => (
                <article key={applicant.id}>
                  <div><strong>{applicant.name}</strong><a href={`mailto:${applicant.email}`}>{applicant.email}</a>{applicant.phone && <a href={`tel:${applicant.phone}`}>{applicant.phone}</a>}<p>{applicant.coverNote || "No cover note provided."}</p></div>
                  <select value={applicant.status} onChange={(event) => changeApplicant(applicant.id, event.target.value as Applicant["status"])} disabled={busy}><option value="APPLIED">Applied</option><option value="SHORTLISTED">Shortlisted</option><option value="REJECTED">Rejected</option><option value="HIRED">Hired</option></select>
                </article>
              ))}
              {!applicants.length && <div className="admin-empty"><Users size={24} /><strong>No applications yet</strong><span>New customer applications will appear here.</span></div>}
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
