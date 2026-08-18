import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, PackageCheck, ShieldCheck, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BncMessageButton } from "@/components/bnc-message-button";
import { WhatsAppInquiryButton } from "@/components/whatsapp-inquiry-button";
import { getPublicProduct, getPublicProducts } from "@/lib/public-api";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getPublicProduct(id);
  return product ? { title: product.name, description: product.description ?? `${product.name}, available from a local Kerala seller.` } : {};
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, featuredProducts] = await Promise.all([
    getPublicProduct(id),
    getPublicProducts(),
  ]);
  if (!product) notFound();
  const seller = {
    name: product.sellerName ?? "BNC local seller",
    id: product.businessId,
    city: product.sellerCity ?? "Kerala",
    phone: product.sellerPhone,
    whatsapp: product.sellerWhatsapp,
    checkout: product.checkout,
  };
  const price = product.discountPrice ?? product.price;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        image: [product.image],
        description: product.description ?? `${product.name}, available from ${seller.name} in ${seller.city}.`,
        category: product.category,
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price,
          availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: { "@type": "LocalBusiness", name: seller.name },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "/" },
          { "@type": "ListItem", position: 2, name: "Products", item: "/products" },
          { "@type": "ListItem", position: 3, name: product.name, item: `/products/${product.id}` },
        ],
      },
    ],
  };

  return (
    <AppShell headerVariant="immersive">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <div className="product-detail-page">
        <div className="product-detail-grid">
          <div className="product-detail-media-column">
            <div className="product-detail-image"><Image src={product.image} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 52vw" /></div>
            {(product.images?.length ?? 0) > 1 && (
              <div className="product-detail-gallery" aria-label="Product photos">
                {product.images!.map((image, index) => (
                  <div key={image}><Image src={image} alt={`${product.name} photo ${index + 1}`} fill sizes="120px" /></div>
                ))}
              </div>
            )}
          </div>
          <section className="product-detail-copy">
            <Link className="back-link" href="/products"><ArrowLeft size={15} /> Back to marketplace</Link>
            <span className="eyebrow">{product.category}</span>
            <h1>{product.name}</h1>
            <div className="product-detail-price">
              <strong>{formatCurrency(price)}</strong>
              {product.discountPrice && <><del>{formatCurrency(product.price)}</del><span>You save {formatCurrency(product.price - product.discountPrice)}</span></>}
            </div>
            <p>{product.description ?? "Available from a nearby independent seller. Confirm current stock, colour or delivery details directly before ordering."}</p>
            {(product.brand || product.warranty || product.returnInformation || Object.keys(product.specifications ?? {}).length > 0) && (
              <div className="product-detail-facts">
                {product.brand && <span><small>Brand</small><strong>{product.brand}</strong></span>}
                <span><small>Minimum order</small><strong>{product.minimumOrderQty ?? 1}</strong></span>
                {product.warranty && <span><small>Warranty</small><strong>{product.warranty}</strong></span>}
                {product.returnInformation && <span><small>Returns</small><strong>{product.returnInformation}</strong></span>}
                {Object.entries(product.specifications ?? {}).map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}</strong></span>)}
              </div>
            )}
            <div className="product-assurances">
              <span><CheckCircle2 size={17} /> Stock reported available</span>
              {product.homeDeliveryAvailable && <span><PackageCheck size={17} /> Home delivery available</span>}
              <span><ShieldCheck size={17} /> Seller details reviewed by BNC</span>
            </div>
            <div className="seller-panel">
              <span><Store size={20} /></span>
              <div><small>Sold by</small><strong>{seller.name}</strong><p><MapPin size={13} /> {seller.city}, Kerala</p></div>
            </div>
            <div className="product-contact-actions">
              {seller.checkout && <Link href={`/cart?add=${product.id}`}><PackageCheck size={17} /> Add to cart</Link>}
              <WhatsAppInquiryButton phone={seller.whatsapp} recipientName={seller.name} message={`Hi ${seller.name}, I found ${product.name} on BNC. Is it available, and can you share the price and delivery details?`} />
              {seller.id && <BncMessageButton businessId={seller.id} businessName={seller.name} initialMessage={`Hi, is the ${product.name} currently available?`} label="Ask in BNC chat" />}
              {seller.phone && <a href={`tel:${seller.phone.replace(/\s/g, "")}`}>Call seller</a>}
            </div>
            <small className="marketplace-note">{seller.checkout ? "This product supports optional BNC checkout. Price and stock are verified again by the server." : "BNC helps you discover and contact the seller. Payment and fulfilment are agreed directly with the business."}</small>
          </section>
        </div>
        <section className="detail-related-section">
          <div className="detail-related-heading">
            <div><span className="eyebrow">Keep exploring</span><h2>More useful local finds</h2></div>
            <Link href="/products">Browse the marketplace <ArrowRight size={16} /></Link>
          </div>
          <div className="detail-related-grid">
            {featuredProducts.filter((item) => item.id !== product.id).slice(0, 6).map((item) => (
              <Link className="detail-related-card" href={`/products/${item.id}`} key={item.id}>
                <div className="detail-related-media">
                  <Image src={item.image} alt={item.name} fill sizes="(max-width: 620px) 76vw, 25vw" />
                  <span><PackageCheck size={14} /> Locally stocked</span>
                </div>
                <div className="detail-related-copy">
                  <span>{item.category}</span>
                  <h3>{item.name}</h3>
                  <div><strong>{formatCurrency(item.discountPrice ?? item.price)}</strong><span>View product <ArrowRight size={15} /></span></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
