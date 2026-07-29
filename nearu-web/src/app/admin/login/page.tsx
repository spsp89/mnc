import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  redirect(process.env.GO_ADMIN_URL ?? "http://localhost:8080/admin");
}
