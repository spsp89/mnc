import Link from "next/link";
import type { ReactNode } from "react";
import { linkedInUrl } from "@/app/_data/site";

const links = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/insights", label: "Insights" },
  { href: "/contact", label: "Contact" },
];

type MarketingPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  cta?: boolean;
};

export default function MarketingPage({
  eyebrow,
  title,
  intro,
  children,
  cta = true,
}: MarketingPageProps) {
  return (
    <div className="inner-page">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="inner-header">
        <Link href="/" className="inner-brand" aria-label="Misbah Salam home">
          <strong>Misbah Salam</strong>
          <span>The Brand Strategist</span>
        </Link>
        <nav aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/contact"
          className="inner-header__cta"
          data-analytics-event="strategy_call_click"
          data-analytics-location="inner_header"
        >
          Book a Strategy Call
        </Link>
      </header>

      <main id="main-content">
        <section className="inner-hero">
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <div>{intro}</div>
        </section>

        <div className="inner-content">{children}</div>

        {cta && (
          <section className="inner-cta">
            <div>
              <p>Ready for a sharper brand?</p>
              <h2>Let&apos;s clarify the opportunity ahead.</h2>
            </div>
            <Link
              href="/contact"
              data-analytics-event="strategy_call_click"
              data-analytics-location="inner_footer_cta"
            >
              Discuss Your Brand Challenge
            </Link>
          </section>
        )}
      </main>

      <footer className="inner-footer">
        <span>© 2026 Misbah Salam</span>
        <nav aria-label="Legal navigation">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event="linkedin_click"
            data-analytics-location="inner_footer"
          >
            LinkedIn
          </a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </div>
  );
}
