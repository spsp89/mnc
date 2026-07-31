import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingPage from "@/app/_components/marketing-page";
import { insights, type InsightSlug } from "@/app/_data/insights";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(insights).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const insight = insights[slug as InsightSlug];
  if (!insight) return {};

  return {
    title: `${insight.title} | Misbah Salam`,
    description: insight.summary,
    alternates: { canonical: `/insights/${slug}` },
  };
}

export default async function InsightPage({ params }: Props) {
  const { slug } = await params;
  const insight = insights[slug as InsightSlug];
  if (!insight) notFound();

  return (
    <MarketingPage
      eyebrow={`Insight · ${insight.readTime}`}
      title={insight.title}
      intro={insight.summary}
    >
      <article className="insight-article">
        {insight.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
        <aside>
          <p className="inner-kicker">Leadership takeaways</p>
          <h2>Questions to take into your next discussion.</h2>
          <ul>
            {insight.takeaways.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ul>
        </aside>
      </article>
    </MarketingPage>
  );
}
