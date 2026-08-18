CREATE TYPE "ClubEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "ClubEventRegistrationStatus" AS ENUM ('ATTENDING', 'CANCELLED');

ALTER TABLE "ClubMembership"
  ADD COLUMN "moderatedAt" TIMESTAMP(3),
  ADD COLUMN "moderatedById" TEXT,
  ADD COLUMN "moderationReason" TEXT;

ALTER TABLE "ClubMessage"
  ADD COLUMN "moderatedById" TEXT,
  ADD COLUMN "moderationReason" TEXT;

CREATE TABLE "ClubEvent" (
  "id" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "venue" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "capacity" INTEGER,
  "status" "ClubEventStatus" NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClubEventRegistration" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "status" "ClubEventRegistrationStatus" NOT NULL DEFAULT 'ATTENDING',
  "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubEventRegistration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClubReferral" (
  "id" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "referredBusiness" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "status" "ReferralStatus" NOT NULL DEFAULT 'NEW',
  "convertedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubReferral_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClubEvent_chapterId_status_startsAt_idx" ON "ClubEvent"("chapterId", "status", "startsAt");
CREATE INDEX "ClubEvent_createdById_createdAt_idx" ON "ClubEvent"("createdById", "createdAt");
CREATE UNIQUE INDEX "ClubEventRegistration_eventId_membershipId_key" ON "ClubEventRegistration"("eventId", "membershipId");
CREATE INDEX "ClubEventRegistration_membershipId_status_idx" ON "ClubEventRegistration"("membershipId", "status");
CREATE INDEX "ClubReferral_chapterId_status_createdAt_idx" ON "ClubReferral"("chapterId", "status", "createdAt");
CREATE INDEX "ClubReferral_membershipId_createdAt_idx" ON "ClubReferral"("membershipId", "createdAt");
CREATE INDEX "ClubReferral_createdById_createdAt_idx" ON "ClubReferral"("createdById", "createdAt");

ALTER TABLE "ClubEvent" ADD CONSTRAINT "ClubEvent_chapterId_fkey"
  FOREIGN KEY ("chapterId") REFERENCES "ClubChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubEvent" ADD CONSTRAINT "ClubEvent_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClubEventRegistration" ADD CONSTRAINT "ClubEventRegistration_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubEventRegistration" ADD CONSTRAINT "ClubEventRegistration_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "ClubMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubReferral" ADD CONSTRAINT "ClubReferral_chapterId_fkey"
  FOREIGN KEY ("chapterId") REFERENCES "ClubChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubReferral" ADD CONSTRAINT "ClubReferral_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "ClubMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubReferral" ADD CONSTRAINT "ClubReferral_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
