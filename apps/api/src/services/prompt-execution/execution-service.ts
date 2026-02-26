import type { PrismaClient } from "@prisma/client";
import type { ChangeJobPayload } from "../job-queue";
import type {
  PromptExecutionProvider,
  PromptExecutionResult,
  IngestionContextDocument,
  PromptExecutionContext,
} from "./types";

const MAX_DOCS = 6;
const MAX_SUMMARY_LENGTH = 600;

type ExecutionOutcome = {
  result: PromptExecutionResult;
  ingestion?: NonNullable<PromptExecutionContext["ingestion"]>;
};

export class PromptExecutionService {
  constructor(private prisma: PrismaClient, private provider: PromptExecutionProvider) {}

  async execute(jobPayload: ChangeJobPayload): Promise<ExecutionOutcome> {
    const jobRecord = await this.prisma.changeJob.findUnique({
      where: { id: jobPayload.id },
      include: {
        prompt: true,
        project: true,
        connector: true,
      },
    });

    if (!jobRecord?.prompt) {
      throw new Error("PROMPT_NOT_FOUND");
    }

    const ingestionContext = jobRecord.connectorId
      ? await this.buildIngestionContext(jobRecord.tenantId, jobRecord.connectorId, jobRecord.projectId)
      : null;

    const result = await this.provider.execute({
      job: jobPayload,
      prompt: jobRecord.prompt,
      project: jobRecord.project ?? undefined,
      connector: jobRecord.connector ?? undefined,
      ingestion: ingestionContext ?? undefined,
    });

    await this.prisma.promptRequest.update({
      where: { id: jobRecord.promptId! },
      data: {
        resultSummary: result.summary,
        executionProvider: result.provider,
        lastError: null,
      },
    });

    return { result, ingestion: ingestionContext ?? undefined };
  }

  private async buildIngestionContext(tenantId: string, connectorId: string, projectId: string) {
    const run = await this.prisma.connectorIngestionRun.findFirst({
      where: { connectorId, tenantId, projectId, status: "SUCCEEDED" },
      orderBy: { completedAt: "desc" },
    });

    if (!run) return null;

    const documentsRaw = await this.prisma.projectContextDocument.findMany({
      where: { connectorId, tenantId, projectId },
      orderBy: { createdAt: "desc" },
      take: MAX_DOCS * 3,
    });

    const prioritizedTypes = ["repo_metadata", "file_tree", "readme", "doc", "manifest"];

    const documents: IngestionContextDocument[] = [];
    for (const type of prioritizedTypes) {
      for (const doc of documentsRaw) {
        if (doc.type !== type) continue;
        const summary = buildSummary(doc, MAX_SUMMARY_LENGTH);
        documents.push({ id: doc.id, type: doc.type, sourcePath: doc.sourcePath, summary });
        if (documents.length >= MAX_DOCS) break;
      }
      if (documents.length >= MAX_DOCS) break;
    }

    const repoDoc = documentsRaw.find((doc) => doc.type === "repo_metadata")?.metadata as
      | { name?: string; default_branch?: string; visibility?: string }
      | undefined;

    return {
      runId: run.id,
      repo: repoDoc
        ? { name: repoDoc.name, defaultBranch: repoDoc.default_branch, visibility: repoDoc.visibility }
        : undefined,
      documents,
      stats: {
        totalDocs: documentsRaw.length,
        includedDocs: documents.length,
        truncated: documentsRaw.length > documents.length,
      },
    };
  }
}

function buildSummary(doc: { contentPreview?: string | null; metadata?: any; type: string }, maxLength: number) {
  if (doc.contentPreview) {
    return truncate(doc.contentPreview, maxLength);
  }

  if (doc.type === "file_tree" && doc.metadata?.entries) {
    const entries = doc.metadata.entries.slice(0, 20).map((entry: any) => entry.path);
    const suffix = doc.metadata.entries.length > 20 ? " …" : "";
    return `File tree sample: ${entries.join(", ")}${suffix}`;
  }

  if (doc.metadata) {
    const str = JSON.stringify(doc.metadata);
    return truncate(str, maxLength);
  }

  return "";
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}
