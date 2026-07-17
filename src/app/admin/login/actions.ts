"use server";

import { redirect } from "next/navigation";

import {
  clearAdminSession,
  createAdminSession,
  validateAdminCredentials,
} from "@/lib/admin-auth";

export async function loginAdmin(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/admin"));

  if (!validateAdminCredentials(username, password)) {
    const params = new URLSearchParams({
      status: "error",
      message: "Invalid admin username or password.",
      next,
    });
    redirect(`/admin/login?${params.toString()}`);
  }

  await createAdminSession(username);
  redirect(next);
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}

function safeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }

  if (!value.startsWith("/admin")) {
    return "/admin";
  }

  return value;
}
