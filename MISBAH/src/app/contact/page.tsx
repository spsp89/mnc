import type { Metadata } from "next";
import MarketingPage from "@/app/_components/marketing-page";
import ContactForm from "./contact-form";
import { linkedInUrl } from "@/app/_data/site";

export const metadata: Metadata = {
  title: "Contact Misbah Salam | Strategy Enquiry",
  description:
    "Contact Misbah Salam to discuss a brand strategy, leadership advisory or mentorship engagement.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <MarketingPage
      eyebrow="Contact"
      title="Start with the challenge, not a sales pitch."
      intro="Share the business context, the decision in front of you and the outcome you are working toward."
      cta={false}
    >
      <section className="contact-panel">
        <div className="contact-panel__form">
          <p className="inner-kicker">Strategy enquiries</p>
          <h2>Request a focused conversation.</h2>
          <p>
            Include your company, current challenge, preferred timeline and the
            type of support you are considering.
          </p>
          <ContactForm />
        </div>
        <dl>
          <div>
            <dt>Prefer a direct conversation?</dt>
            <dd>
              <a
                href="mailto:hello@misbahsalam.com?subject=Strategy%20Call%20Request"
                data-analytics-event="strategy_call_click"
                data-analytics-location="contact_booking"
              >
                Request a call time
              </a>
            </dd>
          </div>
          <div><dt>Email</dt><dd><a href="mailto:hello@misbahsalam.com" data-analytics-event="email_click" data-analytics-location="contact_details">hello@misbahsalam.com</a></dd></div>
          <div><dt>Phone</dt><dd><a href="tel:+919152952946" data-analytics-event="phone_click" data-analytics-location="contact_details">+91 91 52 952 946</a></dd></div>
          <div><dt>Markets</dt><dd>India · UAE · Global</dd></div>
          <div>
            <dt>Professional profile</dt>
            <dd>
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics-event="linkedin_click"
                data-analytics-location="contact_details"
              >
                Connect on LinkedIn
              </a>
            </dd>
          </div>
        </dl>
      </section>
    </MarketingPage>
  );
}
