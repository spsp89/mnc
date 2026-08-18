ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BOOKING_REMINDER';

CREATE TABLE "BookingProvider" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT,
  "imageUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingProviderService" (
  "providerId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  CONSTRAINT "BookingProviderService_pkey" PRIMARY KEY ("providerId", "serviceId")
);

CREATE TABLE "BookingSchedule" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "serviceId" TEXT,
  "weekday" INTEGER NOT NULL,
  "startsMinute" INTEGER NOT NULL,
  "endsMinute" INTEGER NOT NULL,
  "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingTimeOff" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingTimeOff_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Booking"
  ADD COLUMN "providerId" TEXT,
  ADD COLUMN "rescheduledAt" TIMESTAMP(3),
  ADD COLUMN "reminder24hSentAt" TIMESTAMP(3),
  ADD COLUMN "reminder2hSentAt" TIMESTAMP(3);

CREATE INDEX "BookingProvider_businessId_isActive_name_idx" ON "BookingProvider"("businessId", "isActive", "name");
CREATE INDEX "BookingProviderService_serviceId_providerId_idx" ON "BookingProviderService"("serviceId", "providerId");
CREATE INDEX "BookingSchedule_businessId_weekday_isActive_idx" ON "BookingSchedule"("businessId", "weekday", "isActive");
CREATE INDEX "BookingSchedule_providerId_weekday_isActive_idx" ON "BookingSchedule"("providerId", "weekday", "isActive");
CREATE INDEX "BookingSchedule_serviceId_weekday_isActive_idx" ON "BookingSchedule"("serviceId", "weekday", "isActive");
CREATE INDEX "BookingTimeOff_providerId_startsAt_endsAt_idx" ON "BookingTimeOff"("providerId", "startsAt", "endsAt");
CREATE INDEX "Booking_providerId_status_startsAt_idx" ON "Booking"("providerId", "status", "startsAt");

ALTER TABLE "BookingProvider" ADD CONSTRAINT "BookingProvider_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingProviderService" ADD CONSTRAINT "BookingProviderService_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "BookingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingProviderService" ADD CONSTRAINT "BookingProviderService_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingSchedule" ADD CONSTRAINT "BookingSchedule_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingSchedule" ADD CONSTRAINT "BookingSchedule_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "BookingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingSchedule" ADD CONSTRAINT "BookingSchedule_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingTimeOff" ADD CONSTRAINT "BookingTimeOff_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "BookingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "BookingProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
