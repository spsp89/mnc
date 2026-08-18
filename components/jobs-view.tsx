"use client";

import { BriefcaseBusiness, Building2, IndianRupee, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PortalHero } from "@/components/portal-hero";
import type { PublicJob } from "@/lib/public-api";

const employmentLabels: Record<string, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
};

function salaryLabel(job: PublicJob) {
  if (job.salaryMin === undefined && job.salaryMax === undefined) return "Salary shared on application";
  const values = [job.salaryMin, job.salaryMax]
    .filter((value): value is number => value !== undefined)
    .map((value) => `₹${Math.round(value).toLocaleString("en-IN")}`);
  return values.join(" – ");
}

export function JobsView({ jobs }: { jobs: PublicJob[] }) {
  const [query, setQuery] = useState("");
  const [employmentType, setEmploymentType] = useState("ALL");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((job) => (
      (employmentType === "ALL" || job.employmentType === employmentType)
      && (!needle || `${job.title} ${job.description} ${job.business.name} ${job.city} ${job.skills.join(" ")}`
        .toLowerCase()
        .includes(needle))
    ));
  }, [employmentType, jobs, query]);

  return (
    <>
      <PortalHero
        eyebrow="Work close to home"
        title={<>Local jobs from <em>businesses you can verify.</em></>}
        description="Browse current vacancies, review the employer on BNC and apply directly through the platform."
        image={jobs[0]?.business.coverImageUrl}
        imageAlt="Local job opportunities on BNC"
        tone="marketplace-hero"
        mediaLabel="Opportunities across Kerala"
      >
        <label className="catalog-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search jobs, skills, companies or cities"
          />
        </label>
      </PortalHero>

      <section className="page-section catalog-section">
        <div className="catalog-toolbar">
          <div className="filter-pills" aria-label="Employment type">
            <button type="button" className={employmentType === "ALL" ? "active" : ""} onClick={() => setEmploymentType("ALL")}>All roles</button>
            {Object.entries(employmentLabels).map(([value, label]) => (
              <button type="button" className={employmentType === value ? "active" : ""} onClick={() => setEmploymentType(value)} key={value}>{label}</button>
            ))}
          </div>
          <span><BriefcaseBusiness size={15} /> {filtered.length} open roles</span>
        </div>

        {filtered.length ? (
          <div className="jobs-directory-grid">
            {filtered.map((job) => (
              <article className="jobs-directory-card" key={job.id}>
                <div className="jobs-directory-company">
                  <span>{job.business.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                  <div>
                    <small>{employmentLabels[job.employmentType] ?? job.employmentType}</small>
                    <strong>{job.business.name}</strong>
                  </div>
                </div>
                <h2><Link href={`/jobs/${job.id}`}>{job.title}</Link></h2>
                <p>{job.description}</p>
                <div className="jobs-directory-meta">
                  <span><MapPin size={14} /> {job.city}, {job.district}</span>
                  <span><Building2 size={14} /> {job.workplaceType.replaceAll("_", " ").toLowerCase()}</span>
                  <span><IndianRupee size={14} /> {salaryLabel(job)}</span>
                </div>
                <div className="bnc-job-skills">
                  {job.skills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}
                </div>
                <Link className="jobs-directory-action" href={`/jobs/${job.id}`}>View and apply</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><Search size={30} /><h2>No matching vacancies</h2><p>Try another role, skill or employment type.</p></div>
        )}
      </section>
    </>
  );
}
