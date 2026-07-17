"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addBusiness,
  addCategory,
  addDeal,
  addOffer,
  removeCategoryIfEmpty,
  removeBusiness,
  removeDeal,
  removeOffer,
  removeReview,
  setBusinessFeaturedStatus,
  setBusinessPopularStatus,
  setCategoryActiveStatus,
  setReviewFeaturedStatus,
  setReviewStatus,
  updateDeal as saveDealUpdate,
  updateOffer as saveOfferUpdate,
  updateBusiness as saveBusinessUpdate,
  updateCategory as saveCategoryUpdate,
} from "@/lib/catalog";
import { requireAdminSession } from "@/lib/admin-auth";
import { isUploadLike, storeBusinessImage } from "@/lib/image-upload";

const validCoverVariants = new Set([
  "plate",
  "suit",
  "basket",
  "salon",
  "shelf",
  "phone",
  "worker",
]);

type BusinessFormInput = {
  id?: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string | null;
  area: string;
  city: string;
  addressLine: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  upiId: string | null;
  openingHours: string | null;
  galleryUrls: string[];
  categoryId: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  badgeText: string | null;
  badgeColor: string | null;
  coverVariant: string;
  tags: string[];
  isVerified: boolean;
  isFeatured: boolean;
  isPopular: boolean;
};

