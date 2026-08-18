CREATE TYPE "DeliveryShipmentStatus" AS ENUM ('QUOTED', 'REQUESTED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED');

CREATE TABLE "DeliveryShipment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerRef" TEXT,
  "status" "DeliveryShipmentStatus" NOT NULL DEFAULT 'QUOTED',
  "quotedAmount" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "trackingUrl" TEXT,
  "providerData" JSONB,
  "requestedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryShipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryShipment_orderId_key" ON "DeliveryShipment"("orderId");
CREATE INDEX "DeliveryShipment_businessId_status_createdAt_idx" ON "DeliveryShipment"("businessId", "status", "createdAt");
CREATE INDEX "DeliveryShipment_customerId_createdAt_idx" ON "DeliveryShipment"("customerId", "createdAt");
CREATE INDEX "DeliveryShipment_provider_providerRef_idx" ON "DeliveryShipment"("provider", "providerRef");

ALTER TABLE "DeliveryShipment" ADD CONSTRAINT "DeliveryShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryShipment" ADD CONSTRAINT "DeliveryShipment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryShipment" ADD CONSTRAINT "DeliveryShipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
