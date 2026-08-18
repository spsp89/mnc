import { ArrowRight, Check, Database, Gem } from "lucide-react";
import Link from "next/link";
import { PortalHero } from "@/components/portal-hero";
import type { PublicSubscriptionPlan } from "@/lib/public-api";
import { formatCurrency } from "@/lib/utils";

export function PricingView({ plans }: { plans: PublicSubscriptionPlan[] }) {
  return (
    <>
      <PortalHero
        eyebrow="Simple business plans"
        title={<><em>Choose the reach and tools your business needs.</em></>}
        description="Six BNC membership levels with clear product, gallery, category, booking, delivery and lead-generation entitlements."
        tone="pricing-portal-hero"
      />
      <section className="page-section pricing-section">
        {plans.length ? <div className="pricing-grid">
          {plans.map((plan) => <article className={plan.slug === "diamond" ? "popular" : ""} key={plan.id}>
            {plan.slug === "diamond" && <span className="popular-plan-label">Popular</span>}
            <span className="plan-icon"><Gem size={22} /></span>
            <h2>{plan.name}</h2>
            <p>{plan.starLevel} BNC {plan.starLevel === 1 ? "star" : "stars"}</p>
            <div className="plan-price"><strong>{formatCurrency(plan.monthlyPrice)}</strong><span>per<br />month</span></div>
            <Link href={`/business/add?plan=${encodeURIComponent(plan.slug)}`}>Choose {plan.name} <ArrowRight size={15} /></Link>
            <ul>{plan.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}</ul>
          </article>)}
        </div> : <div className="empty-state pricing-empty-state">
          <Database size={32} />
          <h2>Plans are temporarily unavailable</h2>
          <p>The billing service did not return the published BNC business plans.</p>
          <Link href="/contact?topic=plans">Ask about business plans <ArrowRight size={15} /></Link>
        </div>}
      </section>
    </>
  );
}
