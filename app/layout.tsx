import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { getSiteOrigin } from "@/lib/site-origin";
import "./globals.css";
import "./home.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const metadataBase = new URL(await getSiteOrigin());
  return {
    metadataBase,
    title: {
      default: "BNC — Business Network Community",
      template: "%s · BNC",
    },
    description:
      "Discover trusted local shops, products, professionals, offers, jobs and appointments across Kerala.",
    applicationName: "BNC",
    keywords: [
      "local businesses",
      "business directory Kerala",
      "services near me",
      "Kochi businesses",
      "Kozhikode businesses",
    ],
    authors: [{ name: "BNC" }],
    creator: "BNC",
    alternates: { canonical: "/" },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: "BNC",
      url: "/",
      title: "BNC — Find any shop, service or deal near you",
      description:
        "Discover trusted local shops, products, professionals, offers, jobs and appointments across Kerala.",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "BNC trusted local discovery across Kerala" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "BNC — Find any shop, service or deal near you",
      description: "Business Network Community for trusted local discovery across Kerala.",
      images: ["/og.png"],
    },
    icons: {
      icon: "/icon.png",
      apple: "/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0736a5",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const origin = await getSiteOrigin();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "BNC",
              url: origin,
              logo: `${origin}/icon.png`,
              areaServed: { "@type": "State", name: "Kerala" },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
