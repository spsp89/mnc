import Image from "next/image";
import Link from "next/link";
import { linkedInUrl } from "@/app/_data/site";

const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Approach", href: "#approach" },
  { label: "Work", href: "/work" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span className="brand-mark__dot brand-mark__dot--one" />
      <span className="brand-mark__dot brand-mark__dot--two" />
      <span className="brand-mark__dot brand-mark__dot--three" />
      <span className="brand-mark__dot brand-mark__dot--four" />
    </span>
  );
}

function FooterMark() {
  return (
    <span className="footer-mark" aria-hidden="true">
      <span /><span /><span /><span /><span />
    </span>
  );
}

function ContactIcon({ type }: { type: "phone" | "mail" | "location" | "globe" }) {
  if (type === "phone") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4 4 8c0 10 10 20 20 20l4-4-6-6-4 4c-4-2-6-4-8-8l4-4-6-6Z" /></svg>;
  }
  if (type === "mail") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="6" width="26" height="20" rx="3" /><path d="m5 9 11 9L27 9" /></svg>;
  }
  if (type === "location") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 29S6 21 6 12a10 10 0 0 1 20 0c0 9-10 17-10 17Z" /><circle cx="16" cy="12" r="3" /></svg>;
  }
  return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" /><path d="M3 16h26M16 3c4 4 6 8 6 13s-2 9-6 13M16 3c-4 4-6 8-6 13s2 9 6 13M6 9h20M6 23h20" /></svg>;
}

function MetricIcon({ type }: { type: "calendar" | "people" | "globe" | "guidance" }) {
  if (type === "calendar") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="7" y="10" width="34" height="31" rx="3" />
        <path d="M15 5v10M33 5v10M7 19h34M17 27h3M27 27h3M17 34h3" />
      </svg>
    );
  }

  if (type === "people") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="18" cy="15" r="7" />
        <circle cx="34" cy="17" r="6" />
        <path d="M5 41v-5c0-7 5-11 13-11s13 4 13 11v5M30 27c8-1 13 3 13 10v4" />
      </svg>
    );
  }

  if (type === "globe") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="19" />
        <path d="M5 24h38M24 5c6 6 9 12 9 19s-3 13-9 19M24 5c-6 6-9 12-9 19s3 13 9 19M9 13h30M9 35h30" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="18" />
      <circle cx="24" cy="24" r="8" />
      <path d="M24 6v10M24 32v10M6 24h10M32 24h10M11 11l7 7M30 30l7 7M37 11l-7 7M18 30l-7 7" />
    </svg>
  );
}

function FeatureIcon({
  type,
}: {
  type: "counsel" | "positioning" | "systems" | "capability";
}) {
  if (type === "counsel" || type === "capability") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="14" r="8" />
        <path d="M9 43v-5c0-9 6-15 15-15s15 6 15 15v5M16 43v-7M32 43v-7" />
        {type === "capability" && <path d="M20 31h8M24 27v8" />}
      </svg>
    );
  }

  if (type === "positioning") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 4l5 5 7-1 2 7 6 4-4 6 1 7-7 2-4 6-6-4-6 4-4-6-7-2 1-7-4-6 6-4 2-7 7 1 5-5Z" />
        <circle cx="24" cy="22" r="8" />
        <path d="M20 30v11l4-3 4 3V30" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M7 12h34M7 24h34M7 36h34" />
      <circle cx="15" cy="12" r="4" />
      <circle cx="31" cy="24" r="4" />
      <circle cx="20" cy="36" r="4" />
    </svg>
  );
}

