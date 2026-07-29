import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { SiteHeader } from "./site-header";

type IconType = ComponentType<{ className?: string }>;

export type EcosystemPageData = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
  heroImage: string;
  stats: Array<{ value: string; label: string }>;
  features: Array<{ title: string; text: string; icon: IconType }>;
  steps: Array<{ title: string; text: string }>;
};

export function EcosystemPage({ data }: { data: EcosystemPageData }) {
  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="bg-[radial-gradient(circle_at_18%_12%,#164caa,#082d75_48%,#061f55_100%)]">
          <div className="mx-auto grid max-w-[1800px] gap-7 px-4 py-8 sm:px-5 md:px-10 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:py-12">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#f5b625]">
                {data.eyebrow}
              </p>
              <h1 className="mt-3 max-w-[760px] text-[38px] font-black leading-[0.98] sm:text-[58px] lg:text-[72px]">
                {data.title}
              </h1>
              <p className="mt-4 max-w-[660px] text-[15px] font-semibold leading-7 text-white/84 sm:text-[17px]">
                {data.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={data.primaryHref} className="inline-flex items-center gap-2 rounded-full bg-[#f5b625] px-5 py-3 text-[13px] font-black text-[#08285f] transition hover:bg-[#ffd05a]">
                  {data.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {data.secondaryCta && data.secondaryHref ? (
                  <Link href={data.secondaryHref} className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-5 py-3 text-[13px] font-black text-white transition hover:bg-white/14">
                    {data.secondaryCta}
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-white/16 bg-white/10 p-3 shadow-[0_24px_55px_rgba(0,0,0,0.24)]">
              <div
                className="min-h-[260px] rounded-[16px] bg-cover bg-center sm:min-h-[360px]"
                style={{ backgroundImage: `linear-gradient(0deg,rgba(6,31,85,0.18),rgba(6,31,85,0.08)),url('${data.heroImage}')` }}
              />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 pb-16 pt-7 sm:px-5 md:px-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {data.stats.map((stat) => (
            <div key={stat.label} className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_28px_rgba(11,47,116,0.05)]">
              <div className="text-[32px] font-black text-[#f5b625]">{stat.value}</div>
              <div className="mt-1 text-[13px] font-black uppercase tracking-[0.08em] text-[#71809b]">{stat.label}</div>
            </div>
          ))}
        </div>

        <section className="mt-8">
          <h2 className="text-[28px] font-black leading-tight sm:text-[34px]">What you can do</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_28px_rgba(11,47,116,0.05)]">
                  <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#fff4d6] text-[#f5a400]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-[18px] font-black">{feature.title}</h3>
                  <p className="mt-2 text-[13px] font-semibold leading-6 text-[#62718d]">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-[20px] border border-[#dfe6f2] bg-white p-5 shadow-[0_14px_32px_rgba(11,47,116,0.06)] sm:p-7">
          <h2 className="text-[25px] font-black leading-tight sm:text-[32px]">How it works</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {data.steps.map((step, index) => (
              <div key={step.title} className="rounded-[16px] bg-[#f6f8fc] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0b2f74] text-[13px] font-black text-white">
                    {index + 1}
                  </span>
                  <CheckCircle2 className="h-5 w-5 text-[#25a451]" />
                </div>
                <h3 className="mt-4 text-[17px] font-black">{step.title}</h3>
                <p className="mt-2 text-[13px] font-semibold leading-6 text-[#62718d]">{step.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
