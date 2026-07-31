import type { Metadata } from "next";
import Image from "next/image";
import MarketingPage from "@/app/_components/marketing-page";
import { linkedInUrl } from "@/app/_data/site";

export const metadata: Metadata = {
  title: "About Misbah Salam | Brand Strategist",
  description:
    "Meet Misbah Salam, a brand strategist and leadership advisor with more than two decades of experience.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="About Misbah Salam"
      title="Strategy with clarity. Growth with direction."
      intro="For more than two decades, Misbah Salam has helped founders and leadership teams turn complex business challenges into focused brand direction."
    >
      <section className="inner-split">
        <div>
          <h2>Founder-level counsel, built for the real world.</h2>
          <p>
            Misbah works at the intersection of business strategy, customer
            perception and organizational alignment. His role is to help
            leaders make clearer choices—not add another layer of complexity.
          </p>
          <p>
            The work spans positioning, brand transformation, leadership
            advisory, mentoring and capability building across India, the UAE
            and international markets.
          </p>
        </div>
        <Image
          src="/images/misbah-about-4k.png"
          alt="Misbah Salam, brand strategist and leadership advisor"
          width={2160}
          height={3840}
          sizes="(max-width: 800px) 100vw, 42vw"
        />
      </section>
      <section className="inner-stat-grid" aria-label="Experience highlights">
        <div><strong>20+</strong><span>Years of experience</span></div>
        <div><strong>500+</strong><span>Brand engagements</span></div>
        <div><strong>15+</strong><span>Countries reached</span></div>
      </section>
      <aside className="professional-profile">
        <div>
          <p className="inner-kicker">Professional profile</p>
          <h2>Follow Misbah&apos;s brand strategy perspectives.</h2>
          <p>View professional activity, published perspectives and industry conversations on LinkedIn.</p>
        </div>
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-analytics-event="linkedin_click"
          data-analytics-location="about_profile"
        >
          View LinkedIn Profile
        </a>
      </aside>
    </MarketingPage>
  );
}
