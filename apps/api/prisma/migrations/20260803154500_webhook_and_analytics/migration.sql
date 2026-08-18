-- Add a non-active state for paid subscription checkouts.
ALTER TYPE "SubscriptionStatus"
ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT' BEFORE 'TRIAL';

-- Durable payment webhook ingestion and processing state.
CREATE TYPE "WebhookEventStatus" AS ENUM (
  'RECEIVED',
  'PROCESSING',
  'PROCESSED',
  'IGNORED',
  'FAILED'
);

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key"
ON "WebhookEvent"("provider", "eventId");

CREATE INDEX "WebhookEvent_status_receivedAt_idx"
ON "WebhookEvent"("status", "receivedAt");

CREATE INDEX "WebhookEvent_eventType_receivedAt_idx"
ON "WebhookEvent"("eventType", "receivedAt");

-- Privacy-minimised product analytics for discovery and conversion reporting.
CREATE TYPE "AnalyticsEventType" AS ENUM (
  'SEARCH_IMPRESSION',
  'PROFILE_VIEW',
  'CALL_CLICK',
  'WHATSAPP_CLICK',
  'DIRECTIONS_CLICK',
  'SAVE_BUSINESS',
  'ENQUIRY_START',
  'ENQUIRY_SUBMITTED'
);

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "eventType" "AnalyticsEventType" NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT,
  "businessId" TEXT,
  "categoryId" TEXT,
  "city" TEXT,
  "locality" TEXT,
  "source" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_businessId_eventType_occurredAt_idx"
ON "AnalyticsEvent"("businessId", "eventType", "occurredAt");

CREATE INDEX "AnalyticsEvent_categoryId_eventType_occurredAt_idx"
ON "AnalyticsEvent"("categoryId", "eventType", "occurredAt");

CREATE INDEX "AnalyticsEvent_sessionId_occurredAt_idx"
ON "AnalyticsEvent"("sessionId", "occurredAt");

CREATE INDEX "AnalyticsEvent_city_eventType_occurredAt_idx"
ON "AnalyticsEvent"("city", "eventType", "occurredAt");
