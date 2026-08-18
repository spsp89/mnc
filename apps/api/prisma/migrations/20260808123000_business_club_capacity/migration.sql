ALTER TABLE "ClubChapter"
ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 16;

ALTER TABLE "ClubChapter"
ADD CONSTRAINT "ClubChapter_capacity_check"
CHECK ("capacity" BETWEEN 2 AND 16);
