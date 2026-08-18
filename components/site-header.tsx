"use client";

import {
  Bell,
  Bookmark,
  ChevronDown,
  CircleUserRound,
  MapPin,
  Menu,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/businesses", label: "Businesses" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/offers", label: "Offers" },
  { href: "/jobs", label: "Jobs" },
  { href: "/bookings", label: "Bookings" },
  { href: "/#business-club", label: "Business Club" },
];

export function SiteHeader({
  variant = "default",
}: {
  variant?: "default" | "immersive";
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useState("Kochi");
  const [locationOpen, setLocationOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";
  const isImmersive = variant === "immersive";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={cn(
        "site-header",
        isHome && "home-site-header",
        isImmersive && "immersive-site-header",
        scrolled && "is-scrolled",
      )}>
        <div className="header-inner">
          <Brand
            href="/"
            homeLabel="BNC home"
          />
          <button
            className="location-trigger"
            type="button"
            aria-expanded={locationOpen}
            onClick={() => setLocationOpen((value) => !value)}
          >
            <span className="location-icon">
              <MapPin size={17} />
            </span>
            <span>
              <small>Current location</small>
              <strong>{location}</strong>
            </span>
            <ChevronDown size={15} />
          </button>

          <form className="header-global-search" action="/search" role="search">
            <Search size={16} aria-hidden="true" />
            <label className="sr-only" htmlFor="header-search">Search BNC</label>
            <input
              id="header-search"
              name="q"
              placeholder="Business, service, product…"
            />
            <input type="hidden" name="location" value={location} />
          </form>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className={cn(pathname === item.href && "active")}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link className="icon-button mobile-header-search" href="/search" aria-label="Search">
              <Search size={19} />
            </Link>
            <Link className="icon-button saved-header-button" href="/saved" aria-label="Saved businesses">
              <Bookmark size={19} />
            </Link>
            <button
              className="icon-button notification-button"
              type="button"
              aria-label="Notifications"
              aria-expanded={notificationOpen}
              onClick={() => setNotificationOpen((value) => !value)}
            >
              <Bell size={19} />
            </button>
            <Link className="account-button" href="/login">
              <CircleUserRound size={19} />
              <span>Login</span>
            </Link>
            <Link className="header-list-business" href="/business/add">
              <span>List your business</span>
            </Link>
            <button
              className="mobile-menu-button"
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {locationOpen && (
          <div className="location-popover" role="dialog" aria-label="Choose location">
            <strong>Choose your location</strong>
            <p>We use this to show nearby businesses and accurate distances.</p>
            <div className="location-search">
              <Search size={17} />
              <input
                aria-label="Search location"
                placeholder="Search city or locality"
              />
            </div>
            <div className="location-options">
              {["Kochi", "Kozhikode", "Thrissur", "Thiruvananthapuram"].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setLocation(city);
                    setLocationOpen(false);
                  }}
                >
                  <MapPin size={16} />
                  {city}
                  {city === location && <span>Selected</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {mobileOpen && (
          <nav className="mobile-menu" aria-label="Mobile primary navigation">
            {navItems.map((item) => (
              <Link href={item.href} key={item.href} onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link className="mobile-list-business" href="/business/add" onClick={() => setMobileOpen(false)}>
              List your business
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)}>Business plans</Link>
            <Link href="/help" onClick={() => setMobileOpen(false)}>Help centre</Link>
          </nav>
        )}

        {notificationOpen && (
          <div className="header-notification-panel" role="dialog" aria-label="Recent notifications">
            <div><strong>Notifications</strong><button type="button" onClick={() => setNotificationOpen(false)} aria-label="Close notifications"><X size={17} /></button></div>
            <div className="header-notification-empty"><Bell size={18} /><div><strong>No notifications yet</strong><small>Backend-delivered updates will appear here.</small></div></div>
            <Link className="header-view-notifications" href="/notifications">View all notifications</Link>
          </div>
        )}
      </header>
    </>
  );
}
