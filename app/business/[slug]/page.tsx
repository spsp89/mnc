import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessProfileView } from "@/components/business-profile-view";
import { getPublicBusiness, getPublicBusinesses } from "@/lib/public-api";

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);
  if (!business) return { title: "Business not found" };

  return {
    title: `${business.name} in ${business.locality}`,
    description: `${business.shortDescription} View reviews, services, hours, offers and contact options on BNC.`,
    alternates: { canonical: `/business/${business.slug}` },
    openGraph: {
      title: `${business.name} · ${business.rating}★ on BNC`,
      description: business.shortDescription,
      images: [{ url: business.coverImage, alt: business.name }],
    },
  };
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const [business, relatedBusinesses] = await Promise.all([
    getPublicBusiness(slug),
    getPublicBusinesses(),
  ]);
  if (!business) notFound();
  const schemaType = {
    "Hotels & stays": "Hotel",
    Restaurants: "Restaurant",
    "Doctors & clinics": "MedicalClinic",
    Grocery: "GroceryStore",
    "Bakery & sweets": "Bakery",
    Automobile: "AutoRepair",
  }[business.category] ?? "LocalBusiness";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": schemaType,
        "@id": `/business/${business.slug}#business`,
        name: business.name,
        description: business.description,
        image: business.gallery,
        telephone: business.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: business.address,
          addressLocality: business.city,
          addressRegion: business.state,
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: business.latitude,
          longitude: business.longitude,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: business.rating,
          reviewCount: business.reviewCount,
        },
        review: business.reviews.map((review) => ({
          "@type": "Review",
          author: { "@type": "Person", name: review.author },
          datePublished: review.date,
          reviewBody: review.body,
          reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "/" },
          { "@type": "ListItem", position: 2, name: business.category, item: `/categories#${business.categorySlug}` },
          { "@type": "ListItem", position: 3, name: business.name, item: `/business/${business.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <BusinessProfileView business={business} relatedBusinesses={relatedBusinesses} />
    </>
  );
}
