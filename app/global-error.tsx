"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><main style={{ minHeight: "100vh", display: "grid", placeContent: "center", padding: 24, fontFamily: "system-ui", textAlign: "center" }}><h1>BNC needs a fresh start.</h1><p>The application shell could not load safely.</p><button type="button" onClick={reset}>Try again</button></main></body></html>;
}
