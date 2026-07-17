import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";

import { loginAdmin } from "@/app/admin/login/actions";
import { isAdminPasswordConfigured } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next?.startsWith("/admin") ? params.next : "/admin";
  const isConfigured = isAdminPasswordConfigured();

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 py-10 text-[var(--navy)]">
      <div className="w-full max-w-[440px] rounded-[28px] border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_rgba(9,32,77,0.12)]">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(11,47,116,0.08)] text-[var(--navy)]">
          <LockKeyhole className="h-7 w-7" />
        </div>

        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--muted)]">
          Admin Access
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.03em]">
          Sign in to Nearu
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
          Use the local admin credentials configured in environment variables.
        </p>

        {!isConfigured ? (
          <div className="mt-5 rounded-2xl border border-[#ffd8d8] bg-[#fff4f4] px-4 py-3 text-sm font-bold text-[#b42323]">
            Set ADMIN_PASSWORD before signing in.
          </div>
        ) : null}

        {params.message ? (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
              params.status === "error"
                ? "border-[#ffd8d8] bg-[#fff4f4] text-[#b42323]"
                : "border-[#ccebd6] bg-[#effaf2] text-[#1f7a35]"
            }`}
          >
            {params.message}
          </div>
        ) : null}

        <form action={loginAdmin} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              Username
            </span>
            <input
              name="username"
              autoComplete="username"
              defaultValue="admin"
              required
              className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-sm font-semibold text-[var(--navy)] outline-none transition focus:border-[var(--gold)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              Password
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-sm font-semibold text-[var(--navy)] outline-none transition focus:border-[var(--gold)]"
            />
          </label>
          <button
            type="submit"
            disabled={!isConfigured}
            className="w-full rounded-2xl bg-[var(--gold)] px-5 py-4 text-sm font-black text-[var(--navy)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
