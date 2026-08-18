CREATE TYPE "PlanOfferReach" AS ENUM ('NEARBY_5KM', 'DISTRICT', 'STATE');
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');
CREATE TYPE "JobApplicationStatus" AS ENUM ('APPLIED', 'SHORTLISTED', 'REJECTED', 'HIRED', 'WITHDRAWN');
CREATE TYPE "ReferralStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEARBY_OFFER';

ALTER TABLE "Business"
ADD COLUMN "socialLinks" JSONB,
ADD COLUMN "permanentDiscountPercent" INTEGER,
ADD COLUMN "permanentDiscountLabel" TEXT,
ADD CONSTRAINT "Business_permanentDiscountPercent_check"
CHECK ("permanentDiscountPercent" IS NULL OR "permanentDiscountPercent" BETWEEN 0 AND 100);

ALTER TABLE "SubscriptionPlan"
ADD COLUMN "offerReach" "PlanOfferReach" NOT NULL DEFAULT 'NEARBY_5KM';

UPDATE "SubscriptionPlan"
SET "offerReach" = CASE
  WHEN "slug" = 'premium' THEN 'STATE'::"PlanOfferReach"
  WHEN "slug" = 'growth' THEN 'DISTRICT'::"PlanOfferReach"
  ELSE 'NEARBY_5KM'::"PlanOfferReach"
END;

ALTER TABLE "Offer"
ADD COLUMN "notifiedAt" TIMESTAMP(3),
ADD COLUMN "targetedCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ProductMedia"
ADD COLUMN "variant" TEXT NOT NULL DEFAULT 'gallery',
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER;

ALTER TABLE "SavedAddress"
ADD COLUMN "district" TEXT;

CREATE TABLE "Job" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "employmentType" TEXT NOT NULL,
  "workplaceType" TEXT NOT NULL DEFAULT 'ON_SITE',
  "skills" JSONB NOT NULL,
  "salaryMin" DECIMAL(12,2),
  "salaryMax" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "city" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "applicationUrl" TEXT,
  "contactEmail" TEXT,
  "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
  "closesAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobApplication" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "applicantId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "coverNote" TEXT,
  "resumeObjectKey" TEXT,
  "status" "JobApplicationStatus" NOT NULL DEFAULT 'APPLIED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessReferral" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "referredBusiness" TEXT,
  "phoneEncrypted" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "estimatedValue" DECIMAL(12,2),
  "status" "ReferralStatus" NOT NULL DEFAULT 'NEW',
  "convertedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessReferral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Job_businessId_slug_key" ON "Job"("businessId", "slug");
CREATE INDEX "Job_status_city_publishedAt_idx" ON "Job"("status", "city", "publishedAt");
CREATE INDEX "Job_businessId_status_createdAt_idx" ON "Job"("businessId", "status", "createdAt");
CREATE INDEX "Job_closesAt_idx" ON "Job"("closesAt");
CREATE INDEX "JobApplication_jobId_status_createdAt_idx" ON "JobApplication"("jobId", "status", "createdAt");
CREATE INDEX "JobApplication_applicantId_createdAt_idx" ON "JobApplication"("applicantId", "createdAt");
CREATE INDEX "BusinessReferral_businessId_status_createdAt_idx" ON "BusinessReferral"("businessId", "status", "createdAt");
CREATE INDEX "BusinessReferral_createdById_createdAt_idx" ON "BusinessReferral"("createdById", "createdAt");

ALTER TABLE "Job"
ADD CONSTRAINT "Job_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobApplication"
ADD CONSTRAINT "JobApplication_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobApplication"
ADD CONSTRAINT "JobApplication_applicantId_fkey"
FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BusinessReferral"
ADD CONSTRAINT "BusinessReferral_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessReferral"
ADD CONSTRAINT "BusinessReferral_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
