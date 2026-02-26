-- Connector enum adjustments
CREATE TYPE "ConnectorProvider" AS ENUM ('GITHUB', 'CUSTOM');
CREATE TYPE "ConnectorAuthType" AS ENUM ('PAT', 'GITHUB_APP');
CREATE TYPE "ConnectorStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'INVALID', 'REVOKED');

ALTER TABLE "Connector"
  ALTER COLUMN "config" DROP NOT NULL,
  ADD COLUMN     "provider" "ConnectorProvider" NOT NULL DEFAULT 'GITHUB',
  ADD COLUMN     "authType" "ConnectorAuthType" NOT NULL DEFAULT 'PAT',
  ADD COLUMN     "repoOwner" TEXT,
  ADD COLUMN     "repoName" TEXT,
  ADD COLUMN     "repoUrl" TEXT,
  ADD COLUMN     "defaultBranch" TEXT,
  ADD COLUMN     "installationId" TEXT,
  ADD COLUMN     "appId" TEXT,
  ADD COLUMN     "credentialToken" TEXT,
  ADD COLUMN     "lastValidatedAt" TIMESTAMP(3),
  ADD COLUMN     "lastValidationError" TEXT;

-- migrate existing status values into new enum
ALTER TABLE "Connector"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Connector"
  ALTER COLUMN "status" TYPE "ConnectorStatus_new" USING (
    CASE "status"
      WHEN 'DISCONNECTED' THEN 'PENDING'
      WHEN 'CONNECTING' THEN 'PENDING'
      WHEN 'ACTIVE' THEN 'ACTIVE'
      WHEN 'ERROR' THEN 'INVALID'
    END::"ConnectorStatus_new"
  );

DROP TYPE "ConnectorStatus";
ALTER TYPE "ConnectorStatus_new" RENAME TO "ConnectorStatus";

ALTER TABLE "Connector"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE INDEX "Connector_tenantId_projectId_idx" ON "Connector" ("tenantId", "projectId");
