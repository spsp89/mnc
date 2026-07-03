import type { ReactNode } from "react";

import { FolderKanban, LayoutGrid, Plus, Star, Store, TrendingUp } from "lucide-react";

import { createBusiness, createCategory } from "@/app/admin/actions";
import { getAdminData } from "@/lib/catalog";

const iconChoices = [
  "shopping-cart",
  "utensils-crossed",
  "scissors",
  "sparkles",
  "monitor-smartphone",
  "house-plus",
  "layout-grid",
];

const coverChoices = ["plate", "suit", "basket", "salon", "shelf", "phone", "worker"];

export default async function AdminPage() {
  const { categories, businesses } = await getAdminData();
  const featuredCount = businesses.filter((business) => business.isFeatured).length;
  const popularCount = businesses.filter((business) => business.isPopular).length;

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-[var(--navy)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 rounded-[28px] bg-[linear-gradient(135deg,#081e53,#0c2b6d,#153f8d)] px-6 py-7 text-white shadow-[0_20px_40px_rgba(3,25,75,0.24)]">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-white/70">
            Next.js Admin Panel
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">
            Nearu Control Center
          </h1>
          <p className="mt-3 max-w-[720px] text-white/82">
            Manage categories, featured listings, and storefront data from the same
            SQLite database used by the public website.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            icon={<LayoutGrid className="h-6 w-6" />}
            label="Categories"
            value={String(categories.length)}
          />
          <AdminStatCard
            icon={<Store className="h-6 w-6" />}
            label="Businesses"
            value={String(businesses.length)}
          />
          <AdminStatCard
            icon={<Star className="h-6 w-6" />}
            label="Featured"
            value={String(featuredCount)}
          />
          <AdminStatCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="Popular"
            value={String(popularCount)}
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef3fb] text-[var(--navy)]">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Add Category</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Update the home screen category rail
                  </p>
                </div>
              </div>
              <form action={createCategory} className="space-y-4">
                <AdminInput name="name" placeholder="Category name" />
                <AdminInput name="slug" placeholder="category-slug" />
                <div className="grid grid-cols-2 gap-4">
                  <AdminSelect
                    name="icon"
                    defaultValue="layout-grid"
                    options={iconChoices}
                  />
                  <AdminInput name="accent" placeholder="#7183A6" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="sortOrder" type="number" placeholder="Sort order" />
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      name="isActive"
                      className="h-4 w-4 accent-[var(--navy)]"
                    />
                    Mark active
                  </label>
                </div>
                <button className="w-full rounded-2xl bg-[var(--navy)] px-5 py-4 font-bold text-white">
                  Save Category
                </button>
              </form>
            </section>

            <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff4d8] text-[#b87400]">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Add Listing</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Create featured or popular businesses
                  </p>
                </div>
              </div>
              <form action={createBusiness} className="space-y-4">
                <AdminInput name="name" placeholder="Business name" />
                <AdminInput name="slug" placeholder="business-slug" />
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="subtitle" placeholder="Subtitle" />
                  <AdminInput name="area" placeholder="Area" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput
                    name="city"
                    placeholder="City"
                    defaultValue="Kozhikode"
                  />
                  <AdminSelect
                    name="categoryId"
                    defaultValue={categories[0]?.id}
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <AdminInput name="rating" type="number" step="0.1" placeholder="4.6" />
                  <AdminInput name="reviewCount" type="number" placeholder="98" />
                  <AdminInput name="distanceKm" type="number" step="0.1" placeholder="1.2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="badgeText" placeholder="20% OFF" />
                  <AdminInput name="badgeColor" placeholder="#2961F0" />
                </div>
                <AdminSelect
                  name="coverVariant"
                  defaultValue="plate"
                  options={coverChoices}
                />
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      className="h-4 w-4 accent-[var(--navy)]"
                    />
                    Featured card
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      name="isPopular"
                      className="h-4 w-4 accent-[var(--navy)]"
                    />
                    Popular card
                  </label>
                </div>
                <button className="w-full rounded-2xl bg-[var(--gold)] px-5 py-4 font-bold text-[var(--navy)]">
                  Save Business
                </button>
              </form>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)]">
              <h2 className="text-xl font-black">Category Overview</h2>
              <div className="mt-4 overflow-hidden rounded-[22px] border border-[var(--line)]">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#f7f9fc] text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3">Businesses</th>
                      <th className="px-4 py-3">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="border-t border-[var(--line)] text-sm"
                      >
                        <td className="px-4 py-4 font-bold text-[var(--navy)]">
                          {category.name}
                        </td>
                        <td className="px-4 py-4 text-[var(--muted)]">
                          {category.slug}
                        </td>
                        <td className="px-4 py-4 text-[var(--muted)]">
                          {category._count.businesses}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              category.isActive
                                ? "bg-[#ecf6ef] text-[#1f7a35]"
                                : "bg-[#eef2f9] text-[#7384a4]"
                            }`}
                          >
                            {category.isActive ? "Active" : "Idle"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)]">
              <h2 className="text-xl font-black">Latest Businesses</h2>
              <div className="mt-4 space-y-4">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="flex flex-wrap items-center gap-4 rounded-[20px] border border-[var(--line)] px-4 py-4"
                  >
                    <div className="h-16 w-20 overflow-hidden rounded-[18px] bg-[#edf2f8]">
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${business.imageUrl})` }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-[var(--navy)]">{business.name}</div>
                      <div className="mt-1 text-sm text-[var(--muted)]">
                        {business.subtitle} / {business.area}, {business.city}
                      </div>
                    </div>
                    <div className="rounded-full bg-[#f4f7fc] px-4 py-2 text-sm font-bold text-[var(--navy)]">
                      {business.category.name}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#fff7dd] px-4 py-2 text-sm font-bold text-[#9d6b00]">
                      <Star className="h-4 w-4 fill-current" />
                      {business.rating.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-white px-5 py-5 shadow-[0_12px_24px_rgba(9,32,77,0.05)]">
      <div className="flex items-center justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f2f6fc] text-[var(--navy)]">
          {icon}
        </div>
        <span className="text-3xl font-black text-[var(--navy)]">{value}</span>
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}

function AdminInput({
  name,
  placeholder,
  type = "text",
  defaultValue,
  step,
}: {
  name: string;
  placeholder: string;
  type?: string;
  defaultValue?: string;
  step?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      step={step}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-sm font-medium text-[var(--navy)] outline-none transition focus:border-[var(--gold)]"
    />
  );
}

function AdminSelect({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue?: string;
  options: Array<string | { value: string; label: string }>;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-sm font-medium text-[var(--navy)] outline-none transition focus:border-[var(--gold)]"
    >
      {options.map((option) => {
        if (typeof option === "string") {
          return (
            <option key={option} value={option}>
              {option}
            </option>
          );
        }

        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        );
      })}
    </select>
  );
}
