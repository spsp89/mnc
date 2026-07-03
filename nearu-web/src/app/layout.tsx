import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Poppins } from "next/font/google";

import "./globals.css";

const poppins = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nearu",
  description: "Nearu marketplace website and admin panel powered by Next.js and SQLite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
