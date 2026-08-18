ALTER TABLE "WeeklyDraw"
  ADD COLUMN "eligibilitySnapshot" JSONB,
  ADD COLUMN "candidateHash" TEXT,
  ADD COLUMN "selectionSeed" TEXT,
  ADD COLUMN "selectionHash" TEXT,
  ADD COLUMN "selectionIndex" INTEGER,
  ADD COLUMN "candidateCount" INTEGER,
  ADD COLUMN "usageEventCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "selectionAlgorithm" TEXT;

CREATE INDEX "WeeklyDraw_candidateHash_idx" ON "WeeklyDraw"("candidateHash");
