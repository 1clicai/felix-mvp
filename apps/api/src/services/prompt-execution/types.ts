import type { ChangeJob, Connector, Project, PromptRequest } from "@prisma/client";

export interface IngestionContextDocument {
  id: string;
  type: string;
  sourcePath: string;
  summary: string;
}

export interface PromptExecutionContext {
  job: Pick<ChangeJob, "id" | "tenantId" | "projectId" | "promptId" | "connectorId">;
  prompt: Pick<PromptRequest, "id" | "promptText" | "category">;
  project?: Pick<Project, "id" | "name" | "slug" | "repositoryUrl">;
  connector?: Pick<Connector, "id" | "repoOwner" | "repoName" | "repoUrl" | "defaultBranch">;
  ingestion?: {
    runId: string;
    repo?: { name?: string; defaultBranch?: string; visibility?: string };
    documents: IngestionContextDocument[];
    stats: { totalDocs: number; includedDocs: number; truncated: boolean };
  };
}

export interface PromptExecutionResult {
  provider: string;
  summary: {
    overview: string;
    intent: string;
    proposedChanges: Array<{ area: string; description: string }>;
    risks: string[];
    nextSteps: string[];
  };
  metadata: Record<string, unknown>;
  tokensUsed?: number;
}

export interface PromptExecutionProvider {
  execute(context: PromptExecutionContext): Promise<PromptExecutionResult>;
}
