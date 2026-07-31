import type { Metadata } from "next";
import MarketingPage from "@/app/_components/marketing-page";

export const metadata: Metadata = {
  title: "Privacy | Misbah Salam",
  description: "How information shared with Misbah Salam through this website is handled.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Privacy"
      intro="A plain-language overview of how information shared through this website is handled."
      cta={false}
    >
      <article className="legal-copy">
        <h2>Information you provide</h2>
        <p>When you use the enquiry form, email or call, you choose what business and contact information to share. That information is used to respond to your enquiry and discuss potential services.</p>
        <h2>Data sharing</h2>
        <p>Your enquiry information is not sold. It may be processed by communication and hosting providers only where required to operate the website and respond to you.</p>
        <h2>Optional analytics</h2>
        <p>If website analytics are enabled, analytics storage remains disabled unless you accept it through the privacy preference shown on the website. You can clear the site&apos;s local storage in your browser to reset that choice.</p>
        <h2>Retention and requests</h2>
        <p>Information is retained only as reasonably necessary for correspondence, legal obligations and business records. To request access, correction or deletion, email hello@misbahsalam.com.</p>
      </article>
    </MarketingPage>
  );
}
