import Link from "next/link";
import { Bell, ChevronDown, Menu, MapPin, Store } from "lucide-react";

import { TopNav } from "./top-nav";

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-[#061f55] text-white">
      <div className="mx-auto flex h-[60px] max-w-[1800px] items-center gap-3 px-4 md:h-[72px] md:gap-5 md:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-[26px] font-black leading-none md:text-[34px]">
          <MapPin className="h-7 w-7 fill-[#f5b625] text-[#f5b625] md:h-9 md:w-9" />
          <span>BNC</span>
        </Link>
        <div className="hidden items-center gap-2 rounded-full border border-white/16 bg-white/6 px-4 py-2.5 text-[13px] font-bold text-white/84 md:flex">
          <MapPin className="h-4 w-4" />
          Nearu
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/16 bg-white/6 px-4 py-2.5 text-[13px] font-bold text-white/84 lg:flex">
          <MapPin className="h-4 w-4" />
          Kozhikode, Kerala
          <ChevronDown className="h-4 w-4" />
        </div>
        <TopNav />
        <details className="relative ml-auto lg:hidden">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-white/14 text-white md:h-11 md:w-11">
            <Menu className="h-5 w-5" />
          </summary>
          <div className="absolute right-0 top-12 z-30 w-[min(86vw,340px)] rounded-[16px] border border-white/14 bg-[#061f55] p-3 shadow-[0_22px_50px_rgba(0,0,0,0.32)]">
            <div className="grid gap-1">
              {[
                ["Discover", "/#discover"],
                ["Deals", "/deals"],
                ["Offers", "/offers"],
                ["Featured Shops", "/featured-shops"],
                ["Business Card", "/business-card"],
                ["List Business", "/list-your-business"],
                ["Help", "/help"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="rounded-[12px] px-3 py-2.5 text-[13px] font-black text-white/90 hover:bg-white/10">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </details>
        <button className="relative grid h-10 w-10 place-items-center rounded-full border border-white/14 text-white md:h-11 md:w-11 lg:ml-0">
          <Bell className="h-5 w-5" />
        </button>
        <Link href="/list-your-business" className="hidden items-center gap-3 rounded-full border border-white/14 bg-white/8 px-3 py-2 text-white sm:flex">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f5b625] text-[#061f55]">
            <Store className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-[13px] font-black">List business</div>
            <div className="text-[12px] font-semibold text-white/72">Get discovered</div>
          </div>
        </Link>
      </div>
    </header>
  );
}
