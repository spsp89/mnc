import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { PortalHero } from "@/components/portal-hero";

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <AppShell headerVariant="immersive">
      <PortalHero
        eyebrow={eyebrow}
        title={<>{title}</>}
        description={intro}
        imageAlt={`${title} on BNC`}
        tone="info-portal-hero"
        mediaLabel="Clear information, grounded in local life"
      />
      <article className="info-content">{children}</article>
    </AppShell>
  );
}
