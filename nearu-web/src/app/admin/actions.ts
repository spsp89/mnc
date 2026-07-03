"use server";

import { revalidatePath } from "next/cache";

import { addBusiness, addCategory } from "@/lib/catalog";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const icon = String(formData.get("icon") ?? "layout-grid").trim();
  const accent = String(formData.get("accent") ?? "#7183A6").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 99);
  const isActive = formData.get("isActive") === "on";

  if (!name || !slug) {
    return;
  }

  await addCategory({ name, slug, icon, accent, sortOrder, isActive });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createBusiness(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const city = String(formData.get("city") ?? "Kozhikode").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();

  if (!name || !slug || !subtitle || !area || !categoryId) {
    return;
  }

  await addBusiness({
    name,
    slug,
    subtitle,
    area,
    city,
    categoryId,
    rating: Number(formData.get("rating") ?? 4.5),
    reviewCount: Number(formData.get("reviewCount") ?? 50),
    distanceKm: Number(formData.get("distanceKm") ?? 1.5),
    badgeText: String(formData.get("badgeText") ?? "").trim() || null,
    badgeColor: String(formData.get("badgeColor") ?? "").trim() || null,
    coverVariant: String(formData.get("coverVariant") ?? "plate"),
    isFeatured: formData.get("isFeatured") === "on",
    isPopular: formData.get("isPopular") === "on",
  });

  revalidatePath("/");
  revalidatePath("/admin");
}
