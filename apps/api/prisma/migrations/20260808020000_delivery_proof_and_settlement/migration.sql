CREATE TYPE "DeliverySettlementStatus" AS ENUM ('PENDING', 'READY', 'SETTLED', 'DISPUTED');

ALTER TABLE "DeliveryShipment"
  ADD COLUMN "driverName" TEXT,
  ADD COLUMN "driverPhone" TEXT,
  ADD COLUMN "vehicleNumber" TEXT;

CREATE TABLE "DeliveryProof" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "objectKey" TEXT,
  "receiverName" TEXT NOT NULL,
  "notes" TEXT,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "capturedById" TEXT NOT NULL,
  CONSTRAINT "DeliveryProof_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliverySettlement" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "status" "DeliverySettlementStatus" NOT NULL DEFAULT 'PENDING',
  "grossAmount" DECIMAL(12,2) NOT NULL,
  "providerFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "netPayable" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "reference" TEXT,
  "notes" TEXT,
  "readyAt" TIMESTAMP(3),
  "settledAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliverySettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryProof_shipmentId_key" ON "DeliveryProof"("shipmentId");
CREATE INDEX "DeliveryProof_capturedById_capturedAt_idx" ON "DeliveryProof"("capturedById", "capturedAt");
CREATE INDEX "DeliveryProof_capturedAt_idx" ON "DeliveryProof"("capturedAt");
CREATE UNIQUE INDEX "DeliverySettlement_shipmentId_key" ON "DeliverySettlement"("shipmentId");
CREATE INDEX "DeliverySettlement_status_createdAt_idx" ON "DeliverySettlement"("status", "createdAt");
CREATE INDEX "DeliverySettlement_createdById_createdAt_idx" ON "DeliverySettlement"("createdById", "createdAt");

ALTER TABLE "DeliveryProof" ADD CONSTRAINT "DeliveryProof_shipmentId_fkey"
  FOREIGN KEY ("shipmentId") REFERENCES "DeliveryShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryProof" ADD CONSTRAINT "DeliveryProof_capturedById_fkey"
  FOREIGN KEY ("capturedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliverySettlement" ADD CONSTRAINT "DeliverySettlement_shipmentId_fkey"
  FOREIGN KEY ("shipmentId") REFERENCES "DeliveryShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliverySettlement" ADD CONSTRAINT "DeliverySettlement_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
