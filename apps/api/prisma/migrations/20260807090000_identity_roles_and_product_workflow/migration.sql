CREATE TYPE "ProductStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED'
);

ALTER TABLE "Product"
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "moderationReason" TEXT;

UPDATE "Product"
SET
  "status" = CASE
    WHEN "deletedAt" IS NOT NULL OR "isActive" = false THEN 'ARCHIVED'::"ProductStatus"
    ELSE 'PUBLISHED'::"ProductStatus"
  END,
  "publishedAt" = CASE
    WHEN "deletedAt" IS NULL AND "isActive" = true THEN COALESCE("updatedAt", "createdAt")
    ELSE NULL
  END;

CREATE TABLE "GlobalRoleAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "assignedById" TEXT,
  "reason" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "GlobalRoleAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GlobalRoleAssignment_userId_role_key"
  ON "GlobalRoleAssignment"("userId", "role");
CREATE INDEX "GlobalRoleAssignment_role_active_idx"
  ON "GlobalRoleAssignment"("role", "active");
CREATE INDEX "GlobalRoleAssignment_assignedById_idx"
  ON "GlobalRoleAssignment"("assignedById");

ALTER TABLE "GlobalRoleAssignment"
  ADD CONSTRAINT "GlobalRoleAssignment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
