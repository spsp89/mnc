"use client";

import { CheckCircle2, MapPin, PackageSearch, RotateCcw, Search, SlidersHorizontal, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PortalHero } from "@/components/portal-hero";
import { SearchBox } from "@/components/search-box";
import type { Category, Product, ProductStockStatus, SearchFilters } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const stockLabels: Record<ProductStockStatus, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
  MADE_TO_ORDER: "Made to order",
};

type ProductCategory = Category & { businessCount: number };

export function ProductsView({
  products,
  filters,
  categories,
}: {
  products: Product[];
  filters: SearchFilters;
  categories: ProductCategory[];
}) {
  const hasActiveFilters = Boolean(filters.query || filters.location || filters.category || filters.productStatus || filters.courier || (filters.sort && filters.sort !== "recommended"));
  const statusLabel = filters.productStatus ? stockLabels[filters.productStatus] : "Any status";
  const selectedCategory = categories.find((category) => category.slug === filters.category)?.name ?? "All categories";

  return (
    <>
      <PortalHero
        eyebrow="BNC marketplace"
        title={<>Useful products, <em>closer than you think.</em></>}
        description="Discover local stock, compare practical details and contact the seller before you travel."
        image={products[0]?.image}
        imageAlt={products[0] ? `${products[0].name} available from a local BNC seller` : "BNC local marketplace"}
        tone="marketplace-hero"
        mediaLabel="Locally stocked across Kerala"
      >
        <div className="results-hero-search">
          <SearchBox
            initialQuery={filters.query}
            initialLocation={filters.location}
            initialLatitude={filters.latitude}
            initialLongitude={filters.longitude}
            initialMode="products"
            compact
          />
        </div>
      </PortalHero>
      <section className="page-section catalog-section">
        <div className="product-discovery-panel">
          <div className="product-discovery-heading">
            <div>
              <span className="eyebrow">Advanced discovery</span>
              <h2>Find the right product nearby</h2>
              <p>Filter the live catalogue by category, city and availability, then choose how results are ordered.</p>
            </div>
            <span className="product-result-count"><PackageSearch size={18} /> {products.length} matching product{products.length === 1 ? "" : "s"}</span>
          </div>
          <form className="product-filter-form" action="/products" method="get">
            <label className="product-filter-search">
              <span>Search</span>
              <span className="product-filter-control"><Search size={17} /><input type="search" name="q" defaultValue={filters.query} placeholder="Product, brand or keyword" /></span>
            </label>
            <label>
              <span>Category</span>
              <select name="category" defaultValue={filters.category ?? ""}>
                <option value="">All categories</option>
                {categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              <span>Location</span>
              <span className="product-filter-control"><MapPin size={17} /><input name="location" defaultValue={filters.location} placeholder="City, e.g. Kochi" /></span>
            </label>
            <label>
              <span>Availability / completion</span>
              <select name="status" defaultValue={filters.productStatus ?? ""}>
                <option value="">Any status</option>
                {Object.entries(stockLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>Sort by</span>
              <select name="sort" defaultValue={filters.sort ?? "recommended"}>
                <option value="recommended">Recommended</option>
                <option value="best-selling">Best selling</option>
                <option value="nearest">Nearest location</option>
                <option value="newest">Newest first</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Product name</option>
                <option value="category">Category</option>
                <option value="location">Location</option>
                <option value="status">Availability status</option>
              </select>
            </label>
            {filters.latitude !== undefined && <input type="hidden" name="latitude" value={filters.latitude} />}
            {filters.longitude !== undefined && <input type="hidden" name="longitude" value={filters.longitude} />}
            <input type="hidden" name="radius" value={filters.radius ?? 5} />
            {filters.courier && <input type="hidden" name="courier" value="true" />}
            <div className="product-filter-actions">
              <button type="submit"><SlidersHorizontal size={17} /> Apply filters</button>
              {hasActiveFilters && <Link href="/products"><RotateCcw size={15} /> Clear</Link>}
            </div>
          </form>
          <div className="product-filter-summary" aria-live="polite">
            <span>{selectedCategory}</span>
            <span>{filters.location || "All locations"}</span>
            <span>{statusLabel}</span>
            {filters.latitude !== undefined && <span>Within {filters.radius ?? 5} km</span>}
            {filters.courier && <span>Courier available</span>}
          </div>
        </div>
        {products.length ? (
          <div className="product-grid catalog-product-grid">
            {products.map((product) => {
              const stockStatus = product.stockStatus ?? (product.inStock ? "IN_STOCK" : "OUT_OF_STOCK");
              return (
              <article className="product-card catalog-product-card" key={product.id}>
                <Link href={`/products/${product.id}`} className="product-image">
                  <Image src={product.image} alt={product.name} fill sizes="(max-width: 760px) 88vw, 300px" />
                  <span className="product-image-badges">
                    {!!product.unitsSold && <span className="is-best-seller">Best seller</span>}
                    {product.sponsored && <span className="is-sponsored">Sponsored{product.planName ? ` · ${product.planName}` : ""}</span>}
                    {product.discountPrice && <span>Local deal</span>}
                  </span>
                </Link>
                <div>
                  <p>{product.category}</p>
                  <h2><Link href={`/products/${product.id}`}>{product.name}</Link></h2>
                  <div className="product-price">
                    <strong>{formatCurrency(product.discountPrice ?? product.price)}</strong>
                    {product.discountPrice && <del>{formatCurrency(product.price)}</del>}
                  </div>
                  <span className="product-seller">{product.sellerName ?? "BNC local seller"} · {product.sellerCity ?? "Kerala"}</span>
                  {product.courierAvailable
                    ? <span className="product-home-delivery"><Truck size={14} /> Courier available</span>
                    : product.homeDeliveryAvailable && <span className="product-home-delivery"><Truck size={14} /> Home delivery available</span>}
                  <div className="product-card-bottom">
                    <span className={`stock-status stock-${stockStatus.toLowerCase().replaceAll("_", "-")}`}><CheckCircle2 size={14} /> {stockLabels[stockStatus]}</span>
                    <span><MapPin size={13} /> {product.distanceKm !== undefined ? `${product.distanceKm} km` : "Local pickup"}</span>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state"><Search size={30} /><h2>{hasActiveFilters ? "No products match these filters" : "No products published yet"}</h2><p>{hasActiveFilters ? "Try a broader category, another city or a different availability status." : "Products supplied by the catalogue backend will appear here."}</p>{hasActiveFilters && <Link href="/products">Clear all filters</Link>}</div>
        )}
      </section>
    </>
  );
}
