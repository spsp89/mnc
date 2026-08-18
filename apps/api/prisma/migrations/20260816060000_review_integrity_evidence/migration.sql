-- Legacy review rows may only retain a verified-interaction badge when the
-- platform has an order or enquiry record supporting that claim.
UPDATE "Review"
SET "verifiedInteraction" = false
WHERE "verifiedInteraction" = true
  AND "orderId" IS NULL
  AND "enquiryId" IS NULL;

ALTER TABLE "Review"
ADD CONSTRAINT "Review_verifiedInteraction_has_evidence_check"
CHECK (
  "verifiedInteraction" = false
  OR "orderId" IS NOT NULL
  OR "enquiryId" IS NOT NULL
);
