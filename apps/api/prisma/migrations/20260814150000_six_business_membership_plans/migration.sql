CREATE TYPE "PlanListingReach" AS ENUM ('NEARBY_5KM', 'CONSTITUENCY', 'DISTRICT', 'STATE');

ALTER TABLE "SubscriptionPlan"
  ADD COLUMN "listingReach" "PlanListingReach" NOT NULL DEFAULT 'NEARBY_5KM',
  ADD COLUMN "categoryLimit" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "descriptionEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "socialLinksEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "bookingEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "automaticLeadAlerts" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "BusinessLocation" ADD COLUMN "constituency" TEXT;
UPDATE "BusinessLocation" SET "constituency" = "city" WHERE "constituency" IS NULL;
DROP INDEX IF EXISTS "BusinessLocation_state_district_city_locality_idx";
CREATE INDEX "BusinessLocation_state_district_constituency_city_locality_idx"
  ON "BusinessLocation"("state", "district", "constituency", "city", "locality");

-- Preserve legacy rows for auditability while freeing the six public plan names.
UPDATE "SubscriptionPlan"
SET "name" = "name" || ' (Legacy)', "isActive" = false
WHERE "name" IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ruby')
  AND "slug" NOT IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'ruby');

INSERT INTO "SubscriptionPlan" (
  "id", "name", "slug", "priority", "starLevel", "listingReach", "offerReach",
  "monthlyPrice", "annualPrice", "leadQuota", "productLimit", "mediaLimit",
  "categoryLimit", "locationLimit", "teamMemberLimit", "descriptionEnabled",
  "socialLinksEnabled", "bookingEnabled", "deliveryEnabled", "automaticLeadAlerts",
  "sponsoredPlacement", "advancedAnalytics", "features", "isActive", "createdAt", "updatedAt"
)
VALUES
  ('bnc-plan-bronze-v1', 'Bronze', 'bronze', 1, 1, 'NEARBY_5KM', 'NEARBY_5KM', 499, 4999, 20, 3, 0, 1, 1, 1, false, false, false, false, false, false, false,
    '["Banner","Profile photo","1 category","3 products","Location map","Business address","BNC business listing","Google search-ready profile","Shareable business card"]'::jsonb, true, NOW(), NOW()),
  ('bnc-plan-silver-v1', 'Silver', 'silver', 2, 2, 'CONSTITUENCY', 'NEARBY_5KM', 999, 9999, 50, 10, 5, 3, 1, 2, true, true, false, false, false, false, false,
    '["Banner","Profile photo","5 gallery photos","3 categories","10 products","Location map","Business address","Business description","BNC business listing","Google search-ready profile","Shareable business card","Constituency priority listing","Social media links"]'::jsonb, true, NOW(), NOW()),
  ('bnc-plan-gold-v1', 'Gold', 'gold', 3, 3, 'CONSTITUENCY', 'NEARBY_5KM', 2999, 29999, 100, 30, 15, 6, 1, 3, true, true, false, false, false, true, true,
    '["Banner","Profile photo","15 gallery photos","6 categories","30 products","Location map","Business address","Business description","BNC business listing","Google search-ready profile","Shareable business card","Constituency priority listing","Social media links"]'::jsonb, true, NOW(), NOW()),
  ('bnc-plan-platinum-v1', 'Platinum', 'platinum', 4, 4, 'CONSTITUENCY', 'NEARBY_5KM', 4999, 49999, 200, 50, 25, 10, 1, 5, true, true, true, true, false, true, true,
    '["Banner","Profile photo","25 gallery photos","10 categories","50 products","Location map","Business address","Business description","BNC business listing","Google search-ready profile","Shareable business card","Constituency priority listing","Social media links","Booking system","Delivery integration"]'::jsonb, true, NOW(), NOW()),
  ('bnc-plan-diamond-v1', 'Diamond', 'diamond', 5, 5, 'DISTRICT', 'DISTRICT', 9999, 99999, 500, 100, 50, 15, 1, 10, true, true, true, true, true, true, true,
    '["Banner","Profile photo","50 gallery photos","15 categories","100 products","Location map","Business address","Business description","BNC business listing","Google search-ready profile","Shareable business card","District priority listing","Social media links","Automatic lead alerts with opt-out","Booking system","Delivery integration"]'::jsonb, true, NOW(), NOW()),
  ('bnc-plan-ruby-v1', 'Ruby', 'ruby', 6, 6, 'STATE', 'STATE', 14999, 149999, NULL, 150, 75, 20, 1, 15, true, true, true, true, true, true, true,
    '["Banner","Profile photo","75 gallery photos","20 categories","150 products","Location map","Business address","Business description","BNC business listing","Google search-ready profile","Shareable business card","State priority listing","Social media links","Automatic lead alerts with opt-out","Booking system","Delivery integration"]'::jsonb, true, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "priority" = EXCLUDED."priority",
  "starLevel" = EXCLUDED."starLevel",
  "listingReach" = EXCLUDED."listingReach",
  "offerReach" = EXCLUDED."offerReach",
  "monthlyPrice" = EXCLUDED."monthlyPrice",
  "annualPrice" = EXCLUDED."annualPrice",
  "leadQuota" = EXCLUDED."leadQuota",
  "productLimit" = EXCLUDED."productLimit",
  "mediaLimit" = EXCLUDED."mediaLimit",
  "categoryLimit" = EXCLUDED."categoryLimit",
  "locationLimit" = EXCLUDED."locationLimit",
  "teamMemberLimit" = EXCLUDED."teamMemberLimit",
  "descriptionEnabled" = EXCLUDED."descriptionEnabled",
  "socialLinksEnabled" = EXCLUDED."socialLinksEnabled",
  "bookingEnabled" = EXCLUDED."bookingEnabled",
  "deliveryEnabled" = EXCLUDED."deliveryEnabled",
  "automaticLeadAlerts" = EXCLUDED."automaticLeadAlerts",
  "sponsoredPlacement" = EXCLUDED."sponsoredPlacement",
  "advancedAnalytics" = EXCLUDED."advancedAnalytics",
  "features" = EXCLUDED."features",
  "isActive" = true,
  "updatedAt" = NOW();

UPDATE "BusinessSubscription" subscription
SET "planId" = target.id
FROM "SubscriptionPlan" legacy, "SubscriptionPlan" target
WHERE subscription."planId" = legacy.id
  AND target.slug = CASE legacy.slug
    WHEN 'free' THEN 'bronze'
    WHEN 'basic' THEN 'bronze'
    WHEN 'starter' THEN 'bronze'
    WHEN 'plus' THEN 'silver'
    WHEN 'growth' THEN 'gold'
    WHEN 'professional' THEN 'platinum'
    WHEN 'premium' THEN 'ruby'
  END
  AND legacy.slug IN ('free', 'basic', 'starter', 'plus', 'growth', 'professional', 'premium');

UPDATE "SubscriptionPlan"
SET "isActive" = false, "updatedAt" = NOW()
WHERE "slug" NOT IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'ruby');
