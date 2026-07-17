"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Discover", href: "/#discover", section: "discover" },
  { label: "Deals", href: "/deals", section: "deals" },
  { label: "Offers", href: "/offers", section: "offers" },
  { label: "Featured", href: "/featured-shops", section: "featured-shops" },
  { label: "Business Card", href: "/business-card", section: "business-card" },
  { label: "B2B", href: "/b2b", section: "b2b" },
  { label: "Jobs", href: "/jobs", section: "jobs" },
  { label: "Winner", href: "/winner", section: "winner" },
  { label: "Feed", href: "/feed", section: "feed" },
  { label: "Plans", href: "/plans", section: "plans" },
  { label: "Dashboard", href: "/dashboard", section: "dashboard" },
  { label: "Admin", href: "/admin", section: "admin" },
  { label: "Help", href: "/help", section: "help" },
];

export function TopNav() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("discover");

  useEffect(() => {
    const syncFromHash = () => {
      const nextSection = window.location.hash.replace("#", "");
      setActiveSection(nextSection || "discover");
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [pathname]);

  return (
    <nav className="ml-auto hidden h-full items-center gap-7 lg:flex">
      {navItems.map((item) => {
        const isActive =
          item.href === "/#discover"
            ? pathname === "/" && activeSection === item.section
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <a
            key={item.label}
            href={item.href}
            onClick={() => setActiveSection(item.section)}
            className={`relative flex h-full items-center text-[13px] font-black ${
              isActive ? "text-[#f5b625]" : "text-white/92"
            }`}
          >
            {item.label}
            {isActive ? <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[#f5b625]" /> : null}
          </a>
        );
      })}
    </nav>
  );
}
