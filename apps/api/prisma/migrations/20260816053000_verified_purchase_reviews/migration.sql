ALTER TABLE "Review"
  ADD COLUMN "orderId" TEXT;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Review_orderId_key" ON "Review"("orderId");
