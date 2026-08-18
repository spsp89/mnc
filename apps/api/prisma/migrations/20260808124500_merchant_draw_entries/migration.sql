CREATE TYPE "DrawKind" AS ENUM ('WEEKLY', 'MONTHLY', 'FESTIVAL');
CREATE TYPE "DrawEntryStatus" AS ENUM ('ISSUED', 'CLAIMED', 'VOIDED');

ALTER TABLE "WeeklyDraw"
ADD COLUMN "kind" "DrawKind" NOT NULL DEFAULT 'WEEKLY',
ADD COLUMN "occasion" TEXT,
ADD COLUMN "minimumPurchase" DECIMAL(12,2) NOT NULL DEFAULT 200,
ADD COLUMN "winnerEntryId" TEXT;

CREATE TABLE "DrawEntry" (
  "id" TEXT NOT NULL,
  "drawId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "issuedById" TEXT NOT NULL,
  "customerId" TEXT,
  "purchaseAmount" DECIMAL(12,2) NOT NULL,
  "receiptReference" TEXT,
  "codeHash" TEXT NOT NULL,
  "codeLast4" TEXT NOT NULL,
  "status" "DrawEntryStatus" NOT NULL DEFAULT 'ISSUED',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimedAt" TIMESTAMP(3),
  "voidedAt" TIMESTAMP(3),
  CONSTRAINT "DrawEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeeklyDraw_winnerEntryId_key" ON "WeeklyDraw"("winnerEntryId");
CREATE UNIQUE INDEX "DrawEntry_codeHash_key" ON "DrawEntry"("codeHash");
CREATE INDEX "DrawEntry_drawId_status_issuedAt_idx" ON "DrawEntry"("drawId", "status", "issuedAt");
CREATE INDEX "DrawEntry_businessId_issuedAt_idx" ON "DrawEntry"("businessId", "issuedAt");
CREATE INDEX "DrawEntry_customerId_status_claimedAt_idx" ON "DrawEntry"("customerId", "status", "claimedAt");

ALTER TABLE "DrawEntry" ADD CONSTRAINT "DrawEntry_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "WeeklyDraw"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DrawEntry" ADD CONSTRAINT "DrawEntry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DrawEntry" ADD CONSTRAINT "DrawEntry_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DrawEntry" ADD CONSTRAINT "DrawEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WeeklyDraw" ADD CONSTRAINT "WeeklyDraw_winnerEntryId_fkey" FOREIGN KEY ("winnerEntryId") REFERENCES "DrawEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WeeklyDraw" ADD CONSTRAINT "WeeklyDraw_minimumPurchase_check" CHECK ("minimumPurchase" >= 200);
ALTER TABLE "DrawEntry" ADD CONSTRAINT "DrawEntry_purchaseAmount_check" CHECK ("purchaseAmount" >= 200);
