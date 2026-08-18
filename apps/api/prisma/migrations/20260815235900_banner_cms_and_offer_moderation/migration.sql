CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "placement" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Banner_placement_isActive_displayOrder_idx" ON "Banner"("placement", "isActive", "displayOrder");
CREATE INDEX "Banner_isActive_startsAt_endsAt_idx" ON "Banner"("isActive", "startsAt", "endsAt");

CREATE TYPE "OfferModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "Offer" ADD COLUMN "moderationStatus" "OfferModerationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "moderationReason" TEXT,
ADD COLUMN "moderatedAt" TIMESTAMP(3),
ADD COLUMN "moderatedById" TEXT;
UPDATE "Offer" SET "moderationStatus" = 'APPROVED', "moderationReason" = 'Existing offer retained during moderation rollout', "moderatedAt" = CURRENT_TIMESTAMP;
CREATE INDEX "Offer_moderationStatus_isActive_startsAt_endsAt_idx" ON "Offer"("moderationStatus", "isActive", "startsAt", "endsAt");

CREATE TABLE "PaymentStatusHistory" (
    "id" TEXT NOT NULL, "paymentId" TEXT NOT NULL, "previousStatus" "PaymentStatus", "newStatus" "PaymentStatus" NOT NULL,
    "source" TEXT NOT NULL, "sourceReference" TEXT, "actorId" TEXT, "reason" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentStatusHistory_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PaymentStatusHistory" ADD CONSTRAINT "PaymentStatusHistory_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "PaymentStatusHistory_paymentId_createdAt_idx" ON "PaymentStatusHistory"("paymentId", "createdAt");
CREATE INDEX "PaymentStatusHistory_newStatus_createdAt_idx" ON "PaymentStatusHistory"("newStatus", "createdAt");
CREATE INDEX "PaymentStatusHistory_source_sourceReference_idx" ON "PaymentStatusHistory"("source", "sourceReference");
INSERT INTO "PaymentStatusHistory" ("id", "paymentId", "previousStatus", "newStatus", "source", "reason", "createdAt") SELECT 'psh_' || md5("id"), "id", NULL, "status", 'MIGRATION', 'Initial auditable status snapshot', CURRENT_TIMESTAMP FROM "Payment";
