"use client";

import { CheckCircle2, LoaderCircle, PackageCheck, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";

type ModerationProduct = {
  id: string;
  name: string;
  status: string;
  brand: string | null;
  description: string;
  price: string | number;
  submittedAt: string | null;
  business: { name: string; status: string };
  category: { name: string };
};

export function AdminProductModeration() {
  const [products, setProducts] = useState<ModerationProduct[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch(appPath("/api/admin/products"));
      const body = (await response.json()) as { data?: ModerationProduct[]; message?: string };
      if (!response.ok) throw new Error(body.message ?? "Moderation queue is unavailable.");
      setProducts(body.data ?? []);
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Moderation queue is unavailable.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function moderate(product: ModerationProduct, action: "PUBLISH" | "REJECT") {
    const reason = reasons[product.id]?.trim();
    if (!reason || reason.length < 5) {
      setMessage("Add an audit reason of at least 5 characters first.");
      return;
    }
    setBusyId(product.id);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/admin/products/${product.id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Moderation failed.");
      }
      setMessage(action === "PUBLISH" ? `${product.name} published.` : `${product.name} returned to the business.`);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Moderation failed.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="admin-product-moderation">
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}
      {state === "loading" && <div className="admin-empty"><LoaderCircle className="spin" /><strong>Loading submitted products</strong></div>}
      {state === "error" && <div className="admin-empty"><RefreshCw /><strong>Queue unavailable</strong><span>No moderation decision was changed.</span><button type="button" onClick={() => void load()}>Try again</button></div>}
      {state === "ready" && products.length === 0 && <div className="admin-empty"><PackageCheck /><strong>Product queue is clear</strong><span>New submissions will appear here.</span></div>}
      {state === "ready" && products.map((product) => (
        <article key={product.id}>
          <header><div><span>{product.category.name}</span><h2>{product.name}</h2><p>{product.business.name} · {product.brand || "Unbranded"}</p></div><strong>{formatCurrency(Number(product.price))}</strong></header>
          <p>{product.description}</p>
          <small><strong>{product.status.replaceAll("_", " ")}</strong> · Submitted {product.submittedAt ? new Date(product.submittedAt).toLocaleString("en-IN") : "recently"} · Business {product.business.status.toLowerCase()}</small>
          <label>Audit reason<input value={reasons[product.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [product.id]: event.target.value }))} minLength={5} maxLength={1000} placeholder="Required for publishing or returning this product" /></label>
          <footer>
            <button type="button" onClick={() => void moderate(product, "REJECT")} disabled={busyId === product.id}><XCircle size={15} /> Return with note</button>
            <button type="button" onClick={() => void moderate(product, "PUBLISH")} disabled={busyId === product.id}><CheckCircle2 size={15} /> Publish product</button>
          </footer>
        </article>
      ))}
    </section>
  );
}
