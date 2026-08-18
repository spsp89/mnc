import { Injectable } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../database/prisma.service";
import type { SearchBusinessesDto } from "./dto/search-businesses.dto";

type SearchRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  cover_image_url: string | null;
  public_phone: string | null;
  verified: boolean;
  premium: boolean;
  median_response_minutes: number | null;
  price_range: number | null;
  years_in_business: number | null;
  attributes: unknown;
  average_rating: string;
  review_count: number;
  category_name: string | null;
  category_slug: string | null;
  locality: string;
  city: string;
  latitude: string;
  longitude: string;
  distance_km: number | null;
  sponsored: boolean;
  plan_name: string | null;
  plan_star_level: number;
  listing_reach: "NEARBY_5KM" | "CONSTITUENCY" | "DISTRICT" | "STATE" | null;
  plan_started_at: Date | null;
  permanent_discount_percent: number | null;
  permanent_discount_label: string | null;
  relevance: number;
  total_count: bigint | number;
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchBusinessesDto) {
    const searchText = query.query?.trim() ?? "";
    const locationText = query.location?.trim() ?? "";
    const offset = (query.page - 1) * query.pageSize;
    const hasCoordinates =
      typeof query.latitude === "number" && typeof query.longitude === "number";
    const sortSql = (() => {
      switch (query.sort) {
        case "nearest":
          return Prisma.sql`distance_km ASC NULLS LAST, relevance DESC`;
        case "rating":
          return Prisma.sql`b.average_rating DESC, b.review_count DESC`;
        case "reviews":
          return Prisma.sql`b.review_count DESC, b.average_rating DESC`;
        case "recent":
          return Prisma.sql`b.published_at DESC NULLS LAST`;
        case "price-low":
          return Prisma.sql`b.price_range ASC NULLS LAST, relevance DESC`;
        case "price-high":
          return Prisma.sql`b.price_range DESC NULLS LAST, relevance DESC`;
        default:
          return Prisma.sql`sponsored DESC, plan_priority DESC, plan_started_at ASC NULLS LAST, relevance DESC, distance_km ASC NULLS LAST`;
      }
    })();

    const rows = await this.prisma.$queryRaw<SearchRow[]>(Prisma.sql`
      WITH candidates AS (
        SELECT
          b.id,
          b.name,
          b.slug,
          CASE
            WHEN COALESCE(sp.description_enabled, true) THEN b."shortDescription"
            ELSE NULL
          END AS short_description,
          b."coverImageUrl" AS cover_image_url,
          b."publicPhone" AS public_phone,
          b.verified,
          b.premium,
          b."medianResponseMinutes" AS median_response_minutes,
          b."priceRange" AS price_range,
          b."yearsInBusiness" AS years_in_business,
          b."permanentDiscountPercent" AS permanent_discount_percent,
          b."permanentDiscountLabel" AS permanent_discount_label,
          b.attributes,
          b."averageRating" AS average_rating,
          b."reviewCount" AS review_count,
          b."publishedAt" AS published_at,
          c.name AS category_name,
          c.slug AS category_slug,
          l.locality,
          l.city,
          l.latitude,
          l.longitude,
          CASE
            WHEN ${hasCoordinates} THEN
              ST_Distance(
                l."locationPoint",
                ST_SetSRID(ST_MakePoint(${query.longitude ?? 0}, ${query.latitude ?? 0}), 4326)::geography
              ) / 1000
            ELSE NULL
          END AS distance_km,
          COALESCE(sp.sponsored_placement, false) AS sponsored,
          COALESCE(sp.priority, 0) AS plan_priority,
          sp.plan_name,
          COALESCE(sp.star_level, 0) AS plan_star_level,
          sp.listing_reach,
          sp.starts_at AS plan_started_at,
          (
            CASE WHEN ${searchText} = '' THEN 1 ELSE
              ts_rank_cd(
                to_tsvector('simple', COALESCE(b."searchDocument", b.name || ' ' || b.description)),
                plainto_tsquery('simple', ${searchText})
              ) * 10 +
              similarity(LOWER(b.name), LOWER(${searchText})) * 4
            END
          ) AS relevance
        FROM "Business" b
        JOIN "BusinessLocation" l
          ON l."businessId" = b.id AND l."isPrimary" = true AND l."isActive" = true
        LEFT JOIN "BusinessCategory" bc
          ON bc."businessId" = b.id AND bc."isPrimary" = true
        LEFT JOIN "Category" c ON c.id = bc."categoryId"
        LEFT JOIN LATERAL (
          SELECT
            p."sponsoredPlacement" AS sponsored_placement,
            p.priority,
            p.name AS plan_name,
            p."starLevel" AS star_level,
            p."listingReach" AS listing_reach,
            p."descriptionEnabled" AS description_enabled,
            p."deliveryEnabled" AS delivery_enabled,
            s."startsAt" AS starts_at
          FROM "BusinessSubscription" s
          JOIN "SubscriptionPlan" p ON p.id = s."planId"
          WHERE s."businessId" = b.id
            AND s.status IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD')
            AND s."currentPeriodEnd" >= NOW()
          ORDER BY p.priority DESC, s."startsAt" ASC
          LIMIT 1
        ) sp ON true
        WHERE b.status = 'ACTIVE'
          AND b."listingStatus" = 'PUBLISHED'
          AND b."deletedAt" IS NULL
          AND (${searchText} = '' OR
            to_tsvector('simple', COALESCE(b."searchDocument", b.name || ' ' || b.description))
              @@ plainto_tsquery('simple', ${searchText})
            OR similarity(LOWER(b.name), LOWER(${searchText})) > 0.22)
          AND (${hasCoordinates} = true OR ${locationText} = '' OR
            l.locality ILIKE '%' || ${locationText} || '%'
            OR l.city ILIKE '%' || ${locationText} || '%'
            OR COALESCE(l.constituency, '') ILIKE '%' || ${locationText} || '%'
            OR l.district ILIKE '%' || ${locationText} || '%'
            OR l.state ILIKE '%' || ${locationText} || '%')
          AND (${query.verified ?? false} = false OR b.verified = true)
          AND (${query.premium ?? false} = false OR b.premium = true)
          AND (${query.rating ?? 0} = 0 OR b."averageRating" >= ${query.rating ?? 0})
          AND (${query.openNow ?? false} = false OR EXISTS (
            SELECT 1 FROM "WorkingHour" wh
            WHERE wh."businessId" = b.id
              AND wh.closed = false
              AND wh."opensAt" IS NOT NULL
              AND wh."closesAt" IS NOT NULL
              AND (
                (
                  wh."opensAt"::time <= wh."closesAt"::time
                  AND wh."dayOfWeek" = EXTRACT(DOW FROM timezone('Asia/Kolkata', NOW()))::int
                  AND timezone('Asia/Kolkata', NOW())::time
                    BETWEEN wh."opensAt"::time AND wh."closesAt"::time
                )
                OR
                (
                  wh."opensAt"::time > wh."closesAt"::time
                  AND (
                    (
                      wh."dayOfWeek" = EXTRACT(DOW FROM timezone('Asia/Kolkata', NOW()))::int
                      AND timezone('Asia/Kolkata', NOW())::time >= wh."opensAt"::time
                    )
                    OR
                    (
                      wh."dayOfWeek" =
                        (EXTRACT(DOW FROM timezone('Asia/Kolkata', NOW()))::int + 6) % 7
                      AND timezone('Asia/Kolkata', NOW())::time <= wh."closesAt"::time
                    )
                  )
                )
              )
          ))
          AND (${query.offers ?? false} = false OR EXISTS (
            SELECT 1 FROM "Offer" o
            WHERE o."businessId" = b.id AND o."isActive" = true
              AND o."startsAt" <= NOW() AND o."endsAt" >= NOW()
          ))
          AND (${query.homeService ?? false} = false OR EXISTS (
            SELECT 1 FROM "Service" s
            WHERE s."businessId" = b.id
              AND s."isActive" = true
              AND s."deletedAt" IS NULL
              AND s."homeService" = true
          ))
          AND (${query.delivery ?? false} = false OR EXISTS (
            SELECT 1 FROM "Product" p
            WHERE p."businessId" = b.id
              AND COALESCE(sp.delivery_enabled, false) = true
              AND p.status = 'PUBLISHED'
              AND p."isActive" = true
              AND p."deletedAt" IS NULL
              AND (
                (jsonb_typeof(p."deliveryOptions") = 'array'
                  AND p."deliveryOptions" ?| ARRAY['local_delivery', 'home_delivery', 'courier', 'delivery'])
                OR p."deliveryOptions" @> '{"homeDelivery": true}'::jsonb
                OR p."deliveryOptions" @> '{"localDelivery": true}'::jsonb
              )
          ))
          AND (
            ${query.fastResponse ?? false} = false
            OR (
              b."medianResponseMinutes" IS NOT NULL
              AND b."medianResponseMinutes" <= 15
            )
          )
          AND (
            ${query.priceRange ?? 0} = 0
            OR b."priceRange" = ${query.priceRange ?? 0}
          )
          AND (
            ${query.minYears ?? 0} = 0
            OR COALESCE(b."yearsInBusiness", 0) >= ${query.minYears ?? 0}
          )
          AND (
            ${query.payment?.trim() ?? ""} = ''
            OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(
                CASE
                  WHEN jsonb_typeof(COALESCE(b.attributes, '{}'::jsonb)->'paymentMethods') = 'array'
                    THEN COALESCE(b.attributes, '{}'::jsonb)->'paymentMethods'
                  ELSE '[]'::jsonb
                END
              ) AS accepted_payment(value)
              WHERE LOWER(accepted_payment.value) = LOWER(${query.payment?.trim() ?? ""})
            )
          )
          AND (
            ${query.language?.trim() ?? ""} = ''
            OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(
                CASE
                  WHEN jsonb_typeof(COALESCE(b.attributes, '{}'::jsonb)->'languages') = 'array'
                    THEN COALESCE(b.attributes, '{}'::jsonb)->'languages'
                  ELSE '[]'::jsonb
                END
              ) AS spoken_language(value)
              WHERE LOWER(spoken_language.value) = LOWER(${query.language?.trim() ?? ""})
            )
          )
          AND (
            ${hasCoordinates} = false OR
            ST_DWithin(
              l."locationPoint",
              ST_SetSRID(ST_MakePoint(${query.longitude ?? 0}, ${query.latitude ?? 0}), 4326)::geography,
              ${query.radiusKm * 1000}
            )
          )
      )
      SELECT b.*, COUNT(*) OVER() AS total_count FROM candidates b
      ORDER BY ${sortSql}
      LIMIT ${query.pageSize}
      OFFSET ${offset}
    `);

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        shortDescription: row.short_description,
        coverImageUrl: row.cover_image_url,
        publicPhone: row.public_phone,
        verified: row.verified,
        premium: row.premium,
        medianResponseMinutes: row.median_response_minutes,
        priceRange: row.price_range,
        yearsInBusiness: row.years_in_business,
        attributes: row.attributes,
        categoryName: row.category_name,
        categorySlug: row.category_slug,
        rating: Number(row.average_rating),
        reviewCount: row.review_count,
        locality: row.locality,
        city: row.city,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        distanceKm: row.distance_km === null ? null : Number(row.distance_km),
        sponsored: row.sponsored,
        planName: row.plan_name,
        bncStarLevel: row.plan_star_level,
        listingReach: row.listing_reach ?? "NEARBY_5KM",
        joinedPlanAt: row.plan_started_at,
        permanentDiscountPercent: row.permanent_discount_percent,
        permanentDiscountLabel: row.permanent_discount_label,
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        radiusKm: query.radiusKm,
        total: rows.length === 0 ? 0 : Number(rows[0].total_count),
        paidPlacementLabel: "Sponsored",
      },
    };
  }
}
