"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import {
  createGoBusiness,
  createGoCategory,
  createGoClinic,
  createGoDeal,
  createGoDoctor,
  deleteGoBusiness,
  deleteGoCategory,
  deleteGoClinic,
  deleteGoDeal,
  deleteGoDoctor,
  updateGoBusiness,
  updateGoCategory,
  updateGoClinic,
  updateGoDeal,
  updateGoDoctor,
  getGoAdminData,
} from "@/lib/go-api";

type NoticeStatus = "success" | "error";

function refreshViews() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/business/[slug]", "page");
  revalidatePath("/doctor-booking");
  revalidatePath("/deals");
  revalidatePath("/sitemap.xml");
}

function redirectWithNotice(status: NoticeStatus, message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin?${params.toString()}`);
}

async function runAdminWrite(message: string, task: () => Promise<unknown>) {
  await requireAdminSession();

  try {
    await task();
  } catch (error) {
    console.error("Shared admin write failed", error);
    redirectWithNotice(
      "error",
      error instanceof Error ? error.message : "Admin action failed.",
    );
  }

  refreshViews();
  redirectWithNotice("success", message);
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string) {
  return text(formData, name) || null;
}

function slug(value: string, fallback: string) {
  const source = value || fallback;
  return source
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function numberValue(formData: FormData, name: string, fallback: number) {
  const parsed = Number(formData.get(name) ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalNumber(formData: FormData, name: string) {
  const value = text(formData, name);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boolValue(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function tags(formData: FormData, name = "tags") {
  return text(formData, name)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function categoryInput(formData: FormData) {
  const name = text(formData, "name");
  return {
    name,
    slug: slug(text(formData, "slug"), name),
    icon: text(formData, "icon") || "layout-grid",
    accentColor: text(formData, "accentColor") || text(formData, "accent") || "#0B2F74",
    sortOrder: Math.max(0, Math.round(numberValue(formData, "sortOrder", 50))),
    isActive: boolValue(formData, "isActive"),
  };
}

function businessInput(formData: FormData) {
  const name = text(formData, "name");
  const area = text(formData, "area") || "Kozhikode";
  return {
    categorySlug: text(formData, "categorySlug") || text(formData, "categoryId"),
    slug: slug(text(formData, "slug"), name),
    name,
    shortDescription:
      text(formData, "shortDescription") ||
      text(formData, "subtitle") ||
      text(formData, "description") ||
      "Local business listed on BNC",
    thumbnailUrl: optionalText(formData, "thumbnailUrl"),
    logoUrl: optionalText(formData, "logoUrl"),
    phone: optionalText(formData, "phone"),
    whatsapp: optionalText(formData, "whatsapp"),
    email: optionalText(formData, "email"),
    website: optionalText(formData, "website"),
    area,
    addressLabel:
      text(formData, "addressLabel") || `${area}, Kozhikode, Kerala`,
    tags: tags(formData),
    isFeatured: boolValue(formData, "isFeatured"),
    isPopular: boolValue(formData, "isPopular"),
    badgeText: optionalText(formData, "badgeText"),
    badgeColor: optionalText(formData, "badgeColor"),
  };
}

function clinicInput(formData: FormData) {
  const name = text(formData, "name");
  const area = text(formData, "area") || "Kozhikode";
  return {
    slug: slug(text(formData, "slug"), name),
    name,
    imageUrl: text(formData, "imageUrl") || "/mockup/im-pharmacy.jpg",
    phone: optionalText(formData, "phone"),
    whatsapp: optionalText(formData, "whatsapp"),
    addressLabel:
      text(formData, "addressLabel") || `${name}, ${area}, Kerala`,
    area,
    city: text(formData, "city") || "Kozhikode",
    latitude: optionalNumber(formData, "latitude"),
    longitude: optionalNumber(formData, "longitude"),
    distanceKm: Math.max(0.1, numberValue(formData, "distanceKm", 1)),
    isActive: boolValue(formData, "isActive"),
  };
}

function doctorInput(formData: FormData) {
  const name = text(formData, "name");
  return {
    clinicSlug: text(formData, "clinicSlug"),
    slug: slug(text(formData, "slug"), name),
    name,
    speciality: text(formData, "speciality") || "General Physician",
    experience: text(formData, "experience") || "1 yr exp",
    ratingAverage: Math.min(5, Math.max(0, numberValue(formData, "ratingAverage", 4.5))),
    ratingCount: Math.max(0, Math.round(numberValue(formData, "ratingCount", 10))),
    nextSlot: text(formData, "nextSlot") || "Today",
    fee: text(formData, "fee") || "Contact clinic",
    imageUrl: text(formData, "imageUrl") || "/mockup/im-doctor-general.jpg",
    services: tags(formData, "services"),
    isActive: boolValue(formData, "isActive"),
  };
}

function dealInput(formData: FormData) {
  const title = text(formData, "title");
  return {
    businessSlug: text(formData, "businessSlug"),
    slug: slug(text(formData, "slug"), title),
    title,
    description: text(formData, "description") || text(formData, "text") || "Local BNC offer",
    code: text(formData, "code") || text(formData, "badge") || "OFFER",
    imageUrl: text(formData, "imageUrl") || text(formData, "image") || "/mockup/im-gifts.jpg",
    accentColor: text(formData, "accentColor") || text(formData, "badgeColor") || "#0B2F74",
    section: text(formData, "section") || "main",
    isFeatured: boolValue(formData, "isFeatured"),
    sortOrder: Math.max(0, Math.round(numberValue(formData, "sortOrder", 50))),
  };
}

export async function saveCategory(formData: FormData) {
  const oldSlug = text(formData, "oldSlug") || text(formData, "id");
  const input = categoryInput(formData);
  await runAdminWrite("Category saved to shared BNC database.", () =>
    oldSlug ? updateGoCategory(oldSlug, input) : createGoCategory(input),
  );
}

export async function removeCategory(formData: FormData) {
  await runAdminWrite("Category removed from shared BNC database.", () =>
    deleteGoCategory(text(formData, "slug") || text(formData, "id")),
  );
}

export async function saveBusiness(formData: FormData) {
  const oldSlug = text(formData, "oldSlug") || text(formData, "id");
  const input = businessInput(formData);
  await runAdminWrite("Shop saved to shared BNC database.", () =>
    oldSlug ? updateGoBusiness(oldSlug, input) : createGoBusiness(input),
  );
}

export async function removeBusiness(formData: FormData) {
  await runAdminWrite("Shop removed from shared BNC database.", () =>
    deleteGoBusiness(text(formData, "slug") || text(formData, "id")),
  );
}

export async function saveClinic(formData: FormData) {
  const oldSlug = text(formData, "oldSlug") || text(formData, "id");
  const input = clinicInput(formData);
  await runAdminWrite("Clinic saved to shared BNC database.", () =>
    oldSlug ? updateGoClinic(oldSlug, input) : createGoClinic(input),
  );
}

export async function removeClinic(formData: FormData) {
  await runAdminWrite("Clinic removed from shared BNC database.", () =>
    deleteGoClinic(text(formData, "slug") || text(formData, "id")),
  );
}

export async function saveDoctor(formData: FormData) {
  const oldSlug = text(formData, "oldSlug") || text(formData, "id");
  const input = doctorInput(formData);
  await runAdminWrite("Doctor saved to shared BNC database.", () =>
    oldSlug ? updateGoDoctor(oldSlug, input) : createGoDoctor(input),
  );
}

export async function removeDoctor(formData: FormData) {
  await runAdminWrite("Doctor removed from shared BNC database.", () =>
    deleteGoDoctor(text(formData, "slug") || text(formData, "id")),
  );
}

export async function saveDeal(formData: FormData) {
  const oldSlug = text(formData, "oldSlug") || text(formData, "slug");
  const input = dealInput(formData);
  await runAdminWrite("Deal saved to shared BNC database.", () =>
    oldSlug ? updateGoDeal(oldSlug, input) : createGoDeal(input),
  );
}

export async function removeDeal(formData: FormData) {
  await runAdminWrite("Deal removed from shared BNC database.", () =>
    deleteGoDeal(text(formData, "slug")),
  );
}

export const createCategory = saveCategory;
export const updateCategory = saveCategory;
export const deleteCategory = removeCategory;
export const createBusiness = saveBusiness;
export const updateBusiness = saveBusiness;
export const deleteBusiness = removeBusiness;
export const createDeal = saveDeal;
export const updateDeal = saveDeal;
export const deleteDeal = removeDeal;
export const createOffer = saveDeal;
export const updateOffer = saveDeal;
export const deleteOffer = removeDeal;

export async function toggleCategoryActive(formData: FormData) {
  const currentSlug = text(formData, "slug") || text(formData, "id");
  await runAdminWrite("Category status updated.", async () => {
    const category = (await getGoAdminData()).categories.find((item) => item.slug === currentSlug);
    if (!category) throw new Error("Category not found.");
    await updateGoCategory(currentSlug, {
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      accentColor: category.accentColor,
      sortOrder: category.sortOrder,
      isActive: !category.isActive,
    });
  });
}

export async function toggleBusinessFeatured(formData: FormData) {
  const currentSlug = text(formData, "slug") || text(formData, "id");
  await runAdminWrite("Shop featured status updated.", async () => {
    const business = (await getGoAdminData()).businesses.find((item) => item.slug === currentSlug);
    if (!business) throw new Error("Shop not found.");
    await updateGoBusiness(currentSlug, {
      categorySlug: business.category.slug,
      slug: business.slug,
      name: business.name,
      shortDescription: business.shortDescription,
      thumbnailUrl: business.thumbnailUrl,
      logoUrl: business.logoUrl,
      phone: business.contact.phone,
      whatsapp: business.contact.whatsapp,
      email: business.contact.email,
      website: business.contact.website,
      area: business.address.area,
      addressLabel: business.address.label,
      tags: business.tags,
      isFeatured: !business.flags.featured,
      isPopular: business.flags.popular,
      badgeText: business.badge?.text ?? null,
      badgeColor: business.badge?.color ?? null,
    });
  });
}

export async function toggleBusinessPopular(formData: FormData) {
  const currentSlug = text(formData, "slug") || text(formData, "id");
  await runAdminWrite("Shop popular status updated.", async () => {
    const business = (await getGoAdminData()).businesses.find((item) => item.slug === currentSlug);
    if (!business) throw new Error("Shop not found.");
    await updateGoBusiness(currentSlug, {
      categorySlug: business.category.slug,
      slug: business.slug,
      name: business.name,
      shortDescription: business.shortDescription,
      thumbnailUrl: business.thumbnailUrl,
      logoUrl: business.logoUrl,
      phone: business.contact.phone,
      whatsapp: business.contact.whatsapp,
      email: business.contact.email,
      website: business.contact.website,
      area: business.address.area,
      addressLabel: business.address.label,
      tags: business.tags,
      isFeatured: business.flags.featured,
      isPopular: !business.flags.popular,
      badgeText: business.badge?.text ?? null,
      badgeColor: business.badge?.color ?? null,
    });
  });
}

export async function approveReview() {
  redirectWithNotice("success", "Reviews are not connected to the shared Go API yet.");
}

export async function rejectReview() {
  redirectWithNotice("success", "Reviews are not connected to the shared Go API yet.");
}

export async function toggleReviewFeatured() {
  redirectWithNotice("success", "Review featuring is not connected to the shared Go API yet.");
}

export async function deleteReview() {
  redirectWithNotice("success", "Reviews are not connected to the shared Go API yet.");
}
