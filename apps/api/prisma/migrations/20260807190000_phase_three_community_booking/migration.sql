CREATE TYPE "WeeklyDrawStatus" AS ENUM ('DRAFT', 'OPEN', 'DRAWN', 'PUBLISHED', 'CANCELLED');
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "ClubMembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WEEKLY_DRAW';

CREATE TABLE "WeeklyDraw" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "prizeDescription" TEXT NOT NULL,
  "weekStartsAt" TIMESTAMP(3) NOT NULL,
  "weekEndsAt" TIMESTAMP(3) NOT NULL,
  "status" "WeeklyDrawStatus" NOT NULL DEFAULT 'DRAFT',
  "winnerOrderId" TEXT,
  "winnerUserId" TEXT,
  "selectedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeeklyDraw_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClubChapter" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'Kerala',
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubChapter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClubMembership" (
  "id" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ClubMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClubMessage" (
  "id" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ClubMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "serviceId" TEXT,
  "customerId" TEXT NOT NULL,
  "providerName" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
  "customerNote" TEXT,
  "businessNote" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeeklyDraw_winnerOrderId_key" ON "WeeklyDraw"("winnerOrderId");
CREATE UNIQUE INDEX "WeeklyDraw_weekStartsAt_weekEndsAt_key" ON "WeeklyDraw"("weekStartsAt", "weekEndsAt");
CREATE INDEX "WeeklyDraw_status_weekStartsAt_idx" ON "WeeklyDraw"("status", "weekStartsAt");
CREATE INDEX "WeeklyDraw_winnerUserId_publishedAt_idx" ON "WeeklyDraw"("winnerUserId", "publishedAt");
CREATE UNIQUE INDEX "ClubChapter_slug_key" ON "ClubChapter"("slug");
CREATE INDEX "ClubChapter_isActive_district_city_idx" ON "ClubChapter"("isActive", "district", "city");
CREATE UNIQUE INDEX "ClubMembership_chapterId_businessId_key" ON "ClubMembership"("chapterId", "businessId");
CREATE INDEX "ClubMembership_userId_status_idx" ON "ClubMembership"("userId", "status");
CREATE INDEX "ClubMembership_businessId_status_idx" ON "ClubMembership"("businessId", "status");
CREATE INDEX "ClubMessage_chapterId_createdAt_idx" ON "ClubMessage"("chapterId", "createdAt");
CREATE INDEX "ClubMessage_senderId_createdAt_idx" ON "ClubMessage"("senderId", "createdAt");
CREATE INDEX "Booking_businessId_status_startsAt_idx" ON "Booking"("businessId", "status", "startsAt");
CREATE INDEX "Booking_customerId_startsAt_idx" ON "Booking"("customerId", "startsAt");
CREATE INDEX "Booking_serviceId_startsAt_idx" ON "Booking"("serviceId", "startsAt");

ALTER TABLE "WeeklyDraw" ADD CONSTRAINT "WeeklyDraw_winnerOrderId_fkey" FOREIGN KEY ("winnerOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WeeklyDraw" ADD CONSTRAINT "WeeklyDraw_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "ClubChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubMessage" ADD CONSTRAINT "ClubMessage_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "ClubChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubMessage" ADD CONSTRAINT "ClubMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
