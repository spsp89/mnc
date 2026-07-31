"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="status-page">
          <p className="status-page__code">Error</p>
          <h1>Something went wrong.</h1>
          <p>
            The website could not complete that request. Please try again.
          </p>
          <div className="status-page__actions">
            <button type="button" onClick={reset}>
              Try Again
            </button>
            <Link href="/">Return Home</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
