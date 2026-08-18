ALTER TABLE "Offer"
  ADD COLUMN "targetCustomerId" TEXT,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MERCHANT',
  ADD COLUMN "createdById" TEXT;

ALTER TABLE "Offer"
  ADD CONSTRAINT "Offer_targetCustomerId_fkey"
  FOREIGN KEY ("targetCustomerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Offer_targetCustomerId_moderationStatus_isActive_startsAt_endsAt_idx"
  ON "Offer"("targetCustomerId", "moderationStatus", "isActive", "startsAt", "endsAt");
CREATE INDEX "Offer_source_createdAt_idx" ON "Offer"("source", "createdAt");
