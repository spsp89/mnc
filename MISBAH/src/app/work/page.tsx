import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MarketingPage from "@/app/_components/marketing-page";

export const metadata: Metadata = {
  title: "Selected Brand Work | Misbah Salam",
  description:
    "Explore selected brand strategy and transformation work led by Misbah Salam.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <MarketingPage
      eyebrow="Selected Work"
      title="Strategy shown through scope, decisions and evidence."
      intro="Selected engagements showing how strategic direction becomes clearer positioning, experience and market expression."
    >
      <article className="work-feature">
        <Image
          src="/images/oxygen-storefront.png"
          alt="Oxygen electronics retail storefront"
          width={1456}
          height={1092}
          sizes="(max-width: 800px) 100vw, 52vw"
        />
        <div>
          <p className="inner-kicker">Brand evolution · Retail</p>
          <h2>Oxygen: Strategic Brand Evolution</h2>
          <p>
            A documented engagement spanning positioning, customer experience
            direction and market expression.
          </p>
          <Link
            href="/work/oxygen-brand-evolution"
            data-analytics-event="case_study_click"
            data-analytics-location="work_index"
            data-analytics-label="Oxygen brand evolution"
          >
            View project overview
          </Link>
        </div>
      </article>
      <section className="proof-standard">
        <p className="inner-kicker">Publication standard</p>
        <h2>What you can expect from every published case study.</h2>
        <div>
          <article>
            <strong>01</strong>
            <h3>Clear scope</h3>
            <p>The role, workstreams and deliverables are separated from broad claims.</p>
          </article>
          <article>
            <strong>02</strong>
            <h3>Relevant context</h3>
            <p>Each project is presented with the context needed to understand the strategic decisions.</p>
          </article>
          <article>
            <strong>03</strong>
            <h3>No invented outcomes</h3>
            <p>Commercial metrics appear only when their definition and source can be stated.</p>
          </article>
        </div>
      </section>
      <aside className="case-pipeline">
        <strong>Every engagement is different.</strong>
        <p>Explore how strategic thinking is adapted to the organisation, category and opportunity at hand.</p>
      </aside>
    </MarketingPage>
  );
}
