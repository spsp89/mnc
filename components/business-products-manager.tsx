"use client";

import {
  Archive,
  CheckCircle2,
  Edit3,
  ImageIcon,
  LoaderCircle,
  PackagePlus,
  Plus,
  Send,
  X,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import { deliveryOptionsForHomeDelivery, hasHomeDelivery } from "@/lib/delivery-options";
import { prepareProductImageVariants, uploadPrivateMedia } from "@/lib/private-media-upload";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string;
  price: string | number;
  discountPrice: string | number | null;
  stockStatus: string;
  minimumOrderQty: number;
  deliveryOptions: unknown;
  warranty: string | null;
  returnInformation: string | null;
  status: "DRAFT" | "SUBMITTED" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  moderationReason: string | null;
  updatedAt: string;
  category?: { id: string; name: string; slug: string };
  media: Array<{
    id: string;
    objectKey: string;
    publicUrl: string | null;
    altText: string | null;
    scanStatus: string;
    variant: string;
    width: number | null;
    height: number | null;
  }>;
};

type Category = {
  id: string;
  name: string;
  slug?: string;
  children?: Category[];
};

type ProductUsage = null | {
  plan: { name: string; productLimit: number | null; deliveryEnabled: boolean };
  products: { used: number; limit: number | null };
};

type ProductForm = {
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  price: string;
  discountPrice: string;
  stockStatus: string;
  minimumOrderQty: string;
  homeDeliveryAvailable: boolean;
  warranty: string;
  returnInformation: string;
};

const emptyForm: ProductForm = {
  name: "",
  brand: "",
  categoryId: "",
  description: "",
  price: "",
  discountPrice: "",
  stockStatus: "IN_STOCK",
  minimumOrderQty: "1",
  homeDeliveryAvailable: false,
  warranty: "",
  returnInformation: "",
};

type CategoryOption = Category & { label: string };

