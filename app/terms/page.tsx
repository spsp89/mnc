import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Legal · Effective 03 August 2026" title="Terms that keep BNC useful." intro="These terms apply when you search, contact a business, create an account or manage a business profile on BNC.">
      <div className="legal-copy legal-copy-wide">
        <section><h2>1. The BNC service</h2><p>BNC provides local discovery, profile, enquiry, review and marketplace tools. Unless a specific checkout states otherwise, BNC is not the seller or service provider and is not a party to arrangements made directly between customers and businesses.</p></section>
        <section><h2>2. Accounts and eligibility</h2><p>You must provide accurate information, protect access to your account and use the service lawfully. Business representatives confirm they are authorised to manage submitted details. We may request verification or restrict access when ownership is disputed.</p></section>
        <section><h2>3. Profiles, reviews and content</h2><p>Content must be accurate, relevant, lawful and respectful of others’ rights. Reviews should describe genuine experience. Incentivised, fabricated, duplicated or retaliatory content may be removed. You retain ownership of submitted content and grant BNC a limited licence to operate and promote the service.</p></section>
        <section><h2>4. Ranking and paid visibility</h2><p>Organic ranking considers relevance, distance, quality and availability signals. Paid placements are labelled “Sponsored” and do not receive undisclosed organic weighting. We may adjust ranking safeguards to prevent manipulation and protect result quality.</p></section>
        <section><h2>5. Plans, billing and cancellations</h2><p>Current prices, billing periods and included features are shown before purchase. Taxes may apply. Paid plans renew according to the chosen period until cancelled. Service already provided and promotional credits may affect refund eligibility.</p></section>
        <section><h2>6. Prohibited use</h2><p>Do not scrape protected data, bypass rate limits, misuse contact details, submit malicious files, impersonate another person or business, manipulate ratings, interfere with platform operation or use BNC for unlawful discrimination or harassment.</p></section>
        <section><h2>7. Disclaimers and liability</h2><p>Profile and offer information may change, so users should confirm important facts directly. To the extent permitted by law, BNC is not responsible for independent business performance. Nothing in these terms excludes rights that cannot legally be excluded.</p></section>
        <section><h2>8. Contact and disputes</h2><p>Questions may be submitted through the BNC contact page. We first aim to resolve concerns through good-faith support. Governing law and jurisdiction are those applicable in Kerala, India, subject to mandatory consumer rights.</p></section>
      </div>
    </InfoPage>
  );
}
