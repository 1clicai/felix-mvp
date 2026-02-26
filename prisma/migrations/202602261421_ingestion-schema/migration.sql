CREATE TYPE "IngestionStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "ConnectorIngestionRun" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "connectorId" TEXT NOT NULL,
  "status" "IngestionStatus" NOT NULL DEFAULT 'QUEUED',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "error" TEXT,
  "filesCount" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConnectorIngestionRun_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConnectorIngestionRun_project_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConnectorIngestionRun_connector_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ConnectorIngestionRun_tenant_project_idx" ON "ConnectorIngestionRun" ("tenantId", "projectId");
CREATE INDEX "ConnectorIngestionRun_connector_idx" ON "ConnectorIngestionRun" ("connectorId");

CREATE TABLE "ProjectContextDocument" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "connectorId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "sourcePath" TEXT NOT NULL,
  "checksum" TEXT,
  "sizeBytes" INTEGER,
  "contentPreview" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectContextDocument_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectContextDocument_project_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectContextDocument_connector_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ProjectContextDocument_tenant_project_type_idx" ON "ProjectContextDocument" ("tenantId", "projectId", "type");
CREATE INDEX "ProjectContextDocument_connector_idx" ON "ProjectContextDocument" ("connectorId");
