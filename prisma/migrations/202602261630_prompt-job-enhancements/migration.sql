ALTER TABLE "PromptRequest"
  ADD COLUMN "category" TEXT,
  ADD COLUMN "executionProvider" TEXT,
  ADD COLUMN "resultSummary" JSONB,
  ADD COLUMN "lastError" TEXT;

ALTER TABLE "ChangeJob"
  ADD COLUMN "connectorId" TEXT,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "tokenCost" INTEGER,
  ADD COLUMN "durationMs" INTEGER,
  ADD COLUMN "errorMessage" TEXT,
  ADD COLUMN "statusReason" TEXT,
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ChangeJob"
  ADD CONSTRAINT "ChangeJob_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
