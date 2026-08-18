import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Refund and cancellation policy" };

export default function RefundPolicyPage() {
  return (
    <InfoPage eyebrow="Legal · Effective 03 August 2026" title="Refunds without guesswork." intro="This policy explains cancellations, returns and refunds for BNC subscriptions and participating marketplace orders.">
      <div className="legal-copy legal-copy-wide">
        <section><h2>1. Business subscriptions</h2><p>You may cancel renewal at any time. Access continues through the paid billing period. A duplicate charge, technical billing error or service not activated will be reviewed for a full correction. Promotional credits and services already consumed are normally non-refundable unless law requires otherwise.</p></section>
        <section><h2>2. Marketplace orders</h2><p>The checkout shows the selling business, fulfilment method and cancellation window. Eligible orders may be cancelled before preparation begins. Return eligibility depends on product condition, category, seller policy and applicable consumer law.</p></section>
        <section><h2>3. Refund timing</h2><p>Approved refunds are sent to the original payment method. BNC initiates the provider request promptly; banks and payment networks may take additional business days to display the credit.</p></section>
        <section><h2>4. Disputes and evidence</h2><p>Open a support request with the order or payment reference and a concise explanation. Never send card PINs, OTPs or complete payment credentials. BNC records refund decisions and provider references for reconciliation.</p></section>
      </div>
    </InfoPage>
  );
}
