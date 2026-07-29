import { redirect } from "next/navigation";

export default function MerchantPage() {
  redirect(process.env.GO_MERCHANT_URL ?? "http://localhost:8080/merchant/login");
}