function refreshAdminViews() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/business/[slug]", "page");
  revalidatePath("/business-card/[slug]", "page");
  revalidatePath("/deals");
  revalidatePath("/deals/[slug]", "page");
  revalidatePath("/offers");
  revalidatePath("/offers/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

function actionError(
  code: string,
  message: string,
  details: Record<string, string> = {},
): never {
  console.warn("Admin action rejected", {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  });
  const detail = Object.values(details)[0];
  redirectWithNotice("error", detail ? `${message} ${detail}` : message);
}

function redirectWithNotice(status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin?${params.toString()}`);
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

function readOptionalNumber(
  formData: FormData,
  name: string,
  details: Record<string, string>,
) {
  const raw = readText(formData, name);

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    details[name] = "Must be a valid number.";
    return null;
  }

  return parsed;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHexColor(value: string, fallback: string) {
  const normalized = value.trim();
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback;
}

function readText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function readOptionalText(formData: FormData, name: string) {
  return readText(formData, name) || null;
}

function readTags(formData: FormData) {
  return readText(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function readGalleryUrls(formData: FormData) {
  return readText(formData, "galleryUrls")
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function isValidId(value: string) {
  return /^[1-9]\d*$/.test(value);
}

function validateLength(
  value: string | null,
  name: string,
  maxLength: number,
  details: Record<string, string>,
) {
  if (value && value.length > maxLength) {
    details[name] = `Must be ${maxLength} characters or fewer.`;
  }
}

function validateOptionalEmail(
  value: string | null,
  details: Record<string, string>,
) {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    details.email = "Must be a valid email address.";
  }
}

function validateOptionalUrl(
  value: string | null,
  name: string,
  details: Record<string, string>,
) {
  if (!value) {
    return;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      details[name] = "Must start with http:// or https://.";
    }
  } catch {
    details[name] = "Must be a valid URL.";
  }
}

function validateOptionalImageRef(
  value: string | null,
  name: string,
  details: Record<string, string>,
) {
  if (!value) {
    return;
  }

  if (value.startsWith("/")) {
    if (value.includes("..") || value.includes("\\")) {
      details[name] = "Local image paths must stay inside public assets.";
    }
    return;
  }

  validateOptionalUrl(value, name, details);
}

function readPromotionRows(formData: FormData, name: string) {
  return readText(formData, name)
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function readDealItems(formData: FormData, name: string, fallbackImage: string) {
  const rows = readPromotionRows(formData, name);

  return rows.map((row, index) => {
    const [itemName, text, image, price] = row.split("|").map((part) => part.trim());

    return {
      name: itemName || `Item ${index + 1}`,
      text: text || "Deal item details.",
      image: image || fallbackImage,
      price: price || "Offer",
    };
  });
}

function readOfferItems(formData: FormData, name: string, fallbackImage: string) {
  const rows = readPromotionRows(formData, name);

  return rows.map((row, index) => {
    const [itemName, text, image, label] = row.split("|").map((part) => part.trim());

    return {
      name: itemName || `Item ${index + 1}`,
      text: text || "Offer item details.",
      image: image || fallbackImage,
      label: label || "Offer",
    };
  });
}

function validatePromotionBase(input: {
  slug: string;
  title: string;
  text: string;
  shop: string;
  category: string;
  image: string;
  gradient: string;
  validUntil: string;
  businessSlug: string | null;
}, details: Record<string, string>) {
  if (!input.title) details.title = "Title is required.";
  if (!input.slug || !isValidSlug(input.slug)) details.slug = "Slug must contain lowercase letters, numbers, and hyphens.";
  if (!input.shop) details.shop = "Shop is required.";
  if (!input.category) details.category = "Category is required.";
  if (!input.text) details.text = "Description is required.";
  validateLength(input.title, "title", 120, details);
  validateLength(input.text, "text", 260, details);
  validateLength(input.shop, "shop", 120, details);
  validateLength(input.category, "category", 80, details);
  validateLength(input.validUntil, "validUntil", 80, details);
  validateLength(input.businessSlug, "businessSlug", 120, details);
  validateOptionalImageRef(input.image, "image", details);
  if (!input.gradient.startsWith("linear-gradient(")) details.gradient = "Use an existing linear-gradient value.";
}

function readDealForm(formData: FormData) {
  const details: Record<string, string> = {};
  const image = readText(formData, "image") || "/mockup/im-gifts.jpg";
  const input = {
    slug: toSlug(readText(formData, "slug"), readText(formData, "title")),
    title: readText(formData, "title"),
    text: readText(formData, "text"),
    shop: readText(formData, "shop"),
    category: readText(formData, "category"),
    badge: readText(formData, "badge") || "Offer",
    badgeColor: normalizeHexColor(readText(formData, "badgeColor"), "#2469D6"),
    image,
    gradient: readText(formData, "gradient") || "linear-gradient(135deg,#eef5ff,#ffffff 58%,#e7f0ff)",
    validUntil: readText(formData, "validUntil") || "Limited time",
    businessSlug: readOptionalText(formData, "businessSlug"),
    isActive: formData.get("isActive") === "on",
    sortOrder: clamp(Math.round(readNumber(formData, "sortOrder", 99)), 0, 999),
    items: readDealItems(formData, "items", image),
  };

  validatePromotionBase(input, details);
  validateLength(input.badge, "badge", 40, details);
  if (input.items.length === 0) details.items = "Add at least one item row.";
  return { details, input };
}

function readOfferForm(formData: FormData) {
  const details: Record<string, string> = {};
  const image = readText(formData, "image") || "/mockup/im-gifts.jpg";
  const input = {
    slug: toSlug(readText(formData, "slug"), readText(formData, "title")),
    title: readText(formData, "title"),
    text: readText(formData, "text"),
    shop: readText(formData, "shop"),
    category: readText(formData, "category"),
    code: readText(formData, "code") || "OFFER",
    image,
    gradient: readText(formData, "gradient") || "linear-gradient(135deg,#12459b,#092b70)",
    validUntil: readText(formData, "validUntil") || "Limited time",
    businessSlug: readOptionalText(formData, "businessSlug"),
    isActive: formData.get("isActive") === "on",
    sortOrder: clamp(Math.round(readNumber(formData, "sortOrder", 99)), 0, 999),
    items: readOfferItems(formData, "items", image),
  };

  validatePromotionBase(input, details);
  validateLength(input.code, "code", 32, details);
  if (input.items.length === 0) details.items = "Add at least one item row.";
  return { details, input };
}

function readBusinessForm(
  formData: FormData,
  { requireId = false }: { requireId?: boolean } = {},
) {
  const details: Record<string, string> = {};
  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const slug = toSlug(readText(formData, "slug"), name);
  const subtitle = readText(formData, "subtitle");
  const area = readText(formData, "area");
  const city = readText(formData, "city") || "Kozhikode";
  const categoryId = readText(formData, "categoryId");
  const description = readOptionalText(formData, "description");
  const addressLine = readOptionalText(formData, "addressLine");
  const landmark = readOptionalText(formData, "landmark");
  const phone = readOptionalText(formData, "phone");
  const whatsapp = readOptionalText(formData, "whatsapp");
  const email = readOptionalText(formData, "email");
  const website = readOptionalText(formData, "website");
  const imageUrl = readOptionalText(formData, "imageUrl");
  const logoUrl = readOptionalText(formData, "logoUrl");
  const upiId = readOptionalText(formData, "upiId");
  const openingHours = readOptionalText(formData, "openingHours");
  const latitude = readOptionalNumber(formData, "latitude", details);
  const longitude = readOptionalNumber(formData, "longitude", details);
  const rating = clamp(readNumber(formData, "rating", 4.5), 0, 5);
  const reviewCount = Math.max(0, Math.round(readNumber(formData, "reviewCount", 50)));
  const distanceKm = Math.max(0, readNumber(formData, "distanceKm", 1.5));
  const badgeColor = readText(formData, "badgeColor")
    ? normalizeHexColor(readText(formData, "badgeColor"), "#2469D6")
    : null;
  const coverVariant = readText(formData, "coverVariant") || "plate";

  if (requireId && !isValidId(id)) {
    details.id = "A valid business id is required.";
  }

  if (!name) {
    details.name = "Business name is required.";
  }

  if (!slug || !isValidSlug(slug)) {
    details.slug = "Slug must contain lowercase letters, numbers, and hyphens.";
  }

  if (!subtitle) {
    details.subtitle = "Subtitle is required.";
  }

  if (!area) {
    details.area = "Area is required.";
  }

  if (!isValidId(categoryId)) {
    details.categoryId = "A valid category is required.";
  }

  if (!validCoverVariants.has(coverVariant)) {
    details.coverVariant = "Selected cover variant is not supported.";
  }

  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    details.latitude = "Latitude must be between -90 and 90.";
  }

  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    details.longitude = "Longitude must be between -180 and 180.";
  }

  validateLength(name, "name", 120, details);
  validateLength(subtitle, "subtitle", 120, details);
  validateLength(description, "description", 500, details);
  validateLength(area, "area", 80, details);
  validateLength(city, "city", 80, details);
  validateLength(addressLine, "addressLine", 160, details);
  validateLength(landmark, "landmark", 120, details);
  validateLength(upiId, "upiId", 80, details);
  validateLength(openingHours, "openingHours", 140, details);
  validateOptionalEmail(email, details);
  validateOptionalUrl(website, "website", details);
  validateOptionalImageRef(imageUrl, "imageUrl", details);
  validateOptionalImageRef(logoUrl, "logoUrl", details);

  const input: BusinessFormInput = {
    id: requireId ? id : undefined,
    name,
    slug,
    subtitle,
    description,
    area,
    city,
    addressLine,
    landmark,
    latitude,
    longitude,
    phone,
    whatsapp,
    email,
    website,
    imageUrl,
    logoUrl,
    upiId,
    openingHours,
    galleryUrls: readGalleryUrls(formData),
    categoryId,
    rating,
    reviewCount,
    distanceKm,
    badgeText: readOptionalText(formData, "badgeText"),
    badgeColor,
    coverVariant,
    tags: readTags(formData),
    isVerified: formData.get("isVerified") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isPopular: formData.get("isPopular") === "on",
  };

  return { details, input };
}

async function applyBusinessUploads(input: BusinessFormInput, formData: FormData) {
  const cover = formData.get("coverUpload");
  if (isUploadLike(cover) && cover.size > 0) {
    input.imageUrl = await storeBusinessImage({
      file: cover,
      slug: input.slug,
      slot: "cover",
    });
  }

  const logo = formData.get("logoUpload");
  if (isUploadLike(logo) && logo.size > 0) {
    input.logoUrl = await storeBusinessImage({
      file: logo,
      slug: input.slug,
      slot: "logo",
    });
  }

  const uploadedGallery: string[] = [];
  for (const file of formData.getAll("galleryUpload")) {
    if (isUploadLike(file) && file.size > 0) {
      uploadedGallery.push(
        await storeBusinessImage({
          file,
          slug: input.slug,
          slot: "gallery",
          index: uploadedGallery.length,
        }),
      );
    }
  }

  if (uploadedGallery.length > 0) {
    input.galleryUrls = [...input.galleryUrls, ...uploadedGallery].slice(0, 6);
  }

  return input;
}

export async function createCategory(formData: FormData) {
  await requireAdminSession();

  const details: Record<string, string> = {};
  const name = readText(formData, "name");
  const slug = toSlug(readText(formData, "slug"), name);
  const icon = readText(formData, "icon") || "layout-grid";
  const accent = normalizeHexColor(
    readText(formData, "accent"),
    "#7183A6",
  );
  const sortOrder = clamp(Math.round(readNumber(formData, "sortOrder", 99)), 0, 999);
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    details.name = "Category name is required.";
  }

  if (!slug || !isValidSlug(slug)) {
    details.slug = "Slug must contain lowercase letters, numbers, and hyphens.";
  }

  validateLength(name, "name", 80, details);
  validateLength(icon, "icon", 40, details);

  if (Object.keys(details).length > 0) {
    actionError("INVALID_CATEGORY", "Category input is invalid.", details);
    return;
  }

  try {
    await addCategory({ name, slug, icon, accent, sortOrder, isActive });
  } catch (error) {
    console.error("Category write failed", error);
    actionError("CATEGORY_WRITE_FAILED", "Unable to save category.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Category saved.");
}

export async function updateCategory(formData: FormData) {
  await requireAdminSession();

  const details: Record<string, string> = {};
  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const slug = toSlug(readText(formData, "slug"), name);
  const icon = readText(formData, "icon") || "layout-grid";
  const accent = normalizeHexColor(
    readText(formData, "accent"),
    "#7183A6",
  );
  const sortOrder = clamp(Math.round(readNumber(formData, "sortOrder", 99)), 0, 999);
  const isActive = formData.get("isActive") === "on";

  if (!isValidId(id)) {
    details.id = "A valid category id is required.";
  }

  if (!name) {
    details.name = "Category name is required.";
  }

  if (!slug || !isValidSlug(slug)) {
    details.slug = "Slug must contain lowercase letters, numbers, and hyphens.";
  }

  validateLength(name, "name", 80, details);
  validateLength(icon, "icon", 40, details);

  if (Object.keys(details).length > 0) {
    actionError("INVALID_CATEGORY", "Category input is invalid.", details);
  }

  try {
    await saveCategoryUpdate({ id, name, slug, icon, accent, sortOrder, isActive });
  } catch (error) {
    console.error("Category update failed", error);
    actionError("CATEGORY_UPDATE_FAILED", "Unable to update category. The slug may already be in use.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Category updated.");
}

export async function createBusiness(formData: FormData) {
  await requireAdminSession();

  const { details, input } = readBusinessForm(formData);

  if (Object.keys(details).length > 0) {
    actionError("INVALID_BUSINESS", "Business input is invalid.", details);
  }

  try {
    await addBusiness(await applyBusinessUploads(input, formData));
  } catch (error) {
    console.error("Business write failed", error);
    actionError("BUSINESS_WRITE_FAILED", "Unable to save business.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Business saved. Existing matching slugs are updated safely.");
}

export async function updateBusiness(formData: FormData) {
  await requireAdminSession();

  const { details, input } = readBusinessForm(formData, { requireId: true });

  if (Object.keys(details).length > 0) {
    actionError("INVALID_BUSINESS", "Business input is invalid.", details);
  }

  try {
    await saveBusinessUpdate({
      ...(await applyBusinessUploads(input, formData)),
      id: input.id ?? "",
    });
  } catch (error) {
    console.error("Business update failed", error);
    actionError("BUSINESS_UPDATE_FAILED", "Unable to update business. The slug may already be in use.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Business updated.");
}

export async function toggleCategoryActive(formData: FormData) {
  await requireAdminSession();

  const id = readText(formData, "id");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!isValidId(id)) {
    actionError("INVALID_ID", "A valid category id is required.", { id });
    return;
  }

  try {
    await setCategoryActiveStatus(id, !isActive);
  } catch (error) {
    console.error("Category status update failed", error);
    actionError("CATEGORY_UPDATE_FAILED", "Unable to update category.");
  }

  refreshAdminViews();
  redirectWithNotice("success", !isActive ? "Category activated." : "Category set idle.");
}

export async function deleteCategory(formData: FormData) {
  await requireAdminSession();

  const id = readText(formData, "id");

  if (!isValidId(id)) {
    actionError("INVALID_ID", "A valid category id is required.", { id });
  }

  try {
    const result = await removeCategoryIfEmpty(id);

    if (!result.ok) {
      actionError("CATEGORY_DELETE_BLOCKED", result.message);
    }
  } catch (error) {
    console.error("Category delete failed", error);
    actionError("CATEGORY_DELETE_FAILED", "Unable to delete category.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Category deleted.");
}

export async function toggleBusinessFeatured(formData: FormData) {
  await requireAdminSession();

  const id = readText(formData, "id");
  const isFeatured = String(formData.get("isFeatured") ?? "") === "true";

  if (!isValidId(id)) {
    actionError("INVALID_ID", "A valid business id is required.", { id });
    return;
  }

  try {
    await setBusinessFeaturedStatus(id, !isFeatured);
  } catch (error) {
    console.error("Business featured update failed", error);
    actionError("BUSINESS_UPDATE_FAILED", "Unable to update business.");
  }

  refreshAdminViews();
  redirectWithNotice("success", !isFeatured ? "Business marked featured." : "Business removed from featured.");
}

export async function toggleBusinessPopular(formData: FormData) {
  await requireAdminSession();

  const id = readText(formData, "id");
  const isPopular = String(formData.get("isPopular") ?? "") === "true";

  if (!isValidId(id)) {
    actionError("INVALID_ID", "A valid business id is required.", { id });
    return;
  }

  try {
    await setBusinessPopularStatus(id, !isPopular);
  } catch (error) {
    console.error("Business popular update failed", error);
    actionError("BUSINESS_UPDATE_FAILED", "Unable to update business.");
  }

  refreshAdminViews();
  redirectWithNotice("success", !isPopular ? "Business marked popular." : "Business removed from popular.");
}

export async function deleteBusiness(formData: FormData) {
  await requireAdminSession();

  const id = readText(formData, "id");

  if (!isValidId(id)) {
    actionError("INVALID_ID", "A valid business id is required.", { id });
    return;
  }

  try {
    await removeBusiness(id);
  } catch (error) {
    console.error("Business delete failed", error);
    actionError("BUSINESS_DELETE_FAILED", "Unable to delete business.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Business deleted.");
}

export async function createDeal(formData: FormData) {
  await requireAdminSession();
  const { details, input } = readDealForm(formData);

  if (Object.keys(details).length > 0) {
    actionError("INVALID_DEAL", "Deal input is invalid.", details);
  }

  try {
    await addDeal(input);
  } catch (error) {
    console.error("Deal write failed", error);
    actionError("DEAL_WRITE_FAILED", "Unable to save deal.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Deal saved.");
}

export async function updateDeal(formData: FormData) {
  await requireAdminSession();
  const { details, input } = readDealForm(formData);

  if (Object.keys(details).length > 0) {
    actionError("INVALID_DEAL", "Deal input is invalid.", details);
  }

  try {
    await saveDealUpdate(input);
  } catch (error) {
    console.error("Deal update failed", error);
    actionError("DEAL_UPDATE_FAILED", "Unable to update deal.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Deal updated.");
}

export async function deleteDeal(formData: FormData) {
  await requireAdminSession();
  const slug = readText(formData, "slug");

  if (!slug || !isValidSlug(slug)) {
    actionError("INVALID_DEAL", "A valid deal slug is required.", { slug });
  }

  try {
    await removeDeal(slug);
  } catch (error) {
    console.error("Deal delete failed", error);
    actionError("DEAL_DELETE_FAILED", "Unable to delete deal.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Deal deleted.");
}

export async function createOffer(formData: FormData) {
  await requireAdminSession();
  const { details, input } = readOfferForm(formData);

  if (Object.keys(details).length > 0) {
    actionError("INVALID_OFFER", "Offer input is invalid.", details);
  }

  try {
    await addOffer(input);
  } catch (error) {
    console.error("Offer write failed", error);
    actionError("OFFER_WRITE_FAILED", "Unable to save offer.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Offer saved.");
}

export async function updateOffer(formData: FormData) {
  await requireAdminSession();
  const { details, input } = readOfferForm(formData);

  if (Object.keys(details).length > 0) {
    actionError("INVALID_OFFER", "Offer input is invalid.", details);
  }

  try {
    await saveOfferUpdate(input);
  } catch (error) {
    console.error("Offer update failed", error);
    actionError("OFFER_UPDATE_FAILED", "Unable to update offer.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Offer updated.");
}

export async function deleteOffer(formData: FormData) {
  await requireAdminSession();
  const slug = readText(formData, "slug");

  if (!slug || !isValidSlug(slug)) {
    actionError("INVALID_OFFER", "A valid offer slug is required.", { slug });
  }

  try {
    await removeOffer(slug);
  } catch (error) {
    console.error("Offer delete failed", error);
    actionError("OFFER_DELETE_FAILED", "Unable to delete offer.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Offer deleted.");
}

export async function approveReview(formData: FormData) {
  await moderateReview(formData, "approved", "Review approved.");
}

export async function rejectReview(formData: FormData) {
  await moderateReview(formData, "rejected", "Review rejected.");
}

export async function toggleReviewFeatured(formData: FormData) {
  await requireAdminSession();
  const id = readText(formData, "id");
  const featured = readText(formData, "featured") === "true";

  if (!isValidId(id)) {
    actionError("INVALID_REVIEW", "A valid review id is required.", { id });
  }

  try {
    await setReviewFeaturedStatus(id, !featured);
  } catch (error) {
    console.error("Review feature update failed", error);
    actionError("REVIEW_UPDATE_FAILED", "Unable to update review.");
  }

  refreshAdminViews();
  redirectWithNotice("success", featured ? "Review unfeatured." : "Review featured.");
}

export async function deleteReview(formData: FormData) {
  await requireAdminSession();
  const id = readText(formData, "id");

  if (!isValidId(id)) {
    actionError("INVALID_REVIEW", "A valid review id is required.", { id });
  }

  try {
    await removeReview(id);
  } catch (error) {
    console.error("Review delete failed", error);
    actionError("REVIEW_DELETE_FAILED", "Unable to delete review.");
  }

  refreshAdminViews();
  redirectWithNotice("success", "Review deleted.");
}

async function moderateReview(
  formData: FormData,
  status: "approved" | "rejected",
  message: string,
) {
  await requireAdminSession();
  const id = readText(formData, "id");

  if (!isValidId(id)) {
    actionError("INVALID_REVIEW", "A valid review id is required.", { id });
  }

  try {
    await setReviewStatus(id, status);
  } catch (error) {
    console.error("Review moderation failed", error);
    actionError("REVIEW_UPDATE_FAILED", "Unable to moderate review.");
  }

  refreshAdminViews();
  redirectWithNotice("success", message);
}
