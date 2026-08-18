import type { Metadata } from "next";
import { Building2, MessageCircle, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Help centre" };

const faqs = [
  ["How does BNC choose search results?", "Results consider text relevance, category fit, distance, profile quality, current availability and review confidence. Sponsored placements are labelled separately."],
  ["Who receives my enquiry?", "A direct profile enquiry goes only to that business. A matched request is shared only with relevant businesses selected by service and location, under the consent shown before submission."],
  ["How do I claim a business?", "Open Claim a listing, provide the business and ownership details, and upload a suitable private proof document. A reviewer checks the request before granting access."],
  ["Can a business pay for a better organic rank?", "No. Paid visibility is clearly labelled Sponsored. Subscription priority may apply only within explicitly sponsored inventory or eligible lead allocation rules."],
  ["How can I report inaccurate information?", "Send the profile URL and the specific issue through Contact. Safety, impersonation and ownership issues are prioritised."],
];

export default function HelpPage() {
  return (
    <InfoPage eyebrow="BNC help centre" title="Answers for local decisions." intro="Understand discovery, enquiries, verification and account controls—or reach a person when the issue needs one.">
      <section className="help-paths">
        <Link href="/search"><Search size={22} /><div><strong>Finding a business</strong><small>Search, distance, filters and comparisons</small></div></Link>
        <Link href="/account/enquiries"><MessageCircle size={22} /><div><strong>Enquiries and replies</strong><small>Consent, contact and status</small></div></Link>
        <Link href="/business/claim"><Building2 size={22} /><div><strong>Business ownership</strong><small>Listing, claims and verification</small></div></Link>
        <Link href="/account/privacy"><ShieldCheck size={22} /><div><strong>Privacy and safety</strong><small>Controls, reports and data requests</small></div></Link>
      </section>
      <section className="faq-section"><span className="eyebrow">Common questions</span><h2>Start here</h2><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
      <section className="info-cta"><div><h2>Need a specific answer?</h2><p>Tell us what happened and include the relevant listing or enquiry reference.</p></div><Link href="/contact">Contact BNC support</Link></section>
    </InfoPage>
  );
}
