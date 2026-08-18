ALTER TABLE "SubscriptionPlan"
ADD COLUMN "starLevel" INTEGER NOT NULL DEFAULT 0;

UPDATE "SubscriptionPlan"
SET "starLevel" = CASE
  WHEN "slug" = 'premium' THEN 6
  WHEN "slug" = 'growth' THEN 4
  WHEN "slug" = 'starter' THEN 2
  ELSE 0
END;

ALTER TABLE "SubscriptionPlan"
ADD CONSTRAINT "SubscriptionPlan_starLevel_check"
CHECK ("starLevel" BETWEEN 0 AND 6);