function flattenCategories(categories: Category[], parents: string[] = []): CategoryOption[] {
  return categories.flatMap((category) => {
    const path = [...parents, category.name];
    return [
      { ...category, label: path.join(" › ") },
      ...flattenCategories(category.children ?? [], path),
    ];
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function productMediaSource(product: Product, businessId: string) {
  const media = product.media.find((item) => item.variant === "thumbnail") ?? product.media[0];
  if (!media) return null;
  if (media.objectKey.startsWith("quarantine/")) {
    return appPath(`/api/media/object?purpose=product_image&businessId=${encodeURIComponent(businessId)}&objectKey=${encodeURIComponent(media.objectKey)}`);
  }
  return media.publicUrl;
}

export function BusinessProductsManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [usage, setUsage] = useState<ProductUsage>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((business) => business.id === businessId);
  const canManage = workspace?.capabilities.includes("business:catalog:manage") ?? false;
  const canAddProduct = canManage && Boolean(usage) && (
    usage?.products.limit === null ||
    (usage?.products.used ?? 0) < (usage?.products.limit ?? 0)
  );

  const categoryOptions = useMemo(
    () => flattenCategories(categories),
    [categories],
  );

  const load = useCallback(async () => {
    if (!businessId) {
      setProducts([]);
      setCategories([]);
      setUsage(null);
      setState("ready");
      return;
    }
    setState("loading");
    try {
      const productsResponse = await fetch(appPath(`/api/business/products?businessId=${encodeURIComponent(businessId)}`));
      const productsBody = await productsResponse.json() as { data?: Product[]; categories?: Category[]; usage?: ProductUsage; message?: string };
      if (!productsResponse.ok) {
        throw new Error(productsBody.message ?? "Products could not be loaded.");
      }
      setProducts(productsBody.data ?? []);
      setCategories(productsBody.categories ?? []);
      setUsage(productsBody.usage ?? null);
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Products could not be loaded.");
      setState("error");
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMediaFiles([]);
    setRemoveExistingMedia(false);
    setFormOpen(true);
    setMessage("");
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      brand: product.brand ?? "",
      categoryId: product.categoryId,
      description: product.description,
      price: String(product.price),
      discountPrice: product.discountPrice == null ? "" : String(product.discountPrice),
      stockStatus: product.stockStatus,
      minimumOrderQty: String(product.minimumOrderQty || 1),
      homeDeliveryAvailable: hasHomeDelivery(product.deliveryOptions),
      warranty: product.warranty ?? "",
      returnInformation: product.returnInformation ?? "",
    });
    setMediaFiles([]);
    setRemoveExistingMedia(false);
    setFormOpen(true);
    setMessage("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace || !canManage) return;
    setBusy(true);
    setMessage("");
    try {
      const media = mediaFiles.length
        ? (await Promise.all(
            mediaFiles.map(async (file, index) => {
              const variants = await prepareProductImageVariants(file);
              return Promise.all(variants.map(async (variant) => {
                const uploaded = await uploadPrivateMedia(
                  variant.file,
                  "product_image",
                  workspace.id,
                );
                return {
                  objectKey: uploaded.objectKey,
                  mediaType: "image",
                  altText: `${form.name} product image ${index + 1}`,
                  sortOrder: index,
                  variant: variant.variant,
                  width: variant.width,
                  height: variant.height,
                };
              }));
            }),
          )).flat()
        : removeExistingMedia ? [] : undefined;
      const existingProduct = editingId
        ? products.find((product) => product.id === editingId)
        : undefined;
      const payload = {
        ...form,
        businessId: workspace.id,
        slug: existingProduct?.slug ?? `${slugify(form.name)}-${Date.now().toString(36)}`,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : editingId ? null : undefined,
        brand: form.brand || (editingId ? null : undefined),
        minimumOrderQty: Number(form.minimumOrderQty),
        deliveryOptions: deliveryOptionsForHomeDelivery(form.homeDeliveryAvailable),
        warranty: form.warranty || (editingId ? null : undefined),
        returnInformation: form.returnInformation || (editingId ? null : undefined),
        media,
      };
      const response = await fetch(
        appPath(editingId ? `/api/business/products/${editingId}` : "/api/business/products"),
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            editingId
              ? Object.fromEntries(Object.entries(payload).filter(([key]) => !["businessId"].includes(key)))
              : payload,
          ),
        },
      );
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Product could not be saved.");
      }
      setFormOpen(false);
      setMessage(
        editingId && existingProduct?.status === "PUBLISHED" && media !== undefined
          ? "Product photos updated and sent for approval. The listing will return after review."
          : editingId
            ? "Product updated. Published text and pricing changes are now live."
            : "Product draft created.",
      );
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function mutate(id: string, action: "submit" | "archive") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        action === "submit"
          ? appPath(`/api/business/products/${id}/submit`)
          : appPath(`/api/business/products/${id}`),
        { method: action === "submit" ? "POST" : "DELETE" },
      );
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Product could not be updated.");
      }
      setMessage(action === "submit" ? "Product sent for moderation." : "Product archived.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div>
          <span className="eyebrow">Local marketplace</span>
          <h1>Products</h1>
          <p>Create accurate product drafts, submit them for review and track publishing status.</p>
        </div>
        <div className="business-product-heading-actions">
          {user.businesses.length > 1 && (
            <label>
              <span>Business</span>
              <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>
                {user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}
              </select>
            </label>
          )}
          <button type="button" onClick={openCreate} disabled={!canAddProduct}><Plus size={15} /> Add product{usage ? ` (${usage.products.used}/${usage.products.limit ?? "∞"})` : ""}</button>
        </div>
      </section>

      {message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}
      {!canManage && (
        <section className="manager-api-state"><PackagePlus /><h2>View-only workspace</h2><p>Ask a business administrator for catalogue access.</p></section>
      )}
      {state === "loading" && <section className="manager-api-state"><LoaderCircle className="spin" /><p>Loading business products…</p></section>}
      {state === "error" && <section className="manager-api-state"><PackagePlus /><h2>Products are unavailable</h2><p>Try again without re-entering any product data.</p></section>}
      {state === "ready" && products.length === 0 && (
        <section className="manager-api-state"><PackagePlus /><h2>{usage ? "Add your first product" : "Activate a business plan"}</h2><p>{usage ? `The ${usage.plan.name} plan allows ${usage.products.limit ?? "unlimited"} products.` : "Choose and activate one of the six BNC plans before adding products."}</p>{canAddProduct && <button type="button" onClick={openCreate}><Plus size={15} /> Create product</button>}</section>
      )}
      {state === "ready" && products.length > 0 && (
        <section className="business-product-list">
          {products.map((product) => {
            const imageSource = productMediaSource(product, businessId);
            return <article key={product.id}>
              {imageSource ? (
                <Image className="business-product-thumbnail" src={imageSource} alt={product.media[0]?.altText ?? product.name} width={76} height={76} sizes="76px" unoptimized={imageSource.includes("/api/media/object?")} />
              ) : (
                <span className="business-product-thumbnail business-product-thumbnail-empty"><ImageIcon size={22} /></span>
              )}
              <div>
                <span className={`product-workflow-status status-${product.status.toLowerCase()}`}>{product.status.replaceAll("_", " ")}</span>
                <h2>{product.name}</h2>
                <p>{product.brand || "Unbranded"} · {product.category?.name ?? "Category"} · Updated {new Date(product.updatedAt).toLocaleDateString("en-IN")}</p>
                <small>{product.description}</small>
                {product.moderationReason && <small>Review note: {product.moderationReason}</small>}
              </div>
              <strong>{formatCurrency(Number(product.discountPrice ?? product.price))}</strong>
              {canManage && (
                <div className="business-product-actions">
                  {["DRAFT", "REJECTED", "PUBLISHED"].includes(product.status) && <button type="button" onClick={() => openEdit(product)} disabled={busy}><Edit3 size={14} /> Edit</button>}
                  {["DRAFT", "REJECTED"].includes(product.status) && <button type="button" onClick={() => void mutate(product.id, "submit")} disabled={busy}><Send size={14} /> Submit</button>}
                  <button type="button" onClick={() => void mutate(product.id, "archive")} disabled={busy}><Archive size={14} /> Archive</button>
                </div>
              )}
            </article>;
          })}
        </section>
      )}

      {formOpen && (
        <div className="business-product-dialog-backdrop" role="presentation">
          <section className="business-product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <header><div><span className="eyebrow">Catalogue draft</span><h2 id="product-form-title">{editingId ? "Edit product" : "Add a product"}</h2></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Close product form"><X size={18} /></button></header>
            <form onSubmit={save}>
              <div className="form-two-column">
                <label>Product name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} minLength={2} maxLength={160} required /></label>
                <label>Brand<input value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} maxLength={100} /></label>
              </div>
              <label>Category<select value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))} required><option value="" disabled>Select category</option>{categoryOptions.map((category) => <option value={category.id} key={category.id}>{category.label}</option>)}</select><small>Products can be published in the categories selected in Business settings, up to your plan limit.</small></label>
              <label>Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} minLength={10} maxLength={5000} rows={5} required /></label>
              <div className="form-two-column">
                <label>Price (₹)<input type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} min="0" step="0.01" required /></label>
                <label>Offer price (optional)<input type="number" value={form.discountPrice} onChange={(event) => setForm((current) => ({ ...current, discountPrice: event.target.value }))} min="0" step="0.01" /></label>
              </div>
              <div className="form-two-column">
                <label>Stock status<select value={form.stockStatus} onChange={(event) => setForm((current) => ({ ...current, stockStatus: event.target.value }))}><option value="IN_STOCK">In stock</option><option value="LOW_STOCK">Low stock</option><option value="OUT_OF_STOCK">Out of stock</option><option value="MADE_TO_ORDER">Made to order</option></select></label>
                <label>Minimum order quantity<input type="number" value={form.minimumOrderQty} onChange={(event) => setForm((current) => ({ ...current, minimumOrderQty: event.target.value }))} min="1" max="10000" step="1" required /></label>
              </div>
              <label className="business-product-delivery-option">
                <input type="checkbox" disabled={!usage?.plan.deliveryEnabled} checked={form.homeDeliveryAvailable} onChange={(event) => setForm((current) => ({ ...current, homeDeliveryAvailable: event.target.checked }))} />
                <span><strong>Home delivery available</strong><small>{usage?.plan.deliveryEnabled ? "Show this product’s home-delivery label only when the business can fulfil it." : "Delivery options require Platinum, Diamond or Ruby."}</small></span>
              </label>
              <div className="form-two-column">
                <label>Warranty (optional)<input value={form.warranty} onChange={(event) => setForm((current) => ({ ...current, warranty: event.target.value }))} maxLength={500} /></label>
                <label>Return information (optional)<input value={form.returnInformation} onChange={(event) => setForm((current) => ({ ...current, returnInformation: event.target.value }))} maxLength={1000} /></label>
              </div>
              {editingId && products.find((product) => product.id === editingId)?.media.length ? (
                <div className="business-product-current-media">
                  <strong>Current product photos</strong>
                  <div>{products.find((product) => product.id === editingId)!.media.filter((item) => item.variant !== "thumbnail").map((item) => {
                    const source = item.objectKey.startsWith("quarantine/")
                      ? appPath(`/api/media/object?purpose=product_image&businessId=${encodeURIComponent(businessId)}&objectKey=${encodeURIComponent(item.objectKey)}`)
                      : item.publicUrl;
                    return source ? <Image key={item.id} src={source} alt={item.altText ?? form.name} width={92} height={72} sizes="92px" unoptimized={source.includes("/api/media/object?")} /> : null;
                  })}</div>
                  <label><input type="checkbox" checked={removeExistingMedia} onChange={(event) => setRemoveExistingMedia(event.target.checked)} /> Remove all current photos when saving</label>
                </div>
              ) : null}
              <label>
                Product images
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []).slice(0, 6);
                    setMediaFiles(files);
                    if (files.length) setRemoveExistingMedia(false);
                  }}
                />
                <small>
                  {mediaFiles.length
                    ? `${mediaFiles.length} image${mediaFiles.length === 1 ? "" : "s"} selected: ${mediaFiles.map((file) => file.name).join(", ")}. New images replace the current product images.`
                    : "Up to 6 JPEG, PNG or WebP images. BNC creates gallery and thumbnail versions before secure upload."}
                </small>
              </label>
              <footer><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <CheckCircle2 size={15} />} Save draft</button></footer>
            </form>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
