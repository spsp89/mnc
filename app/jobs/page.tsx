import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { JobsView } from "@/components/jobs-view";
import { getPublicJobs } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Local jobs",
  description: "Find current job vacancies published by local BNC businesses.",
};

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await getPublicJobs();
  return <AppShell><JobsView jobs={jobs} /></AppShell>;
}
