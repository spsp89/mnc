"use server";

import { revalidatePath } from "next/cache";

import {
  addBusiness,
  addCategory,
  removeBusiness,
  setBusinessFeaturedStatus,
  setBusinessPopularStatus,
  setCategoryActiveStatus,
} from "@/lib/catalog";

function refreshAdminViews() {
  revalidatePath("/");
  revalidatePath("/admin");
}

function toSlug(value: string, fallback: string) {
  const source = value || fallback;

  return source
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readNumber(formData: FormData, name: string, fallback: number) {
  const parsed = Number(formData.get(name) ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHexColor(value: string, fallback: string) {
  const normalized = value.trim();
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback;
}

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = toSlug(String(formData.get("slug") ?? "").trim(), name);
  const icon = String(formData.get("icon") ?? "layout-grid").trim();
  const accent = normalizeHexColor(
    String(formData.get("accent") ?? "").trim(),
    "#7183A6",
  );
  const sortOrder = Math.round(readNumber(formData, "sortOrder", 99));
  const isActive = formData.get("isActive") === "on";

  if (!name || !slug) {
    return;
  }

  await addCategory({ name, slug, icon, accent, sortOrder, isActive });

  refreshAdminViews();
}

export async function createBusiness(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = toSlug(String(formData.get("slug") ?? "").trim(), name);
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const city = String(formData.get("city") ?? "Kozhikode").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();

  if (!name || !slug || !subtitle || !area || !categoryId || Number(categoryId) <= 0) {
    return;
  }

  await addBusiness({
    name,
    slug,
    subtitle,
    area,
    city,
    categoryId,
    rating: clamp(readNumber(formData, "rating", 4.5), 0, 5),
    reviewCount: Math.max(0, Math.round(readNumber(formData, "reviewCount", 50))),
    distanceKm: Math.max(0, readNumber(formData, "distanceKm", 1.5)),
    badgeText: String(formData.get("badgeText") ?? "").trim() || null,
    badgeColor: String(formData.get("badgeColor") ?? "").trim()
      ? normalizeHexColor(String(formData.get("badgeColor") ?? ""), "#2469D6")
      : null,
    coverVariant: String(formData.get("coverVariant") ?? "plate"),
    isFeatured: formData.get("isFeatured") === "on",
    isPopular: formData.get("isPopular") === "on",
  });

  refreshAdminViews();
}

export async function toggleCategoryActive(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id) {
    return;
  }

  await setCategoryActiveStatus(id, !isActive);
  refreshAdminViews();
}

export async function toggleBusinessFeatured(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const isFeatured = String(formData.get("isFeatured") ?? "") === "true";

  if (!id) {
    return;
  }

  await setBusinessFeaturedStatus(id, !isFeatured);
  refreshAdminViews();
}

export async function toggleBusinessPopular(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const isPopular = String(formData.get("isPopular") ?? "") === "true";

  if (!id) {
    return;
  }

  await setBusinessPopularStatus(id, !isPopular);
  refreshAdminViews();
}

export async function deleteBusiness(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return;
  }

  await removeBusiness(id);
  refreshAdminViews();
}
