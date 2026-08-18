-- Refunds can belong to marketplace orders or subscription payments.
ALTER TABLE "Refund" ALTER COLUMN "orderId" DROP NOT NULL;

-- Preserve the operational origin and reconciliation evidence for every refund.
ALTER TABLE "Refund"
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'PROVIDER',
  ADD COLUMN "method" TEXT,
  ADD COLUMN "externalReference" TEXT,
  ADD COLUMN "requestedById" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "failureReason" TEXT,
  ADD COLUMN "metadata" JSONB;

DROP INDEX IF EXISTS "Refund_paymentId_idx";
CREATE INDEX "Refund_paymentId_status_idx" ON "Refund"("paymentId", "status");
CREATE INDEX "Refund_source_status_requestedAt_idx" ON "Refund"("source", "status", "requestedAt");
CREATE INDEX "Refund_requestedById_requestedAt_idx" ON "Refund"("requestedById", "requestedAt");
