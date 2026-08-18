DROP INDEX IF EXISTS "Order_externalReference_key";
CREATE UNIQUE INDEX "Order_businessId_externalReference_key" ON "Order"("businessId", "externalReference");
