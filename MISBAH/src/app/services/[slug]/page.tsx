import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingPage from "@/app/_components/marketing-page";
import { services, type ServiceSlug } from "@/app/_data/services";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(services).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services[slug as ServiceSlug];
  if (!service) return {};
  return {
    title: `${service.title} | Misbah Salam`,
    description: service.summary,
    alternates: { canonical: `/services/${slug}` },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = services[slug as ServiceSlug];
  if (!service) notFound();

  return (
    <MarketingPage
      eyebrow="Service"
      title={service.title}
      intro={service.summary}
    >
      <section className="inner-detail-grid">
        <article>
          <p className="inner-kicker">Who it is for</p>
          <h2>Designed around a real leadership challenge.</h2>
          <p>{service.audience}</p>
        </article>
        <article>
          <p className="inner-kicker">Expected outcomes</p>
          <h2>Clarity your team can act on.</h2>
          <ul>
            {service.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
          </ul>
        </article>
      </section>
      <section className="inner-process">
        <p className="inner-kicker">How the engagement works</p>
        <div>
          {service.process.map((step, index) => (
            <article key={step}>
              <span>0{index + 1}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
