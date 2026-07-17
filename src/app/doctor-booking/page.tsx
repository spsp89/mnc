import type { Metadata } from "next";

import { DoctorBookingExperience } from "@/components/nearu/doctor-booking";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

const page = ecosystemPages["doctor-booking"];

export const metadata: Metadata = {
  title: pageTitle("Doctor Booking"),
  description: page.metaDescription,
  alternates: { canonical: "/doctor-booking" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Doctor Booking"),
    description: page.metaDescription,
    url: absoluteUrl("/doctor-booking"),
    images: [{ url: absoluteUrl(page.heroImage), width: 1200, height: 630, alt: page.title }],
  }),
};

export default function DoctorBookingPage() {
  return <DoctorBookingExperience />;
}
