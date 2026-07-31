import type { Metadata } from "next";
import Image from "next/image";
import MarketingPage from "@/app/_components/marketing-page";

export const metadata: Metadata = {
  title: "Oxygen Brand Evolution | Misbah Salam",
  description:
    "An overview of the strategic brand evolution work developed for Oxygen.",
  alternates: { canonical: "/work/oxygen-brand-evolution" },
};

export default function OxygenCaseStudyPage() {
  return (
    <MarketingPage
      eyebrow="Selected Work · Oxygen"
      title="From retail presence to a clearer market position."
      intro="A strategic brand evolution focused on positioning, customer experience and consistent market expression."
    >
      <Image
        className="case-hero-image"
        src="/images/oxygen-storefront.png"
        alt="Oxygen electronics retail storefront after brand evolution"
        width={1456}
        height={1092}
        sizes="(max-width: 900px) 100vw, 1100px"
      />
      <dl className="case-facts">
        <div><dt>Client</dt><dd>Oxygen</dd></div>
        <div><dt>Category</dt><dd>Consumer electronics retail</dd></div>
        <div><dt>Engagement</dt><dd>Strategic brand evolution</dd></div>
        <div><dt>Focus</dt><dd>Positioning · experience · expression</dd></div>
      </dl>
      <section className="inner-detail-grid">
        <article>
          <p className="inner-kicker">The challenge</p>
          <h2>Build distinction in a competitive retail category.</h2>
          <p>The documented brief focused on clarifying the brand&apos;s role in the market and translating that direction across customer-facing touchpoints.</p>
        </article>
        <article>
          <p className="inner-kicker">Documented workstreams</p>
          <h2>The scope represented on this page.</h2>
          <ul>
            <li>Brand positioning and value proposition</li>
            <li>Customer experience direction</li>
            <li>Retail and communication alignment</li>
            <li>Market activation priorities</li>
          </ul>
        </article>
      </section>
      <section className="proof-standard">
        <p className="inner-kicker">Engagement scope</p>
        <h2>How the strategy moved from definition to expression.</h2>
        <div>
          <article>
            <strong>01</strong>
            <h3>Positioning</h3>
            <p>Clarifying the brand&apos;s role, value proposition and basis for distinction in the category.</p>
          </article>
          <article>
            <strong>02</strong>
            <h3>Experience</h3>
            <p>Translating the strategic direction into priorities for customer-facing retail touchpoints.</p>
          </article>
          <article>
            <strong>03</strong>
            <h3>Expression</h3>
            <p>Aligning communication and market activation around one clearer brand direction.</p>
          </article>
        </div>
      </section>
      <section className="case-evidence">
        <p className="inner-kicker">Strategic foundations</p>
        <h2>The priorities shaping the engagement.</h2>
        <div>
          <article>
            <span className="evidence-status evidence-status--published">Published</span>
            <h3>Client and category</h3>
            <p>Client identity, retail category, storefront image and strategic workstreams.</p>
          </article>
          <article>
            <span className="evidence-status evidence-status--published">Strategic focus</span>
            <h3>Market positioning</h3>
            <p>A clearer value proposition designed to strengthen distinction in a competitive retail category.</p>
          </article>
          <article>
            <span className="evidence-status evidence-status--published">Experience focus</span>
            <h3>Customer expression</h3>
            <p>Alignment across customer experience, retail presence and communication priorities.</p>
          </article>
        </div>
      </section>
      <aside className="evidence-note">
        <strong>Strategic principle</strong>
        <p>
          Strong brand evolution connects market positioning with the everyday
          experience customers see, hear and remember.
        </p>
      </aside>
    </MarketingPage>
  );
}
