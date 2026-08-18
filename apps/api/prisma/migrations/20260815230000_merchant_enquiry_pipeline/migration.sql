CREATE TYPE "MerchantEnquiryStatus" AS ENUM (
  'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED', 'SPAM'
);

CREATE TABLE "MerchantEnquiryState" (
  "id" TEXT NOT NULL,
  "enquiryId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "status" "MerchantEnquiryStatus" NOT NULL DEFAULT 'NEW',
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MerchantEnquiryState_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MerchantEnquiryState_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MerchantEnquiryState_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MerchantEnquiryState_enquiryId_businessId_key"
  ON "MerchantEnquiryState"("enquiryId", "businessId");
CREATE INDEX "MerchantEnquiryState_businessId_status_updatedAt_idx"
  ON "MerchantEnquiryState"("businessId", "status", "updatedAt");
CREATE INDEX "MerchantEnquiryState_enquiryId_businessId_idx"
  ON "MerchantEnquiryState"("enquiryId", "businessId");

CREATE INDEX "Business_createdAt_idx" ON "Business"("createdAt");
CREATE INDEX "Offer_isActive_startsAt_endsAt_idx" ON "Offer"("isActive", "startsAt", "endsAt");
CREATE INDEX "BusinessSubscription_planId_status_currentPeriodEnd_idx"
  ON "BusinessSubscription"("planId", "status", "currentPeriodEnd");
