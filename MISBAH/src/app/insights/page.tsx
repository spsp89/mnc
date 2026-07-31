import type { Metadata } from "next";
import Link from "next/link";
import MarketingPage from "@/app/_components/marketing-page";
import { insights } from "@/app/_data/insights";

export const metadata: Metadata = {
  title: "Brand Strategy Insights | Misbah Salam",
  description:
    "Practical ideas for founders and leadership teams building distinctive, enduring brands.",
  alternates: { canonical: "/insights" },
};

export default function InsightsPage() {
  return (
    <MarketingPage
      eyebrow="Insights"
      title="Ideas for leaders building enduring brands."
      intro="Strategic questions and practical perspectives for founders and leadership teams."
    >
      <section className="inner-card-grid">
        {Object.entries(insights).map(([slug, insight], index) => (
          <article className="inner-card" key={slug}>
            <p className="inner-card__number">0{index + 1}</p>
            <h2>{insight.title}</h2>
            <p>{insight.summary}</p>
            <Link href={`/insights/${slug}`}>Read perspective · {insight.readTime}</Link>
          </article>
        ))}
      </section>
    </MarketingPage>
  );
}
