import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { PointerMotion } from "@/components/nearu/pointer-motion";
import {
  absoluteUrl,
  defaultOpenGraph,
  pageTitle,
  siteDescription,
  siteName,
  siteUrl,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: siteName,
  title: {
    default: pageTitle(),
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: defaultOpenGraph({
    title: pageTitle(),
    description: siteDescription,
    url: absoluteUrl("/"),
    images: [
      {
        url: absoluteUrl("/mockup/im-restaurant.jpg"),
        width: 1200,
        height: 630,
        alt: "Nearu local marketplace",
      },
    ],
  }),
  twitter: {
    card: "summary_large_image",
    title: pageTitle(),
    description: siteDescription,
    images: [absoluteUrl("/mockup/im-restaurant.jpg")],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <PointerMotion />
        {children}
      </body>
    </html>
  );
}
