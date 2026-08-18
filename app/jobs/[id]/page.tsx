import type { Metadata } from "next";
import { ArrowLeft, BadgeCheck, Building2, CalendarDays, IndianRupee, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { JobApplicationForm } from "@/components/job-application-form";
import { getPublicJob } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublicJob(id);
  return job ? { title: `${job.title} at ${job.business.name}`, description: job.description.slice(0, 150) } : {};
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getPublicJob(id);
  if (!job) notFound();
  const salary = job.salaryMin === undefined && job.salaryMax === undefined
    ? "Salary shared during the hiring process"
    : [job.salaryMin, job.salaryMax]
      .filter((value): value is number => value !== undefined)
      .map((value) => `₹${Math.round(value).toLocaleString("en-IN")}`)
      .join(" – ");

  return (
    <AppShell>
      <main className="job-detail-page">
        <Link className="back-link" href="/jobs"><ArrowLeft size={15} /> Back to all jobs</Link>
        <div className="job-detail-grid">
          <section className="job-detail-content">
            <div className="job-detail-company">
              <span>{job.business.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
              <div><small>Hiring business</small><strong>{job.business.name} {job.business.verified && <BadgeCheck size={16} />}</strong></div>
            </div>
            <span className="eyebrow">{job.employmentType.replaceAll("_", " ")}</span>
            <h1>{job.title}</h1>
            <div className="job-detail-meta">
              <span><MapPin size={16} /> {job.city}, {job.district}, {job.state}</span>
              <span><Building2 size={16} /> {job.workplaceType.replaceAll("_", " ")}</span>
              <span><IndianRupee size={16} /> {salary}</span>
              {job.closesAt && <span><CalendarDays size={16} /> Apply by {new Date(job.closesAt).toLocaleDateString("en-IN")}</span>}
            </div>
            <div className="job-detail-description">
              <h2>About this role</h2>
              {job.description.split(/\n+/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            {!!job.skills.length && (
              <div className="job-detail-skills">
                <h2>Skills and experience</h2>
                <div>{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              </div>
            )}
          </section>
          <aside><JobApplicationForm jobId={job.id} /></aside>
        </div>
      </main>
    </AppShell>
  );
}
