"use client";

import { Bell, CalendarCheck2, House, Search, Tag, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/search", label: "Search", icon: Search },
  { href: "/offers", label: "Deals", icon: Tag },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck2 },
  { href: "/account", label: "Profile", icon: UserRound },
];

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link href={item.href} key={item.href} className={cn(active && "active")}>
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
