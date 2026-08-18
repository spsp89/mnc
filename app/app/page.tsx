import type { Metadata } from "next";
import {
  Apple,
  BellRing,
  Bookmark,
  Download,
  MapPinned,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { AppShell } from "@/components/app-shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { mobileAppLandingUrl, mobileReleaseReadiness, mobileStoreDestination } from "@/lib/mobile-app-release.mjs";
import { getSiteOrigin } from "@/lib/site-origin";

export const metadata: Metadata = {
  title: "Download the BNC mobile app",
  description: "Open the official BNC Android or iPhone install destination.",
};

export default async function MobileAppPage() {
  const android = mobileStoreDestination(process.env.NEXT_PUBLIC_ANDROID_APP_URL, "android");
  const ios = mobileStoreDestination(process.env.NEXT_PUBLIC_IOS_APP_URL, "ios");
  const release = mobileReleaseReadiness(process.env);
  const installUrl = mobileAppLandingUrl(await getSiteOrigin());
  const qrDataUrl = await QRCode.toDataURL(installUrl, {
    width: 260,
    margin: 2,
    color: { dark: "#061d62", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });
  const hasRelease = release.ready;

  return (
    <AppShell headerVariant="immersive">
      <section className="mobile-app-page">
        <div className="mobile-app-copy">
          <span className="eyebrow">{hasRelease ? "Official mobile downloads" : "Mobile release preparation"}</span>
          <h1>Your neighbourhood, ready when you are.</h1>
          <p>
            Scan the QR code or use an official store destination. BNC only displays a download
            button when its release URL has been configured.
          </p>
          <div className="mobile-download-grid">
            <div className="mobile-download-qr">
              <Image src={qrDataUrl} alt="QR code for the BNC mobile app install page" width={180} height={180} unoptimized />
              <span><QrCode size={17} /> Scan to open the install page</span>
            </div>
            <div className="mobile-store-links">
              {hasRelease && android.url ? (
                <a href={android.url} target="_blank" rel="noopener noreferrer">
                  <Smartphone size={22} />
                  <span><small>Android</small><strong>Get the BNC app</strong></span>
                  <Download size={17} />
                </a>
              ) : (
                <span aria-disabled="true">
                  <Smartphone size={22} />
                  <span><small>Android</small><strong>{android.configured ? "Invalid release URL" : "Release URL pending"}</strong></span>
                </span>
              )}
              {hasRelease && ios.url ? (
                <a href={ios.url} target="_blank" rel="noopener noreferrer">
                  <Apple size={22} />
                  <span><small>iPhone & iPad</small><strong>View on the App Store</strong></span>
                  <Download size={17} />
                </a>
              ) : (
                <span aria-disabled="true">
                  <Apple size={22} />
                  <span><small>iPhone & iPad</small><strong>{ios.configured ? "Invalid App Store URL" : "App Store release pending"}</strong></span>
                </span>
              )}
            </div>
          </div>
          {!hasRelease && (
            <>
              <WaitlistForm />
              <small>We will use this number only for app availability updates.</small>
            </>
          )}
        </div>
        <div className="app-feature-stack">
          <article><MapPinned size={21} /><div><strong>Truly local search</strong><p>Distance and locality stay visible from the first result.</p></div></article>
          <article><Bookmark size={21} /><div><strong>Shortlists that travel</strong><p>Keep the businesses and products worth returning to.</p></div></article>
          <article><MessageCircle size={21} /><div><strong>Enquiry progress</strong><p>See matched responses with the original requirement attached.</p></div></article>
          <article><BellRing size={21} /><div><strong>Quiet, useful updates</strong><p>Control channels and receive meaningful status changes.</p></div></article>
          <aside><ShieldCheck size={20} /><span><strong>Verified release destinations</strong><small>Store links are controlled by deployment configuration.</small></span><Sparkles size={17} /></aside>
        </div>
      </section>
    </AppShell>
  );
}
