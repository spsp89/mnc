"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileNavigation } from "@/components/mobile-navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function AppShell({
  children,
  footer = true,
  headerVariant = "immersive",
}: {
  children: ReactNode;
  footer?: boolean;
  headerVariant?: "default" | "immersive";
}) {
  const pathname = usePathname();

  return (
    <>
      <SiteHeader variant={headerVariant} />
      <main className={pathname === "/" ? "app-shell-main home-app-shell-main" : "app-shell-main"}>{children}</main>
      {footer && <SiteFooter />}
      <MobileNavigation />
    </>
  );
}
