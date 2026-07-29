"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { addReview } from "@/lib/catalog";

function readText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function reviewRedirect(slug: string, status: "submitted" | "error", message?: string): never {
  const params = new URLSearchParams({ review: status });

  if (message) {
    params.set("message", message);
  }

  redirect(`/business/${encodeURIComponent(slug)}?${params.toString()}#reviews`);
}

export async function submitBusinessReview(formData: FormData) {
  const businessSlug = readText(formData, "businessSlug");
  const customerName = readText(formData, "customerName");
  const customerEmail = readText(formData, "customerEmail");
  const customerPhone = readText(formData, "customerPhone");
  const rating = Number(readText(formData, "rating"));
  const text = readText(formData, "text");
  const website = readText(formData, "website");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(businessSlug)) {
    redirect("/?review=error");
  }

  if (website) {
    reviewRedirect(businessSlug, "error", "Review could not be submitted.");
  }

  if (customerName.length < 2 || customerName.length > 80) {
    reviewRedirect(businessSlug, "error", "Please enter your name.");
  }

  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    reviewRedirect(businessSlug, "error", "Please enter a valid email address.");
  }

  if (customerPhone.length > 30) {
    reviewRedirect(businessSlug, "error", "Phone number is too long.");
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    reviewRedirect(businessSlug, "error", "Please choose a rating.");
  }

  if (text.length < 10 || text.length > 800) {
    reviewRedirect(businessSlug, "error", "Review must be between 10 and 800 characters.");
  }

  const result = await addReview({
    businessSlug,
    customerName,
    customerEmail: customerEmail || null,
    customerPhone: customerPhone || null,
    rating,
    text,
    status: "pending",
  });

  if (!result.ok) {
    reviewRedirect(businessSlug, "error", result.message);
  }

  revalidatePath(`/business/${businessSlug}`);
  revalidatePath("/admin");
  reviewRedirect(businessSlug, "submitted");
}
