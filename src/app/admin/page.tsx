import type { ReactNode } from "react";
import type { Metadata } from "next";

import { FolderKanban, LayoutGrid, MessageSquareText, Plus, Star, Store, TrendingUp } from "lucide-react";

import { AdminDeleteButton, AdminSubmitButton } from "@/app/admin/admin-controls";
import {
  createDeal,
  createOffer,
  approveReview,
  createBusiness,
  createCategory,
  deleteCategory,
  deleteDeal,
  deleteBusiness,
  deleteOffer,
  deleteReview,
  rejectReview,
  toggleBusinessFeatured,
  toggleBusinessPopular,
  toggleCategoryActive,
  toggleReviewFeatured,
  updateBusiness,
  updateCategory,
  updateDeal,
  updateOffer,
} from "@/app/admin/actions";
import { logoutAdmin } from "@/app/admin/login/actions";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminData } from "@/lib/catalog";

const iconChoices = [
  "shopping-cart",
  "utensils-crossed",
  "scissors",
  "sparkles",
  "monitor-smartphone",
  "house-plus",
  "stethoscope",
  "layout-grid",
];

const coverChoices = ["plate", "suit", "basket", "salon", "shelf", "phone", "worker"];

type AdminBusiness = Awaited<ReturnType<typeof getAdminData>>["businesses"][number];
type AdminDeal = Awaited<ReturnType<typeof getAdminData>>["deals"][number];
type AdminOffer = Awaited<ReturnType<typeof getAdminData>>["offers"][number];
type AdminReview = Awaited<ReturnType<typeof getAdminData>>["reviews"][number];
type AdminAnalytics = Awaited<ReturnType<typeof getAdminData>>["analytics"];
type AdminAnalyticsEvent = AdminAnalytics["recentEvents"][number];

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    reviewStatus?: string;
    reviewQuery?: string;
    analyticsType?: string;
    analyticsBusiness?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdminSession();

  const notice = await searchParams;
  const { categories, businesses, deals, offers, reviews, analytics } = await getAdminData();
  const reviewStatusFilter = notice.reviewStatus === "approved" || notice.reviewStatus === "rejected" || notice.reviewStatus === "pending"
    ? notice.reviewStatus
    : "all";
  const reviewQuery = notice.reviewQuery?.trim() ?? "";
  const filteredReviews = reviews.filter((review) => {
    const statusMatch = reviewStatusFilter === "all" || review.status === reviewStatusFilter;
    const query = reviewQuery.toLowerCase();
    const queryMatch = !query || [
      review.customer.name,
      review.customer.email,
      review.customer.phone,
      review.business.name,
      review.business.slug,
      review.text,
    ].some((value) => value.toLowerCase().includes(query));

    return statusMatch && queryMatch;
  });
  const featuredCount = businesses.filter((business) => business.flags.featured).length;
  const popularCount = businesses.filter((business) => business.flags.popular).length;
  const pendingReviewCount = reviews.filter((review) => review.status === "pending").length;
  const analyticsTypeFilter = analyticsEventLabel(notice.analyticsType ?? "") ? notice.analyticsType ?? "all" : "all";
  const analyticsBusinessFilter = notice.analyticsBusiness?.trim().toLowerCase() ?? "";
  const filteredAnalyticsEvents = analytics.recentEvents.filter((event) => {
    const typeMatch = analyticsTypeFilter === "all" || event.eventType === analyticsTypeFilter;
    const businessMatch = !analyticsBusinessFilter || event.business.slug.includes(analyticsBusinessFilter) || event.business.name.toLowerCase().includes(analyticsBusinessFilter);
    return typeMatch && businessMatch;
  });

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--navy)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 rounded-[28px] bg-[linear-gradient(135deg,#041c55,#0b2f74,#1c4ea1)] px-6 py-7 text-white shadow-[0_20px_40px_rgba(4,28,85,0.24)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
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
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/16"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {notice.message ? (
          <div
            className={`mb-6 rounded-[18px] border px-5 py-4 text-sm font-bold ${
              notice.status === "error"
                ? "border-[#ffd8d8] bg-[#fff4f4] text-[#b42323]"
                : "border-[#ccebd6] bg-[#effaf2] text-[#1f7a35]"
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          <AdminStatCard
            icon={<MessageSquareText className="h-6 w-6" />}
            label="Pending Reviews"
            value={String(pendingReviewCount)}
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgba(11,47,116,0.08)] text-[var(--navy)]">
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
                <AdminInput name="name" placeholder="Category name" required maxLength={80} />
                <AdminInput
                  name="slug"
                  placeholder="category-slug"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Use lowercase letters, numbers, and hyphens."
                  help="Leave blank only when the name should generate the slug."
                />
                <div className="grid grid-cols-2 gap-4">
                  <AdminSelect
                    name="icon"
                    defaultValue="layout-grid"
                    options={iconChoices}
                  />
                  <AdminInput name="accent" placeholder="#7183A6" pattern="#[0-9A-Fa-f]{6}" title="Use a hex color like #7183A6." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="sortOrder" type="number" placeholder="Sort order" min="0" max="999" />
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      name="isActive"
                      className="h-4 w-4 accent-[var(--navy)]"
                    />
                    Mark active
                  </label>
                </div>
                <AdminSubmitButton className="w-full rounded-2xl bg-[var(--navy)] px-5 py-4 font-bold text-white disabled:cursor-wait disabled:opacity-70">
                  Save Category
                </AdminSubmitButton>
              </form>
            </section>

            <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgba(244,178,39,0.16)] text-[var(--gold-deep)]">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Add Listing</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Create featured or popular businesses
                  </p>
                </div>
              </div>
              <form action={createBusiness} encType="multipart/form-data" className="space-y-4">
                <FormGroup title="Basics">
                <AdminInput name="name" placeholder="Business name" required maxLength={120} />
                <AdminInput
                  name="slug"
                  placeholder="business-slug"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Use lowercase letters, numbers, and hyphens."
                  help="Creating with an existing slug updates that listing."
                />
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="subtitle" placeholder="Subtitle" required maxLength={120} />
                  <AdminInput name="area" placeholder="Area" required maxLength={80} />
                </div>
                <AdminInput name="description" placeholder="Short description" maxLength={500} />
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput
                    name="city"
                    placeholder="City"
                    defaultValue="Kozhikode"
                    required
                    maxLength={80}
                  />
                  <AdminSelect
                    name="categoryId"
                    defaultValue={categories[0]?.id}
                    required
                    help="Assigns where the listing appears on category pages."
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                  />
                </div>
                </FormGroup>

                <FormGroup title="Location and contact">
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="addressLine" placeholder="Address line" maxLength={160} />
                  <AdminInput name="landmark" placeholder="Landmark" maxLength={120} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="phone" placeholder="Phone" />
                  <AdminInput name="whatsapp" placeholder="WhatsApp" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="email" type="email" placeholder="Email" />
                  <AdminInput name="website" placeholder="Website" type="url" help="Use http:// or https://." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="upiId" placeholder="UPI ID, e.g. shopname@upi" maxLength={80} />
                  <AdminInput name="openingHours" placeholder="Opening hours" maxLength={140} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="latitude" type="number" step="0.000001" placeholder="Latitude" min="-90" max="90" />
                  <AdminInput name="longitude" type="number" step="0.000001" placeholder="Longitude" min="-180" max="180" />
                </div>
                </FormGroup>

                <FormGroup title="Marketplace signals">
                <div className="grid grid-cols-3 gap-4">
                  <AdminInput name="rating" type="number" step="0.1" min="0" max="5" placeholder="4.6" />
                  <AdminInput name="reviewCount" type="number" min="0" placeholder="98" />
                  <AdminInput name="distanceKm" type="number" step="0.1" min="0" placeholder="1.2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput name="badgeText" placeholder="20% OFF" />
                  <AdminInput name="badgeColor" placeholder="#2961F0" pattern="#[0-9A-Fa-f]{6}" title="Use a hex color like #2961F0." />
                </div>
                <AdminSelect
                  name="coverVariant"
                  defaultValue="plate"
                  options={coverChoices}
                />
                <AdminInput
                  name="imageUrl"
                  placeholder="Cover image URL or /uploads path"
                  help="Paste a hosted image URL or upload a cover image below."
                />
                <AdminInput
                  name="logoUrl"
                  placeholder="Logo image URL or /uploads path"
                  help="Optional manual logo fallback when no file is uploaded."
                />
                <div className="grid gap-4 lg:grid-cols-3">
                  <AdminFileInput name="coverUpload" label="Upload cover" />
                  <AdminFileInput name="logoUpload" label="Upload logo" />
                  <AdminFileInput name="galleryUpload" label="Upload gallery" multiple />
                </div>
                <AdminTextarea
                  name="galleryUrls"
                  placeholder="Gallery image URLs, one per line"
                  help="Used on public detail pages and business cards. Keep 2-6 strong images."
                />
                <AdminInput name="tags" placeholder="Tags, comma separated" />
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      name="isVerified"
                      defaultChecked
                      className="h-4 w-4 accent-[var(--navy)]"
                    />
                    Verified
                  </label>
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
                </FormGroup>
                <AdminSubmitButton
                  className="w-full rounded-2xl bg-[var(--gold)] px-5 py-4 font-bold text-[var(--navy)] disabled:cursor-wait disabled:opacity-70"
                  disabled={categories.length === 0}
                >
                  Save Business
                </AdminSubmitButton>
              </form>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">Category Management</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Edit display metadata, status, and safe deletion rules.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {categories.length === 0 ? (
                  <AdminEmptyState
                    title="No categories yet"
                    text="Create a category before adding businesses to the catalog."
                  />
                ) : null}
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-[22px] border border-[var(--line)] p-4"
                  >
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-2xl border border-[var(--line)]"
                        style={{ backgroundColor: category.accent }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-[var(--navy)]">{category.name}</div>
                        <div className="mt-0.5 text-sm text-[var(--muted)]">
                          {category.slug} / {category._count.businesses} business{category._count.businesses === 1 ? "" : "es"}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          category.isActive
                            ? "bg-[#ecf6ef] text-[#1f7a35]"
                            : "bg-[#eef2f9] text-[#7384a4]"
                        }`}
                      >
                        {category.isActive ? "Active" : "Idle"}
                      </span>
                    </div>

                    <form action={updateCategory} className="grid gap-3 lg:grid-cols-[1fr_1fr_150px_150px_120px]">
                      <input type="hidden" name="id" value={category.id} />
                      <AdminInput name="name" placeholder="Category name" defaultValue={category.name} required maxLength={80} />
                      <AdminInput
                        name="slug"
                        placeholder="category-slug"
                        defaultValue={category.slug}
                        required
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        title="Use lowercase letters, numbers, and hyphens."
                      />
                      <AdminSelect
                        name="icon"
                        defaultValue={category.icon}
                        options={iconChoices}
                      />
                      <AdminInput name="accent" placeholder="#7183A6" defaultValue={category.accent} pattern="#[0-9A-Fa-f]{6}" title="Use a hex color like #7183A6." />
                      <AdminInput name="sortOrder" type="number" placeholder="Sort" defaultValue={String(category.sortOrder)} min="0" max="999" />
                      <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold lg:col-span-2">
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={category.isActive}
                          className="h-4 w-4 accent-[var(--navy)]"
                        />
                        Active category
                      </label>
                      <AdminSubmitButton className="rounded-2xl bg-[var(--navy)] px-5 py-3.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70 lg:col-span-3">
                        Save changes
                      </AdminSubmitButton>
                    </form>

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                      <form action={toggleCategoryActive}>
                        <input type="hidden" name="id" value={category.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(category.isActive)}
                        />
                        <AdminSubmitButton
                          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-black text-[var(--navy)] transition hover:border-[var(--gold)] disabled:cursor-wait disabled:opacity-70"
                          pendingLabel="Updating..."
                        >
                          {category.isActive ? "Set idle" : "Set active"}
                        </AdminSubmitButton>
                      </form>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={category.id} />
                        <AdminDeleteButton
                          className="rounded-full border border-[#ffd8d8] bg-[#fff4f4] px-3 py-1.5 text-xs font-black text-[#b42323] transition hover:bg-[#ffe8e8] disabled:cursor-not-allowed disabled:opacity-55"
                          disabled={category._count.businesses > 0}
                          title={category._count.businesses > 0 ? "Delete businesses or move them to another category first." : "Delete category"}
                          confirmMessage={`Delete ${category.name}? This cannot be undone.`}
                        >
                          Delete
                        </AdminDeleteButton>
                      </form>
                      {category._count.businesses > 0 ? (
                        <span className="text-xs font-semibold text-[var(--muted)]">
                          Delete is locked while businesses use this category.
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)]">
              <h2 className="text-xl font-black">Business Management</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Update listing content, category assignment, ranking signals, and public badges.
              </p>
              <div className="mt-4 space-y-4">
                {businesses.length === 0 ? (
                  <AdminEmptyState
                    title="No businesses yet"
                    text="Use the Add Listing form to create the first marketplace listing."
                  />
                ) : null}
                {businesses.map((business) => (
                  <details
                    key={business.id}
                    className="group rounded-[20px] border border-[var(--line)] px-4 py-4"
                  >
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4">
                      <div className="h-16 w-20 overflow-hidden rounded-[18px] bg-[#edf2f8]">
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${businessImageUrl(business, "thumbnail")})`,
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-[var(--navy)]">{business.name}</div>
                        <div className="mt-1 text-sm text-[var(--muted)]">
                          {business.subtitle} / {business.location.area}, {business.location.city}
                        </div>
                      </div>
                      <div className="rounded-full bg-[#f4f7fc] px-4 py-2 text-sm font-bold text-[var(--navy)]">
                        {business.category.name}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#fff7dd] px-4 py-2 text-sm font-bold text-[#9d6b00]">
                        <Star className="h-4 w-4 fill-current" />
                        {business.rating.score.toFixed(1)}
                      </div>
                      <span className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-black text-[var(--navy)]">
                        Edit
                      </span>
                    </summary>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                        <AdminActionForm
                          action={toggleBusinessFeatured}
                          id={business.id}
                          fieldName="isFeatured"
                          fieldValue={business.flags.featured}
                          label={business.flags.featured ? "Remove featured" : "Make featured"}
                        />
                        <AdminActionForm
                          action={toggleBusinessPopular}
                          id={business.id}
                          fieldName="isPopular"
                          fieldValue={business.flags.popular}
                          label={business.flags.popular ? "Remove popular" : "Make popular"}
                        />
                      <a
                        href={`/business-card/${business.slug}`}
                        className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-black text-[var(--navy)] transition hover:border-[var(--gold)]"
                      >
                        Preview card
                      </a>
                      <form action={deleteBusiness}>
                        <input type="hidden" name="id" value={business.id} />
                        <AdminDeleteButton
                          className="rounded-full border border-[#ffd8d8] bg-[#fff4f4] px-3 py-1.5 text-xs font-black text-[#b42323] transition hover:bg-[#ffe8e8] disabled:cursor-wait disabled:opacity-70"
                          confirmMessage={`Delete ${business.name}? This cannot be undone.`}
                        >
                          Delete
                        </AdminDeleteButton>
                      </form>
                    </div>

                    <form action={updateBusiness} encType="multipart/form-data" className="mt-4 space-y-4 border-t border-[var(--line)] pt-4">
                      <input type="hidden" name="id" value={business.id} />
                      <FormGroup title="Basics">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <AdminInput name="name" placeholder="Business name" defaultValue={business.name} required maxLength={120} />
                          <AdminInput
                            name="slug"
                            placeholder="business-slug"
                            defaultValue={business.slug}
                            required
                            pattern="[a-z0-9]+(-[a-z0-9]+)*"
                            title="Use lowercase letters, numbers, and hyphens."
                          />
                          <AdminInput name="subtitle" placeholder="Subtitle" defaultValue={business.subtitle} required maxLength={120} />
                          <AdminInput name="area" placeholder="Area" defaultValue={business.location.area} required maxLength={80} />
                          <AdminInput name="description" placeholder="Short description" defaultValue={business.description} maxLength={500} />
                          <AdminInput name="city" placeholder="City" defaultValue={business.location.city} required maxLength={80} />
                          <AdminSelect
                            name="categoryId"
                            defaultValue={business.category.id}
                            required
                            options={categories.map((category) => ({
                              value: category.id,
                              label: category.name,
                            }))}
                          />
                          <AdminSelect
                            name="coverVariant"
                            defaultValue={businessImageVariant(business, "cover")}
                            options={coverChoices}
                          />
                        </div>
                      </FormGroup>
                      <FormGroup title="Location and contact">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <AdminInput name="addressLine" placeholder="Address line" defaultValue={business.location.addressLine} maxLength={160} />
                          <AdminInput name="landmark" placeholder="Landmark" defaultValue={business.location.landmark} maxLength={120} />
                          <AdminInput name="phone" placeholder="Phone" defaultValue={business.contact.phone} />
                          <AdminInput name="whatsapp" placeholder="WhatsApp" defaultValue={business.contact.whatsapp} />
                          <AdminInput name="email" type="email" placeholder="Email" defaultValue={business.contact.email} />
                          <AdminInput name="website" type="url" placeholder="Website" defaultValue={business.contact.website} />
                          <AdminInput name="upiId" placeholder="UPI ID" defaultValue={business.payment.upiId} maxLength={80} />
                          <AdminInput name="openingHours" placeholder="Opening hours" defaultValue={business.hours} maxLength={140} />
                          <AdminInput name="latitude" type="number" step="0.000001" min="-90" max="90" placeholder="Latitude" defaultValue={business.location.latitude === null ? undefined : String(business.location.latitude)} />
                          <AdminInput name="longitude" type="number" step="0.000001" min="-180" max="180" placeholder="Longitude" defaultValue={business.location.longitude === null ? undefined : String(business.location.longitude)} />
                        </div>
                      </FormGroup>
                      <FormGroup title="Marketplace signals">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <AdminInput name="rating" type="number" step="0.1" min="0" max="5" placeholder="4.6" defaultValue={String(business.rating.score)} />
                          <AdminInput name="reviewCount" type="number" min="0" placeholder="98" defaultValue={String(business.rating.reviewCount)} />
                          <AdminInput name="distanceKm" type="number" step="0.1" min="0" placeholder="1.2" defaultValue={String(business.location.distanceKm)} />
                          <AdminInput name="badgeText" placeholder="20% OFF" defaultValue={business.badge.text ?? undefined} />
                          <AdminInput name="badgeColor" placeholder="#2961F0" defaultValue={business.badge.color ?? undefined} pattern="#[0-9A-Fa-f]{6}" title="Use a hex color like #2961F0." />
                          <AdminInput
                            name="imageUrl"
                            placeholder="Cover image URL or /uploads path"
                            defaultValue={businessImageUrl(business, "cover")}
                            help="Leave blank to use the local development fallback for the selected cover variant."
                          />
                          <AdminInput
                            name="logoUrl"
                            placeholder="Logo image URL or /uploads path"
                            defaultValue={businessImageUrl(business, "logo")}
                            help="Uploaded logo appears before generated placeholders."
                          />
                          <div className="grid gap-4 lg:col-span-2 lg:grid-cols-3">
                            <AdminFileInput name="coverUpload" label="Replace cover" />
                            <AdminFileInput name="logoUpload" label="Replace logo" />
                            <AdminFileInput name="galleryUpload" label="Add gallery images" multiple />
                          </div>
                          <AdminTextarea
                            name="galleryUrls"
                            placeholder="Gallery image URLs, one per line"
                            defaultValue={business.gallery.join("\n")}
                          />
                          <AdminInput name="tags" placeholder="Tags, comma separated" defaultValue={business.tags.join(", ")} />
                        </div>
                      </FormGroup>
                      <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
                        <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
                          <input
                            type="checkbox"
                            name="isVerified"
                            defaultChecked={business.trust.verified}
                            className="h-4 w-4 accent-[var(--navy)]"
                          />
                          Verified
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
                          <input
                            type="checkbox"
                            name="isFeatured"
                            defaultChecked={business.flags.featured}
                            className="h-4 w-4 accent-[var(--navy)]"
                          />
                          Featured card
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
                          <input
                            type="checkbox"
                            name="isPopular"
                            defaultChecked={business.flags.popular}
                            className="h-4 w-4 accent-[var(--navy)]"
                          />
                          Popular card
                        </label>
                      </div>
                      <AdminSubmitButton className="w-full rounded-2xl bg-[var(--navy)] px-5 py-3.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70">
                        Save listing changes
                      </AdminSubmitButton>
                    </form>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <AnalyticsAdminSection analytics={analytics} recentEvents={filteredAnalyticsEvents} filters={{ eventType: analyticsTypeFilter, business: analyticsBusinessFilter }} businesses={businesses} />
          <ReviewAdminSection reviews={filteredReviews} allReviews={reviews} filters={{ status: reviewStatusFilter, query: reviewQuery }} />
          <PromotionAdminSection
            title="Deal Management"
            kind="deal"
            items={deals}
            createAction={createDeal}
            updateAction={updateDeal}
            deleteAction={deleteDeal}
          />
          <PromotionAdminSection
            title="Offer Management"
            kind="offer"
            items={offers}
            createAction={createOffer}
            updateAction={updateOffer}
            deleteAction={deleteOffer}
          />
        </div>
      </div>
    </div>
  );
}

function AdminActionForm({
  action,
  id,
  fieldName,
  fieldValue,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  fieldName: string;
  fieldValue: boolean;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name={fieldName} value={String(fieldValue)} />
      <AdminSubmitButton
        className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-black text-[var(--navy)] transition hover:border-[var(--gold)] disabled:cursor-wait disabled:opacity-70"
        pendingLabel="Updating..."
      >
        {label}
      </AdminSubmitButton>
    </form>
  );
}

function AnalyticsAdminSection({
  analytics,
  recentEvents,
  filters,
  businesses,
}: {
  analytics: AdminAnalytics;
  recentEvents: AdminAnalyticsEvent[];
  filters: {
    eventType: string;
    business: string;
  };
  businesses: AdminBusiness[];
}) {
  const metricCards = [
    { label: "Total events", value: analytics.total },
    { label: "Call clicks", value: analytics.byType.call_click },
    { label: "WhatsApp clicks", value: analytics.byType.whatsapp_click },
    { label: "Route clicks", value: analytics.byType.route_click },
    { label: "Card views", value: analytics.byType.business_card_view },
    { label: "UPI/payment", value: analytics.byType.upi_click + analytics.byType.payment_click },
  ];

  return (
    <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)] xl:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Analytics</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Track calls, WhatsApp clicks, routes, business card views, shares, and UPI/payment intent.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metricCards.map((metric) => (
          <div key={metric.label} className="rounded-[18px] border border-[var(--line)] bg-[#f8fbff] p-4">
            <div className="text-2xl font-black text-[var(--navy)]">{metric.value}</div>
            <div className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">{metric.label}</div>
          </div>
        ))}
      </div>

      <form className="mt-5 grid gap-3 rounded-[18px] border border-[var(--line)] bg-[#fffdf7] p-3 md:grid-cols-[220px_minmax(0,1fr)_120px]">
        <select name="analyticsType" defaultValue={filters.eventType} className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold text-[var(--navy)] outline-none">
          <option value="all">All events</option>
          {analyticsEventOptions.map((eventType) => (
            <option key={eventType} value={eventType}>
              {analyticsEventLabel(eventType)}
            </option>
          ))}
        </select>
        <input
          name="analyticsBusiness"
          defaultValue={filters.business}
          placeholder="Filter recent events by business name or slug"
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy)] outline-none"
        />
        <button className="rounded-2xl bg-[var(--navy)] px-4 py-3 text-sm font-black text-white">
          Filter
        </button>
      </form>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-[20px] border border-[var(--line)] p-4">
          <h3 className="font-black text-[var(--navy)]">Top businesses by engagement</h3>
          <div className="mt-3 space-y-3">
            {analytics.topBusinesses.length === 0 ? (
              <p className="text-sm font-semibold text-[var(--muted)]">Engagement will appear after customers interact with business actions.</p>
            ) : null}
            {analytics.topBusinesses.map((business) => (
              <div key={business.slug} className="rounded-[16px] bg-[#f8fbff] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-[var(--navy)]">{business.name}</div>
                    <div className="text-xs font-semibold text-[var(--muted)]">{business.total} total events</div>
                  </div>
                  <a href={`/business/${business.slug}`} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-black text-[var(--navy)]">
                    View
                  </a>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2 text-center text-[11px] font-black text-[var(--muted)]">
                  <span>Call {business.calls}</span>
                  <span>WA {business.whatsapps}</span>
                  <span>Route {business.routes}</span>
                  <span>Card {business.cardViews}</span>
                  <span>UPI {business.payments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--line)] p-4">
          <h3 className="font-black text-[var(--navy)]">Recent events</h3>
          <div className="mt-3 space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-sm font-semibold text-[var(--muted)]">No matching events yet.</p>
            ) : null}
            {recentEvents.map((event) => (
              <div key={event.id} className="rounded-[16px] bg-[#f8fbff] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-[var(--navy)]">{event.business.name}</div>
                    <div className="text-xs font-semibold text-[var(--muted)]">{analyticsEventLabel(event.eventType)} / {event.source}</div>
                  </div>
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    {new Date(event.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {businesses.some((business) => business.analytics.total > 0) ? (
        <div className="mt-5 rounded-[20px] border border-[var(--line)] p-4">
          <h3 className="font-black text-[var(--navy)]">Business row analytics</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {businesses.filter((business) => business.analytics.total > 0).slice(0, 9).map((business) => (
              <div key={business.slug} className="rounded-[16px] bg-[#f8fbff] p-3 text-xs font-black text-[var(--muted)]">
                <div className="truncate text-sm text-[var(--navy)]">{business.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span>Calls {business.analytics.calls}</span>
                  <span>WA {business.analytics.whatsapps}</span>
                  <span>Routes {business.analytics.routes}</span>
                  <span>Cards {business.analytics.cardViews}</span>
                  <span>UPI {business.analytics.payments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const analyticsEventOptions = [
  "call_click",
  "whatsapp_click",
  "route_click",
  "business_card_view",
  "business_card_share_click",
  "upi_click",
  "payment_click",
];

function analyticsEventLabel(eventType: string) {
  const labels: Record<string, string> = {
    call_click: "Call click",
    whatsapp_click: "WhatsApp click",
    route_click: "Route click",
    business_card_view: "Business card view",
    business_card_share_click: "Card share/open click",
    upi_click: "UPI click",
    payment_click: "Payment click",
    all: "All events",
  };

  return labels[eventType] ?? "";
}

function ReviewAdminSection({
  reviews,
  allReviews,
  filters,
}: {
  reviews: AdminReview[];
  allReviews: AdminReview[];
  filters: {
    status: string;
    query: string;
  };
}) {
  return (
    <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)] xl:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Reviews Management</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Moderate customer reviews before they appear on business pages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          {["pending", "approved", "rejected"].map((status) => (
            <span key={status} className="rounded-full bg-[#f4f7fc] px-3 py-1.5 text-[var(--navy)]">
              {status}: {allReviews.filter((review) => review.status === status).length}
            </span>
          ))}
        </div>
      </div>

      <form className="mt-5 grid gap-3 rounded-[18px] border border-[var(--line)] bg-[#f8fbff] p-3 md:grid-cols-[180px_minmax(0,1fr)_120px]">
        <select
          name="reviewStatus"
          defaultValue={filters.status}
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold text-[var(--navy)] outline-none"
        >
          <option value="all">All reviews</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          name="reviewQuery"
          defaultValue={filters.query}
          placeholder="Search business, customer, phone, email, or review text"
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy)] outline-none"
        />
        <button className="rounded-2xl bg-[var(--navy)] px-4 py-3 text-sm font-black text-white">
          Filter
        </button>
      </form>

      <div className="mt-5 space-y-4">
        {reviews.length === 0 ? (
          <AdminEmptyState
            title="No reviews yet"
            text="Customer reviews submitted from business pages will appear here for moderation."
          />
        ) : null}
        {reviews.map((review) => (
          <article key={review.id} className="rounded-[20px] border border-[var(--line)] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-[var(--navy)]">{review.customer.name}</span>
                  <span className="text-sm font-semibold text-[var(--muted)]">
                    for {review.business.name}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadgeClass(review.status)}`}>
                    {review.status}
                  </span>
                  {review.featured ? (
                    <span className="rounded-full bg-[#fff7dd] px-3 py-1 text-xs font-black text-[#9d6b00]">
                      Featured
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-[var(--muted)]">
                  <span>{review.rating} star{review.rating === 1 ? "" : "s"}</span>
                  <span>{review.business.slug}</span>
                  <span>{new Date(review.createdAt).toLocaleDateString("en-IN")}</span>
                  {review.customer.email ? <span>{review.customer.email}</span> : null}
                  {review.customer.phone ? <span>{review.customer.phone}</span> : null}
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#405474]">{review.text}</p>
              </div>
              <div className="flex flex-wrap gap-2 lg:w-[320px] lg:justify-end">
                {review.status !== "approved" ? (
                  <form action={approveReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <AdminSubmitButton className="rounded-full bg-[#ecf6ef] px-3 py-1.5 text-xs font-black text-[#1f7a35] disabled:cursor-wait disabled:opacity-70">
                      Approve
                    </AdminSubmitButton>
                  </form>
                ) : null}
                {review.status !== "rejected" ? (
                  <form action={rejectReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <AdminSubmitButton className="rounded-full bg-[#fff4f4] px-3 py-1.5 text-xs font-black text-[#b42323] disabled:cursor-wait disabled:opacity-70">
                      Reject
                    </AdminSubmitButton>
                  </form>
                ) : null}
                <form action={toggleReviewFeatured}>
                  <input type="hidden" name="id" value={review.id} />
                  <input type="hidden" name="featured" value={String(review.featured)} />
                  <AdminSubmitButton className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-black text-[var(--navy)] disabled:cursor-wait disabled:opacity-70">
                    {review.featured ? "Unfeature" : "Feature"}
                  </AdminSubmitButton>
                </form>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <AdminDeleteButton
                    className="rounded-full border border-[#ffd8d8] bg-white px-3 py-1.5 text-xs font-black text-[#b42323] disabled:cursor-wait disabled:opacity-70"
                    confirmMessage={`Delete review by ${review.customer.name}? This cannot be undone.`}
                  >
                    Delete
                  </AdminDeleteButton>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function statusBadgeClass(status: AdminReview["status"]) {
  if (status === "approved") {
    return "bg-[#ecf6ef] text-[#1f7a35]";
  }

  if (status === "rejected") {
    return "bg-[#fff4f4] text-[#b42323]";
  }

  return "bg-[#fff7dd] text-[#9d6b00]";
}

function PromotionAdminSection({
  title,
  kind,
  items,
  createAction,
  updateAction,
  deleteAction,
}: {
  title: string;
  kind: "deal" | "offer";
  items: Array<AdminDeal | AdminOffer>;
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const isOffer = kind === "offer";

  return (
    <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_14px_30px_rgba(9,32,77,0.06)]">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Create, edit, hide, and remove marketplace {isOffer ? "offers" : "deals"} from SQLite-backed content.
      </p>

      <form action={createAction} className="mt-5 space-y-4 rounded-[22px] border border-[var(--line)] p-4">
        <FormGroup title={`Add ${isOffer ? "Offer" : "Deal"}`}>
          <div className="grid gap-3 lg:grid-cols-2">
            <AdminInput name="title" placeholder="Title" required maxLength={120} />
            <AdminInput name="slug" placeholder={`${kind}-slug`} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
            <AdminInput name="shop" placeholder="Shop / business name" required maxLength={120} />
            <AdminInput name="businessSlug" placeholder="business-slug" />
            <AdminInput name="category" placeholder="Category" required maxLength={80} />
            {isOffer ? <AdminInput name="code" placeholder="Offer code" maxLength={32} /> : <AdminInput name="badge" placeholder="Badge, e.g. 20% OFF" maxLength={40} />}
            {!isOffer ? <AdminInput name="badgeColor" placeholder="#2469D6" pattern="#[0-9A-Fa-f]{6}" /> : null}
            <AdminInput name="validUntil" placeholder="Valid until" maxLength={80} />
            <AdminInput name="image" placeholder="Hero image URL or /uploads path" required />
            <AdminInput name="gradient" placeholder="linear-gradient(...)" />
            <AdminInput name="sortOrder" type="number" placeholder="Sort order" min="0" max="999" />
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
              <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-[var(--navy)]" />
              Active
            </label>
            <AdminInput name="text" placeholder="Short description" required maxLength={260} />
            <AdminTextarea
              name="items"
              placeholder={isOffer ? "Name | Text | Image | Label" : "Name | Text | Image | Price"}
              help="Add one item per line. Example: Cake | Fresh cream cake | /mockup/im-bakery.jpg | 20% off"
            />
          </div>
        </FormGroup>
        <AdminSubmitButton className="w-full rounded-2xl bg-[var(--navy)] px-5 py-3.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70">
          Save {isOffer ? "offer" : "deal"}
        </AdminSubmitButton>
      </form>

      <div className="mt-5 space-y-4">
        {items.length === 0 ? <AdminEmptyState title={`No ${kind}s yet`} text={`Create the first ${kind} for the marketplace.`} /> : null}
        {items.map((item) => (
          <details key={item.slug} className="rounded-[20px] border border-[var(--line)] px-4 py-4">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
              <div className="h-14 w-20 overflow-hidden rounded-[14px] bg-[#edf2f8]">
                <div className="h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-[var(--navy)]">{item.title}</div>
                <div className="mt-0.5 text-sm text-[var(--muted)]">{item.shop} / {item.category}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${item.isActive ? "bg-[#ecf6ef] text-[#1f7a35]" : "bg-[#eef2f9] text-[#7384a4]"}`}>
                {item.isActive ? "Active" : "Hidden"}
              </span>
            </summary>
            <form action={updateAction} className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
              <div className="grid gap-3 lg:grid-cols-2">
                <AdminInput name="title" placeholder="Title" defaultValue={item.title} required maxLength={120} />
                <AdminInput name="slug" placeholder={`${kind}-slug`} defaultValue={item.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
                <AdminInput name="shop" placeholder="Shop / business name" defaultValue={item.shop} required maxLength={120} />
                <AdminInput name="businessSlug" placeholder="business-slug" defaultValue={item.businessSlug ?? undefined} />
                <AdminInput name="category" placeholder="Category" defaultValue={item.category} required maxLength={80} />
                {isOffer ? <AdminInput name="code" placeholder="Offer code" defaultValue={(item as AdminOffer).code} maxLength={32} /> : <AdminInput name="badge" placeholder="Badge" defaultValue={(item as AdminDeal).badge} maxLength={40} />}
                {!isOffer ? <AdminInput name="badgeColor" placeholder="#2469D6" defaultValue={(item as AdminDeal).badgeColor} pattern="#[0-9A-Fa-f]{6}" /> : null}
                <AdminInput name="validUntil" placeholder="Valid until" defaultValue={item.validUntil} maxLength={80} />
                <AdminInput name="image" placeholder="Hero image URL or /uploads path" defaultValue={item.image} required />
                <AdminInput name="gradient" placeholder="linear-gradient(...)" defaultValue={item.gradient} />
                <AdminInput name="sortOrder" type="number" placeholder="Sort order" defaultValue={String(item.sortOrder)} min="0" max="999" />
                <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
                  <input type="checkbox" name="isActive" defaultChecked={item.isActive} className="h-4 w-4 accent-[var(--navy)]" />
                  Active
                </label>
                <AdminInput name="text" placeholder="Short description" defaultValue={item.text} required maxLength={260} />
                <AdminTextarea
                  name="items"
                  placeholder={isOffer ? "Name | Text | Image | Label" : "Name | Text | Image | Price"}
                  defaultValue={promotionItemsToText(item, kind)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminSubmitButton className="rounded-full bg-[var(--navy)] px-4 py-2 text-xs font-black text-white disabled:cursor-wait disabled:opacity-70">
                  Save changes
                </AdminSubmitButton>
              </div>
            </form>
            <form action={deleteAction} className="mt-3 border-t border-[var(--line)] pt-3">
              <input type="hidden" name="slug" value={item.slug} />
              <AdminDeleteButton
                className="rounded-full border border-[#ffd8d8] bg-[#fff4f4] px-3 py-1.5 text-xs font-black text-[#b42323] transition hover:bg-[#ffe8e8] disabled:cursor-wait disabled:opacity-70"
                confirmMessage={`Delete ${item.title}? This cannot be undone.`}
              >
                Delete
              </AdminDeleteButton>
            </form>
          </details>
        ))}
      </div>
    </section>
  );
}

function promotionItemsToText(item: AdminDeal | AdminOffer, kind: "deal" | "offer") {
  return item.items
    .map((entry) => {
      const label = kind === "deal" ? ("price" in entry ? entry.price ?? "" : "") : ("label" in entry ? entry.label : "");
      return [entry.name, entry.text, entry.image, label].join(" | ");
    })
    .join("\n");
}

function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-[22px] border border-[var(--line)] p-4">
      <legend className="px-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function AdminEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[var(--line)] bg-[#f8fbff] px-5 py-8 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white text-[var(--navy)] shadow-[0_8px_18px_rgba(9,32,77,0.06)]">
        <Store className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-black text-[var(--navy)]">{title}</h3>
      <p className="mx-auto mt-1 max-w-[360px] text-sm font-semibold text-[var(--muted)]">
        {text}
      </p>
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
  required = false,
  maxLength,
  pattern,
  title,
  min,
  max,
  help,
}: {
  name: string;
  placeholder: string;
  type?: string;
  defaultValue?: string;
  step?: string;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
  title?: string;
  min?: string;
  max?: string;
  help?: string;
}) {
  return (
    <label className="block">
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        required={required}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-sm font-medium text-[var(--navy)] outline-none transition invalid:border-[#f1b4b4] focus:border-[var(--gold)]"
      />
      {help ? (
        <span className="mt-1.5 block px-1 text-xs font-semibold text-[var(--muted)]">
          {help}
        </span>
      ) : null}
    </label>
  );
}

function AdminTextarea({
  name,
  placeholder,
  defaultValue,
  help,
}: {
  name: string;
  placeholder: string;
  defaultValue?: string;
  help?: string;
}) {
  return (
    <label className="block lg:col-span-2">
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-sm font-medium text-[var(--navy)] outline-none transition focus:border-[var(--gold)]"
      />
      {help ? (
        <span className="mt-1.5 block px-1 text-xs font-semibold text-[var(--muted)]">
          {help}
        </span>
      ) : null}
    </label>
  );
}

function AdminFileInput({
  name,
  label,
  multiple = false,
}: {
  name: string;
  label: string;
  multiple?: boolean;
}) {
  return (
    <label className="block rounded-2xl border border-dashed border-[var(--line)] bg-[#f8fbff] px-4 py-3.5">
      <span className="block text-sm font-black text-[var(--navy)]">{label}</span>
      <span className="mt-1 block text-xs font-semibold text-[var(--muted)]">
        JPG, PNG, WebP, or GIF up to 4 MB
      </span>
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        className="mt-3 block w-full text-xs font-semibold text-[var(--muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--navy)] file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
      />
    </label>
  );
}

function AdminSelect({
  name,
  defaultValue,
  options,
  required = false,
  help,
}: {
  name: string;
  defaultValue?: string;
  options: Array<string | { value: string; label: string }>;
  required?: boolean;
  help?: string;
}) {
  return (
    <label className="block">
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-sm font-medium text-[var(--navy)] outline-none transition invalid:border-[#f1b4b4] focus:border-[var(--gold)]"
      >
        {options.length === 0 ? <option value="">No options available</option> : null}
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
      {help ? (
        <span className="mt-1.5 block px-1 text-xs font-semibold text-[var(--muted)]">
          {help}
        </span>
      ) : null}
    </label>
  );
}

function businessImageUrl(business: AdminBusiness, role: string) {
  return (
    business.images.find((image) => image.role === role)?.url ??
    business.images.find((image) => image.isPrimary)?.url ??
    business.images[0]?.url ??
    ""
  );
}

function businessImageVariant(business: AdminBusiness, role: string) {
  return (
    business.images.find((image) => image.role === role)?.variant ??
    business.images.find((image) => image.isPrimary)?.variant ??
    business.images[0]?.variant ??
    "plate"
  );
}
