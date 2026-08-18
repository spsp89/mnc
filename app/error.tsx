"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-page"><span><TriangleAlert size={35} /></span><small className="eyebrow">Something interrupted this page</small><h1>Let’s try that again.</h1><p>Your submitted details have not been silently repeated.</p><button type="button" onClick={reset}><RotateCcw size={15} /> Retry safely</button><Link href="/">Return to BNC</Link></main>;
}
