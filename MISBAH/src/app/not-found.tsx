import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found | Misbah Salam",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="status-page">
      <p className="status-page__code">404</p>
      <h1>This page could not be found.</h1>
      <p>
        The address may have changed, or the page may no longer be available.
      </p>
      <div className="status-page__actions">
        <Link href="/">Return Home</Link>
        <Link href="/contact">Contact Misbah</Link>
      </div>
    </main>
  );
}
