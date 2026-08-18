-- DropForeignKey
ALTER TABLE "Refund" DROP CONSTRAINT "Refund_orderId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropIndex
DROP INDEX "BusinessLocation_locationPoint_gist_idx";

-- DropIndex
DROP INDEX "WeeklyDraw_candidateHash_idx";

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
DO $$
BEGIN
    IF to_regclass('"Offer_targetCustomerId_moderationStatus_isActive_startsAt_endsA"') IS NOT NULL THEN
        ALTER INDEX "Offer_targetCustomerId_moderationStatus_isActive_startsAt_endsA"
            RENAME TO "Offer_targetCustomerId_moderationStatus_isActive_startsAt_e_idx";
    END IF;
END $$;