function ServiceIcon({
  type,
}: {
  type: "mentor" | "strategy" | "advisory" | "marketing" | "education";
}) {
  if (type === "mentor") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="27" cy="17" r="11" />
        <path d="M8 48c0-12 7-20 19-20 7 0 13 3 16 8" />
        <path d="m49 34 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1 4-8Z" />
      </svg>
    );
  }

  if (type === "strategy") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="30" cy="32" r="22" />
        <circle cx="30" cy="32" r="14" />
        <circle cx="30" cy="32" r="6" />
        <path d="m30 32 20-20M44 10h9v9M50 6l8 1-1 8" />
      </svg>
    );
  }

  if (type === "advisory") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="20" cy="19" r="9" />
        <path d="M5 53V43c0-10 6-16 15-16s15 6 15 16v10M13 53V42M27 53V42" />
        <path d="M41 54V9M42 12h17l-6 7 6 7H42" />
      </svg>
    );
  }

  if (type === "marketing") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M11 36V23l29-12v37L11 36Z" />
        <path d="M40 21h8c5 0 8 4 8 9s-3 9-8 9h-8M14 37l4 17h10l-6-14M53 15l6-5M55 25h7M53 45l6 5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="m5 23 27-14 27 14-27 14L5 23Z" />
      <path d="M16 30v16c10 8 22 8 32 0V30M57 25v21" />
      <circle cx="57" cy="51" r="3" />
    </svg>
  );
}

function FrameworkIcon({
  type,
}: {
  type: "discover" | "define" | "design" | "deliver" | "dominate";
}) {
  if (type === "discover") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="27" cy="27" r="17" />
        <path d="m39 39 15 15M16 28c0-8 5-13 12-13" />
      </svg>
    );
  }

  if (type === "define") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="29" cy="33" r="22" />
        <circle cx="29" cy="33" r="14" />
        <circle cx="29" cy="33" r="6" />
        <path d="m29 33 20-20M43 11h9v9M49 7l8 1-1 8" />
      </svg>
    );
  }

  if (type === "design") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M12 12h30v40H12z" />
        <path d="m22 43 3-13 21-21c3-3 8 2 5 5L30 35l-8 8ZM40 15l6 6M22 43l8-8" />
      </svg>
    );
  }

  if (type === "deliver") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M14 43c8-17 20-28 37-32-4 17-15 29-32 37l-5-5Z" />
        <circle cx="39" cy="23" r="4" />
        <path d="m18 39-8 2 5-8M24 47l-2 8 8-5M20 44l-8 8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M20 12h24v13c0 12-7 20-12 20s-12-8-12-20V12Z" />
      <path d="M20 18H10v7c0 9 6 13 14 13M44 18h10v7c0 9-6 13-14 13M32 45v10M20 55h24" />
    </svg>
  );
}

function HeroMetrics({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      className={`hero__metrics${mobile ? " hero__metrics--mobile" : " hero__metrics--desktop"}`}
      aria-label="Experience and reach"
      role="list"
    >
      <div className="metric" role="listitem">
        <MetricIcon type="calendar" />
        <p><strong>20+</strong><span>Years in brand strategy</span></p>
      </div>
      <div className="metric" role="listitem">
        <MetricIcon type="people" />
        <p><strong>500+</strong><span>Strategy engagements</span></p>
      </div>
      <div className="metric" role="listitem">
        <MetricIcon type="globe" />
        <p><strong>15+</strong><span>Countries served</span></p>
      </div>
      <div className="metric" role="listitem">
        <MetricIcon type="guidance" />
        <p><strong>Founder-Level</strong><span>Advisory</span></p>
      </div>
    </div>
  );
}

