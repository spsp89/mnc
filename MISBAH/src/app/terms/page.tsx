import type { Metadata } from "next";
import MarketingPage from "@/app/_components/marketing-page";

export const metadata: Metadata = {
  title: "Terms | Misbah Salam",
  description: "Terms governing use of the Misbah Salam website and its published content.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Website Terms"
      intro="Terms governing general use of this website and its published content."
      cta={false}
    >
      <article className="legal-copy">
        <h2>Website content</h2>
        <p>The website provides general information about brand strategy and advisory services. It does not create a client relationship or constitute business, legal or financial advice.</p>
        <h2>Intellectual property</h2>
        <p>Unless otherwise stated, website copy, frameworks and original visual material may not be reproduced commercially without written permission.</p>
        <h2>Project engagements</h2>
        <p>All professional engagements are governed by a separate written proposal or agreement defining scope, responsibilities, fees and usage rights.</p>
      </article>
    </MarketingPage>
  );
}
