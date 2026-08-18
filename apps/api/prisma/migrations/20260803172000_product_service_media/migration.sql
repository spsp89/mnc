-- Product and service media stay private until an asynchronous scan approves publication.
CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "mediaType" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "scanStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ServiceMedia" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "mediaType" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "scanStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceMedia_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ServiceMedia_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProductMedia_productId_objectKey_key" ON "ProductMedia"("productId", "objectKey");
CREATE INDEX "ProductMedia_productId_mediaType_sortOrder_idx" ON "ProductMedia"("productId", "mediaType", "sortOrder");
CREATE INDEX "ProductMedia_scanStatus_idx" ON "ProductMedia"("scanStatus");
CREATE UNIQUE INDEX "ServiceMedia_serviceId_objectKey_key" ON "ServiceMedia"("serviceId", "objectKey");
CREATE INDEX "ServiceMedia_serviceId_mediaType_sortOrder_idx" ON "ServiceMedia"("serviceId", "mediaType", "sortOrder");
CREATE INDEX "ServiceMedia_scanStatus_idx" ON "ServiceMedia"("scanStatus");
