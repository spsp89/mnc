CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED', 'DISABLED');
CREATE TYPE "ManagedLocationType" AS ENUM ('COUNTRY', 'STATE', 'DISTRICT', 'CITY', 'CONSTITUENCY', 'LOCALITY');

ALTER TABLE "Business"
  ADD COLUMN "listingStatus" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "seoTitle" TEXT,
  ADD COLUMN "seoDescription" TEXT;

UPDATE "Business"
SET "listingStatus" = 'PUBLISHED'
WHERE "status" = 'ACTIVE' AND "deletedAt" IS NULL;

CREATE TABLE "ManagedLocation" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "ManagedLocationType" NOT NULL,
  "parentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ManagedLocation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BusinessLocation" ADD COLUMN "managedLocationId" TEXT;
ALTER TABLE "ManagedLocation" ADD CONSTRAINT "ManagedLocation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ManagedLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessLocation" ADD CONSTRAINT "BusinessLocation_managedLocationId_fkey" FOREIGN KEY ("managedLocationId") REFERENCES "ManagedLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ManagedLocation_parentId_slug_key" ON "ManagedLocation"("parentId", "slug");
CREATE UNIQUE INDEX "ManagedLocation_root_slug_key" ON "ManagedLocation"("slug") WHERE "parentId" IS NULL;
CREATE INDEX "ManagedLocation_type_isActive_sortOrder_idx" ON "ManagedLocation"("type", "isActive", "sortOrder");
CREATE INDEX "ManagedLocation_parentId_isActive_sortOrder_idx" ON "ManagedLocation"("parentId", "isActive", "sortOrder");
CREATE INDEX "BusinessLocation_managedLocationId_isActive_idx" ON "BusinessLocation"("managedLocationId", "isActive");
DROP INDEX IF EXISTS "Business_status_verified_premium_idx";
CREATE INDEX "Business_status_listingStatus_verified_premium_idx" ON "Business"("status", "listingStatus", "verified", "premium");
