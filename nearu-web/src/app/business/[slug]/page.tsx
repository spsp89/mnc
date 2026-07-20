import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BusinessDetailPage } from "@/components/nearu/public-home";
import { getBusinessBySlug, getBusinessReviewData, getCatalogData } from "@/lib/catalog";
import { absoluteUrl, defaultOpenGraph, imageForMeta, pageTitle } from "@/lib/seo";

type BusinessPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    review?: string;
    message?: string;
  }>;
};

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return {
      title: pageTitle("Business Not Found"),
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = `/business/${encodeURIComponent(business.slug)}`;
  const coverImage =
    business.images.find((image) => image.role === "cover") ??
    business.images.find((image) => image.isPrimary) ??
    business.images[0];
  const description =
    business.description ||
    `${business.name} is a ${business.category.name} listing in ${business.location.area}, ${business.location.city}. View contact details, address, rating, and related businesses on Nearu.`;

  return {
    title: pageTitle(business.name),
    description,
    alternates: {
      canonical,
    },
    openGraph: defaultOpenGraph({
      type: "article",
      title: pageTitle(business.name),
      description,
      url: absoluteUrl(canonical),
      images: [
        {
          url: imageForMeta(coverImage?.url),
          width: 1200,
          height: 630,
          alt: coverImage?.alt || business.name,
        },
      ],
    }),
    twitter: {
      card: "summary_large_image",
      title: pageTitle(business.name),
      description,
      images: [imageForMeta(coverImage?.url)],
    },
  };
}

export default async function BusinessPage({ params, searchParams }: BusinessPageProps) {
  const { slug } = await params;
  const reviewNotice = await searchParams;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const relatedData = await getCatalogData({
    category: business.category.slug,
    sort: "rating",
    limit: 5,
  });
  const reviewData = getBusinessReviewData(business.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd(business)),
        }}
      />
      <BusinessDetailPage
        business={business}
        related={relatedData.all ?? []}
        reviewData={reviewData}
        reviewNotice={{
          status: reviewNotice?.review ?? "",
          message: reviewNotice?.message ?? "",
        }}
      />
    </>
  );
}

function localBusinessJsonLd(business: NonNullable<Awaited<ReturnType<typeof getBusinessBySlug>>>) {
  const image =
    business.images.find((item) => item.role === "cover") ??
    business.images.find((item) => item.isPrimary) ??
    business.images[0];

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    image: imageForMeta(image?.url),
    url: absoluteUrl(`/business/${business.slug}`),
    telephone: business.contact.phone || business.contact.whatsapp,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.location.addressLine,
      addressLocality: business.location.area,
      addressRegion: business.location.city,
      addressCountry: "IN",
    },
    aggregateRating:
      business.rating.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: business.rating.score,
            reviewCount: business.rating.reviewCount,
          }
        : undefined,
  };
}
