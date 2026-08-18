import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Legal · Updated 03 August 2026" title="Privacy, in plain language." intro="This policy explains what BNC collects, why it is needed, how it is protected and the choices available to you.">
      <div className="legal-layout">
        <nav><a href="#collect">Information we collect</a><a href="#use">How we use it</a><a href="#sharing">Sharing</a><a href="#retention">Retention</a><a href="#rights">Your rights</a><a href="#security">Security</a><a href="#contact">Contact</a></nav>
        <div className="legal-copy">
          <section id="collect"><h2>1. Information we collect</h2><p>We collect account identifiers supplied by the secure sign-in provider, information you submit in enquiries or reviews, saved profiles, business application details, verification documents, and technical records needed for security and reliability. Precise location is used only when you choose to provide it; search can use a typed locality instead.</p></section>
          <section id="use"><h2>2. How we use information</h2><p>Information is used to provide local search, operate accounts, route consented enquiries, verify businesses, prevent abuse, measure service performance and comply with legal obligations. BNC does not use enquiry contact details to add marketing consent.</p></section>
          <section id="sharing"><h2>3. When information is shared</h2><p>An enquiry is shared only with the selected business or relevant matched businesses according to the preference and consent shown in the form. Service providers may process limited information under contractual safeguards. We disclose information where legally required or necessary to protect users and the platform.</p></section>
          <section id="retention"><h2>4. Retention</h2><p>Enquiry contact payloads have a defined expiry window and are deleted or irreversibly anonymised when no longer needed. Verification evidence is retained only while an ownership decision or dispute requires it. Security and audit records may be kept longer where justified.</p></section>
          <section id="rights"><h2>5. Your choices and rights</h2><p>You may request access, correction, deletion, consent withdrawal or an explanation of account data. Some records may be preserved where law, fraud prevention or an active dispute requires it. Location, notification and contact preferences can be changed from account settings.</p></section>
          <section id="security"><h2>6. Security</h2><p>Sensitive contact data is encrypted, passwords are not collected by the customer web experience, privileged actions are server-authorised and administrative changes are audited. No system is risk-free; confirmed incidents are assessed and notified as required.</p></section>
          <section id="contact"><h2>7. Privacy contact</h2><p>Use the privacy topic on the BNC contact page. Include the email or mobile number connected to your request so we can verify it safely.</p></section>
        </div>
      </div>
    </InfoPage>
  );
}
