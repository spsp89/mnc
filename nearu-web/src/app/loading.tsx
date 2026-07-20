import { Search, Store } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[radial-gradient(circle_at_15%_20%,#164caa,#082d75_44%,#061f55_100%)] px-4 py-8 text-white sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1800px]">
          <div className="h-8 w-32 rounded-full bg-white/12" />
          <div className="mt-10 max-w-[720px]">
            <div className="h-12 w-11/12 rounded-2xl bg-white/14 sm:h-20" />
            <div className="mt-4 h-5 w-3/4 rounded-full bg-white/12" />
            <div className="mt-8 flex max-w-[860px] items-center rounded-[17px] bg-white p-2 shadow-[0_18px_36px_rgba(0,0,0,0.28)]">
              <Search className="ml-3 h-6 w-6 text-[#8ea0bd]" />
              <div className="mx-5 h-4 flex-1 rounded-full bg-[#e9eef7]" />
              <div className="h-12 w-28 rounded-[14px] bg-[#f5b625]" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1800px] px-4 py-6 sm:px-5 md:px-10">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-[#0b2f74]" />
          <div className="h-6 w-48 rounded-full bg-[#e8edf6]" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-28 rounded-[16px] border border-[#dfe6f2] bg-white shadow-[0_10px_24px_rgba(11,47,116,0.05)]" />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 rounded-[13px] border border-[#dfe6f2] bg-white shadow-[0_12px_25px_rgba(11,47,116,0.06)]" />
          ))}
        </div>
      </section>
    </main>
  );
}
