ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "SubscriptionPlan"
  ADD COLUMN "offerLimit" INTEGER,
  ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "SubscriptionPlan" SET "displayOrder" = "priority";
CREATE INDEX "SubscriptionPlan_isActive_displayOrder_idx"
  ON "SubscriptionPlan"("isActive", "displayOrder");

ALTER TABLE "BusinessSubscription"
  ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "renewalStatus" TEXT NOT NULL DEFAULT 'NOT_DUE',
  ADD COLUMN "lastRenewedAt" TIMESTAMP(3),
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'CHECKOUT',
  ADD COLUMN "assignedById" TEXT;

UPDATE "BusinessSubscription"
SET
  "autoRenew" = false,
  "renewalStatus" = CASE
    WHEN "status" = 'PENDING_PAYMENT' THEN 'PAYMENT_PENDING'
    WHEN "status" IN ('CANCELLED', 'EXPIRED') OR "cancelledAt" IS NOT NULL THEN 'CANCELLED'
    WHEN "status" = 'PAST_DUE' THEN 'FAILED'
    ELSE 'NOT_DUE'
  END,
  "lastRenewedAt" = CASE WHEN "status" IN ('ACTIVE', 'TRIAL', 'GRACE_PERIOD') THEN "currentPeriodStart" ELSE NULL END;

CREATE INDEX "BusinessSubscription_renewalStatus_currentPeriodEnd_idx"
  ON "BusinessSubscription"("renewalStatus", "currentPeriodEnd");

UPDATE "SubscriptionPlan" SET "offerLimit" = CASE "slug"
  WHEN 'bronze' THEN 0
  WHEN 'silver' THEN 2
  WHEN 'gold' THEN 5
  WHEN 'platinum' THEN 10
  WHEN 'diamond' THEN 25
  WHEN 'ruby' THEN NULL
  ELSE "offerLimit"
END;
