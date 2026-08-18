"use client";

import {
  Activity,
  BadgeIndianRupee,
  Bell,
  Boxes,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PackageCheck,
  Settings,
  ShieldCheck,
  Star,
  Store,
  TicketCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import { displayNameFor } from "@/lib/auth-types";

const businessNav = [
  { label: "Overview", href: "/business/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/business/leads", icon: Zap },
  { label: "Enquiries", href: "/business/enquiries", icon: MessageSquareText },
  { label: "Products", href: "/business/products", icon: PackageCheck },
  { label: "Services", href: "/business/services", icon: BriefcaseBusiness },
  { label: "Jobs", href: "/business/jobs", icon: BriefcaseBusiness },
  { label: "Business Club", href: "/business/club", icon: Users },
  { label: "Bookings", href: "/business/bookings", icon: ClipboardCheck },
  { label: "Orders", href: "/business/orders", icon: ClipboardCheck },
  { label: "Deliveries", href: "/business/deliveries", icon: PackageCheck },
  { label: "Messages", href: "/business/messages", icon: MessageSquareText },
  { label: "Reviews", href: "/business/reviews", icon: Star },
  { label: "Offers", href: "/business/offers", icon: TicketCheck },
  { label: "Subscription", href: "/business/subscription", icon: CreditCard },
  { label: "Payments", href: "/business/payments", icon: BadgeIndianRupee },
  { label: "Team", href: "/business/team", icon: Users },
  { label: "Notifications", href: "/business/notifications", icon: Bell },
  { label: "Analytics", href: "/business/analytics", icon: ChartNoAxesCombined },
];

const merchantSprintNav = [
  { label: "Dashboard", href: "/merchant/dashboard", icon: LayoutDashboard },
  { label: "My listings", href: "/merchant/listings", icon: Store },
  { label: "Offers", href: "/merchant/offers", icon: TicketCheck },
  { label: "Leads & enquiries", href: "/merchant/enquiries", icon: MessageSquareText },
  { label: "Subscription", href: "/merchant/subscription", icon: CreditCard },
  { label: "Merchant profile", href: "/merchant/profile", icon: Store },
];

const adminNav = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Merchants", href: "/admin/merchants", icon: Store },
  { label: "Listings", href: "/admin/listings", icon: Store },
  { label: "Businesses", href: "/admin/businesses", icon: Store },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Verification", href: "/admin/verification", icon: FileCheck2 },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Leads", href: "/admin/leads", icon: Zap },
  { label: "Conversations", href: "/admin/conversations", icon: MessageSquareText },
  { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquareText },
  { label: "Categories", href: "/admin/categories", icon: Boxes },
  { label: "Subcategories", href: "/admin/subcategories", icon: Boxes },
  { label: "Products", href: "/admin/products", icon: PackageCheck },
  { label: "Services", href: "/admin/services", icon: BriefcaseBusiness },
  { label: "Plans", href: "/admin/plans", icon: CreditCard },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Payments", href: "/admin/payments", icon: BadgeIndianRupee },
  { label: "Refunds", href: "/admin/refunds", icon: BadgeIndianRupee },
  { label: "Orders", href: "/admin/orders", icon: ClipboardCheck },
  { label: "Offers", href: "/admin/offers", icon: TicketCheck },
  { label: "Advertisements", href: "/admin/advertisements", icon: ChartNoAxesCombined },
  { label: "Weekly draw", href: "/admin/weekly-draw", icon: TicketCheck },
  { label: "Business Club", href: "/admin/business-club", icon: Users },
  { label: "Locations", href: "/admin/locations", icon: House },
  { label: "Reports", href: "/admin/reports", icon: ShieldCheck },
  { label: "Support", href: "/admin/support", icon: CircleHelp },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Localization", href: "/admin/translations", icon: FileCheck2 },
  { label: "Search analytics", href: "/admin/search-analytics", icon: ChartNoAxesCombined },
  { label: "Ranking", href: "/admin/ranking", icon: ChartNoAxesCombined },
  { label: "Content", href: "/admin/content", icon: FileCheck2 },
  { label: "Audit log", href: "/admin/audit-log", icon: ShieldCheck },
  { label: "System", href: "/admin/system", icon: Activity },
];

export function DashboardShell({
  mode,
  children,
  user,
}: {
  mode: "business" | "admin";
  children: ReactNode;
  user?: BncSessionUser;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const merchantRoute = mode === "business" && pathname.startsWith("/merchant");
  const nav = mode === "business" ? (merchantRoute ? merchantSprintNav : businessNav) : adminNav;
  const userName = user ? displayNameFor(user) : "Authenticated user";
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <div className={cn("dashboard-shell", `${mode}-dashboard-shell`)}>
      <aside className={cn("dashboard-sidebar", mobileOpen && "open")}>
        <div className="dashboard-sidebar-top">
          <Brand />
          <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>
        <div className="dashboard-context">
          <span className={mode === "admin" ? "admin-context-icon" : ""}>
            {mode === "business" ? <Store size={19} /> : <ShieldCheck size={19} />}
          </span>
          <div>
            <small>{mode === "business" ? "Business workspace" : "Administration"}</small>
            <strong>{mode === "business" ? "Business account" : "Platform operations"}</strong>
          </div>
          <ChevronDown size={15} />
        </div>
        <nav aria-label={`${mode} dashboard navigation`}>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link href={item.href} key={item.href} className={cn(active && "active")}>
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="dashboard-sidebar-bottom">
          <Link href={mode === "business" ? (merchantRoute ? "/merchant/profile" : "/business/settings") : "/admin/settings"}><Settings size={17} /> Settings</Link>
          <Link href="/help"><CircleHelp size={17} /> Help &amp; support</Link>
          <Link href="/"><House size={17} /> Back to BNC</Link>
          <form action={appPath("/api/session/logout")} method="post">
            <button type="submit"><LogOut size={17} /> Sign out</button>
          </form>
        </div>
      </aside>
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <button type="button" className="dashboard-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <span className="dashboard-preview-label">Backend workspace</span>
          </div>
          <div className="dashboard-header-actions">
            <Link href={mode === "business" ? "/business/notifications" : "/admin/notifications"} aria-label="Notifications"><Bell size={18} /><i /></Link>
            <div className="dashboard-user">
              <span>{userInitials}</span>
              <div><strong>{userName}</strong><small>{mode === "business" ? user?.businesses[0]?.accessRole ?? "Business workspace" : user?.roles.join(", ") ?? "Administrator"}</small></div>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>
        <main className="dashboard-main">
          <nav className="dashboard-breadcrumb" aria-label="Breadcrumb">
            <Link href={mode === "admin" ? "/admin/dashboard" : merchantRoute ? "/merchant/dashboard" : "/business/dashboard"}>
              {mode === "admin" ? "Admin" : "Merchant"}
            </Link>
            {pathname.split("/").filter(Boolean).slice(1).map((part, index, parts) => (
              <span key={`${part}-${index}`}>/ {index === parts.length - 1 ? part.replaceAll("-", " ") : <Link href={`/${pathname.split("/").filter(Boolean).slice(0, index + 2).join("/")}`}>{part.replaceAll("-", " ")}</Link>}</span>
            ))}
          </nav>
          {children}
        </main>
      </div>
      {mobileOpen && <button className="dashboard-backdrop" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    </div>
  );
}