export default function TemplateHome() {
  return (
    <div className="reference-home">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Misbah Salam home">
          <BrandMark />
          <span className="brand__copy">
            <span className="brand__name">Misbah Salam</span>
            <span className="brand__tagline">The Brand Strategist</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          {navigation.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`site-nav__link${index === 0 ? " site-nav__link--active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <details className="mobile-nav">
          <summary aria-label="Toggle main navigation">
            <span className="mobile-nav__label">Menu</span>
            <span className="mobile-nav__icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </summary>
          <nav className="mobile-nav__panel" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.label} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </details>

        <Link className="strategy-button" href="/contact" data-analytics-event="strategy_call_click" data-analytics-location="home_header">
          Book a Strategy Call
        </Link>
      </header>

      <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__dots" aria-hidden="true" />

        <div className="hero__portrait">
          <Image
            src="/images/misbah-hero-4k.png"
            alt="Misbah Salam, brand strategist"
            width={2160}
            height={3840}
            sizes="(max-width: 900px) 100vw, 40vw"
            preload
          />
        </div>
        <HeroMetrics mobile />

        <div className="hero__content">
          <p className="hero__eyebrow">
            Brand Strategy · Leadership Advisory · Mentorship
          </p>
          <h1 id="hero-title">
            Build a brand customers choose—and competitors cannot copy.
          </h1>
          <p className="hero__intro">
            <span className="hero__intro-desktop">
              I help ambitious founders and leadership teams turn business
              strategy into distinctive positioning, aligned teams and
              measurable growth.
            </span>
            <span className="hero__intro-mobile">
              I help founders turn business strategy into distinctive
              positioning, aligned teams and measurable growth.
            </span>
          </p>

          <div className="hero__actions">
            <Link className="hero__primary" href="/contact" data-analytics-event="strategy_call_click" data-analytics-location="home_hero">
              Book a Strategy Call
            </Link>
            <Link className="hero__secondary" href="/work" data-analytics-event="work_explore_click" data-analytics-location="home_hero">
              Explore Case Studies
            </Link>
          </div>
          <p className="hero__cta-note">
            Focused strategic counsel · India, UAE and worldwide
          </p>

          <HeroMetrics />
        </div>

        <div className="hero__corners" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="trust-section" id="about">
        <div className="trusted trusted--exact">
          <Image
            className="trusted__exact-image"
            src="/images/trusted-brands-strip-clear.png"
            alt="Trusted by founders and leadership teams worldwide: LIC, Kalyan Jewellers, Oxygen, Qatar Jewellers, KMT Steels, Chungath Jewellery, Hayat and AYT Premium"
            width={2172}
            height={724}
            sizes="100vw"
            unoptimized
          />
        </div>

        <div className="about-grid">
          <div className="about-copy">
            <h2>Strategy with clarity.<br />Growth with direction.</h2>
            <p className="about-copy__lead">
              For more than two decades, Misbah Salam has helped ambitious
              organizations sharpen their positioning, align their story and
              lead their category with confidence.
            </p>

            <div className="features">
              <div className="feature">
                <FeatureIcon type="counsel" />
                <div><h3>Founder-level counsel</h3><p>Strategic guidance from boardroom to brand team.</p></div>
              </div>
              <div className="feature">
                <FeatureIcon type="positioning" />
                <div><h3>Market-led positioning</h3><p>Built on insight, shaped by market realities.</p></div>
              </div>
              <div className="feature">
                <FeatureIcon type="systems" />
                <div><h3>Practical brand systems</h3><p>Simple frameworks that create lasting consistency.</p></div>
              </div>
              <div className="feature">
                <FeatureIcon type="capability" />
                <div><h3>Capability building</h3><p>Empowering teams to think, act and lead like brand owners.</p></div>
              </div>
            </div>
          </div>

          <div className="about-portrait">
            <Image
              src="/images/misbah-about-4k.png"
              alt="Misbah Salam standing in a black suit"
              width={2160}
              height={3840}
              sizes="(max-width: 900px) 100vw, (max-width: 1200px) 50vw, 29vw"
            />
          </div>

          <blockquote className="about-quote">
            <p>
              I don’t just build brands.<br />
              I build movements that<br />
              create value, preference<br />
              and legacy.”
            </p>
            <footer>
              <span className="signature">Misbah Salam</span>
              <span>Misbah Salam</span>
            </footer>
          </blockquote>
        </div>

        <h2 className="services-heading" id="services">
          How I help brands move forward
        </h2>

        <div className="service-cards">
          <article className="service-card">
            <ServiceIcon type="mentor" />
            <h3>Visionary Brand<br />Mentorship</h3>
            <p>
              One-on-one guidance to help you navigate branding, marketing and
              business challenges with clarity and confidence.
            </p>
          </article>
          <article className="service-card">
            <ServiceIcon type="strategy" />
            <h3>Brand Strategy &amp;<br />Positioning</h3>
            <p>
              Market-driven strategies that define your unique advantage and
              position you to win.
            </p>
          </article>
          <article className="service-card">
            <ServiceIcon type="advisory" />
            <h3>Leadership Brand<br />Advisory</h3>
            <p>
              Elevate leadership presence and build trust that inspires teams
              and influences markets.
            </p>
          </article>
        </div>

        <p className="supporting-services">
          Also available: workshops, capability building and integrated
          marketing guidance.
        </p>

        <div className="services-cta">
          <Link href="/services" data-analytics-event="services_explore_click" data-analytics-location="home_services">Explore Services</Link>
        </div>

        <section className="framework" id="approach" aria-labelledby="framework-title">
          <h2 id="framework-title">The Brand Movement Framework</h2>
          <div className="framework__steps">
            <article className="framework-step">
              <span className="framework-step__number">1</span>
              <FrameworkIcon type="discover" />
              <h3>Discover</h3>
              <p>Understand your business, audience and market.</p>
            </article>
            <article className="framework-step">
              <span className="framework-step__number">2</span>
              <FrameworkIcon type="define" />
              <h3>Define</h3>
              <p>Craft a clear brand strategy and positioning.</p>
            </article>
            <article className="framework-step">
              <span className="framework-step__number">3</span>
              <FrameworkIcon type="design" />
              <h3>Design</h3>
              <p>Create impactful brand identity and experiences that connect.</p>
            </article>
            <article className="framework-step">
              <span className="framework-step__number">4</span>
              <FrameworkIcon type="deliver" />
              <h3>Deliver</h3>
              <p>Execute integrated marketing and brand solutions.</p>
            </article>
            <article className="framework-step">
              <span className="framework-step__number">5</span>
              <FrameworkIcon type="dominate" />
              <h3>Dominate</h3>
              <p>Measure results and scale for sustainable growth.</p>
            </article>
          </div>
        </section>

        <section className="work-insights">
          <div className="selected-work" id="results">
            <h2>Selected work. Scope before spectacle.</h2>
            <article className="case-study">
              <div className="case-study__copy">
                <div className="oxygen-wordmark" aria-hidden="true">
                  <strong>O</strong>XYGEN
                  <small>THE DIGITAL EXPERT</small>
                </div>
                <h3>Oxygen — Strategic<br />Brand Evolution</h3>
                <p>
                  A strategic engagement spanning positioning, customer
                  experience direction and market expression.
                </p>
                <div className="case-study__metrics">
                  <div><strong>01</strong><span>Positioning</span></div>
                  <div><strong>02</strong><span>Experience</span></div>
                  <div><strong>03</strong><span>Expression</span></div>
                </div>
                <Link
                  href="/work/oxygen-brand-evolution"
                  className="case-study__button"
                  data-analytics-event="case_study_click"
                  data-analytics-location="home_selected_work"
                  data-analytics-label="Oxygen brand evolution"
                >
                  View Project Overview
                </Link>
              </div>
              <div className="case-study__image">
                <Image
                  src="/images/oxygen-storefront.png"
                  alt="Oxygen electronics retail storefront"
                  width={1456}
                  height={1092}
                  sizes="(max-width: 900px) 100vw, 26vw"
                />
              </div>
            </article>
          </div>

          <div className="insights" id="insights">
            <h2>Ideas for leaders building enduring brands</h2>
            <div className="insights-card">
              <article className="insight-item">
                <div className="insight-item__video">
                  <Image
                    src="/images/misbah-about-4k.png"
                    alt="Misbah Salam presenting a brand strategy insight"
                    width={2160}
                    height={3840}
                    sizes="(max-width: 900px) 48vw, 24vw"
                  />
                </div>
                <div className="insight-item__copy">
                  <h3>Brand Building in<br />the Digital Age</h3>
                  <span className="insight-item__status">Brand Strategy Perspective</span>
                </div>
              </article>
              <Link className="insights-card__link" href="/insights/brand-building-digital-age" data-analytics-event="insights_explore_click" data-analytics-location="home_insights">
                Read the perspective
              </Link>
            </div>
          </div>
        </section>

        <section className="recognition" aria-label="Testimonials and press recognition">
          <div className="recognition__testimonial">
            <h2>Trusted for strategic clarity</h2>
            <blockquote className="testimonial-card">
              <span className="testimonial-card__quote" aria-hidden="true">“</span>
              <div className="testimonial-card__body">
                <p>
                  Misbah Salam&apos;s strategic approach and deep understanding
                  of branding helped us elevate our brand to the next level.
                  A true professional and a trusted advisor.
                </p>
                <footer>
                  <span className="testimonial-card__avatar" aria-hidden="true">SB</span>
                  <span>
                    <strong>Sanjeep Bose</strong>
                    <small>Managing Director, AYT Premium</small>
                  </span>
                </footer>
                <span className="testimonial-card__status">
                  Client perspective
                </span>
              </div>
            </blockquote>
          </div>

          <div className="recognition__press">
            <h2>A standard built on credibility</h2>
            <div className="trust-verification">
              <p>
                Every published reference is presented with clear context,
                accurate attribution and a direct source wherever available.
              </p>
              <ul>
                <li><span aria-hidden="true">✓</span>Clear source attribution</li>
                <li><span aria-hidden="true">✓</span>Accurate publication context</li>
                <li><span aria-hidden="true">✓</span>Responsible brand representation</li>
              </ul>
            </div>
          </div>
        </section>
      </section>
      </main>

      <footer className="site-footer" id="contact">
        <div className="footer-cta">
          <div className="footer-cta__corner" aria-hidden="true" />
          <FooterMark />
          <div className="footer-cta__copy">
            <h2>Your next chapter needs<br />a sharper brand.</h2>
            <p>Book a focused conversation about the opportunity ahead.</p>
          </div>
          <a
            className="footer-cta__button"
            href="mailto:hello@misbahsalam.com?subject=Strategy%20Call%20Enquiry&body=Hello%20Misbah%2C%0A%0AI%27d%20like%20to%20discuss%20a%20brand%20strategy%20project.%0A%0ACompany%3A%0AChallenge%3A%0APreferred%20timeline%3A%0A"
            data-analytics-event="enquiry_email_click"
            data-analytics-location="home_footer_cta"
          >
            Request a Strategy Call
          </a>
          <div className="footer-cta__dots" aria-hidden="true" />
        </div>

        <div className="footer-content">
          <section className="footer-connect">
            <h3>Connect</h3>
            <p>
              I&apos;m always open to connect with founders, businesses and
              professionals who are driven to make an impact. Let&apos;s create
              something extraordinary together.
            </p>
            <div className="social-links" role="group" aria-label="Professional and contact links">
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Misbah Salam on LinkedIn"
                data-analytics-event="linkedin_click"
                data-analytics-location="home_footer_social"
              >
                in
              </a>
              <a
                href="mailto:hello@misbahsalam.com?subject=Website%20Enquiry"
                aria-label="Email Misbah Salam"
                data-analytics-event="email_click"
                data-analytics-location="home_footer_social"
              >
                ✉
              </a>
            </div>
            <small>© 2026 Misbah Salam. All Rights Reserved.</small>
          </section>

          <section className="footer-contact">
            <h3>Contact</h3>
            <a href="tel:+919152952946" data-analytics-event="phone_click" data-analytics-location="home_footer_contact"><ContactIcon type="phone" />+91 91 52 952 946</a>
            <a href="mailto:hello@misbahsalam.com" data-analytics-event="email_click" data-analytics-location="home_footer_contact"><ContactIcon type="mail" />hello@misbahsalam.com</a>
            <p><ContactIcon type="location" />Kerala, India | UAE</p>
            <p><ContactIcon type="globe" />Available for Global Projects</p>
          </section>

          <nav className="footer-links" aria-label="Footer navigation">
            <h3>Quick Links</h3>
            <div>
              <span>
                <Link href="/">Home</Link>
                <Link href="/about">About</Link>
                <Link href="/services">Services</Link>
                <Link href="#approach">Approach</Link>
              </span>
              <span>
                <Link href="/work">Work</Link>
                <Link href="/insights">Insights</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
              </span>
            </div>
          </nav>

        </div>
      </footer>
    </div>
  );
}
