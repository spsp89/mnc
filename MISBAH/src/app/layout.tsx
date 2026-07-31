import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import Analytics from "@/app/_components/analytics";
import AnalyticsConsent from "@/app/_components/analytics-consent";
import { linkedInUrl, siteDescription, siteName, siteUrl } from "@/app/_data/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Misbah Salam | Brand Strategist & Leadership Advisor",
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: "Misbah Salam", url: siteUrl }],
  creator: "Misbah Salam",
  publisher: "Misbah Salam",
  category: "Brand Strategy",
  keywords: [
    "brand strategist",
    "brand strategy consultant",
    "brand positioning",
    "leadership brand advisory",
    "brand mentorship",
    "Misbah Salam",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName,
    title: "Misbah Salam | Brand Strategist & Leadership Advisor",
    description: siteDescription,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Misbah Salam — The Brand Strategist" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Misbah Salam | Brand Strategist & Leadership Advisor",
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: "Misbah Salam",
        url: siteUrl,
        jobTitle: "Brand Strategist and Leadership Advisor",
        email: "mailto:hello@misbahsalam.com",
        sameAs: [linkedInUrl],
        knowsAbout: ["Brand strategy", "Brand positioning", "Leadership advisory", "Brand mentorship"],
      },
      {
        "@type": "ProfessionalService",
        "@id": `${siteUrl}/#business`,
        name: "Misbah Salam — The Brand Strategist",
        url: siteUrl,
        email: "hello@misbahsalam.com",
        founder: { "@id": `${siteUrl}/#person` },
        areaServed: ["India", "United Arab Emirates", "Worldwide"],
        serviceType: ["Brand Strategy and Positioning", "Leadership Brand Advisory", "Brand Mentorship"],
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('consent', 'default', {
                  analytics_storage:
                    localStorage.getItem('misbah-analytics-consent') === 'granted'
                      ? 'granted'
                      : 'denied'
                });
                gtag('config', '${googleAnalyticsId}', {
                  send_page_view: false,
                  anonymize_ip: true
                });
              `}
            </Script>
          </>
        )}
        {googleAnalyticsId && <AnalyticsConsent />}
        <Analytics />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
