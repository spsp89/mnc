ALTER TABLE "Order"
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'ONLINE',
  ADD COLUMN "externalReference" TEXT,
  ADD COLUMN "createdById" TEXT;

CREATE UNIQUE INDEX "Order_externalReference_key" ON "Order"("externalReference");
CREATE INDEX "Order_source_createdAt_idx" ON "Order"("source", "createdAt");
CREATE INDEX "Order_createdById_createdAt_idx" ON "Order"("createdById", "createdAt");
