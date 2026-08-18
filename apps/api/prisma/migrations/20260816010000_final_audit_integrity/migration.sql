ALTER TABLE "Offer" ADD COLUMN "featuredRequested" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Offer_featuredRequested_moderationStatus_createdAt_idx" ON "Offer"("featuredRequested", "moderationStatus", "createdAt");
