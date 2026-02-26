import { beforeEach, describe, expect, it, vi } from "vitest";
import { PromptExecutionService } from "../execution-service";
import type { PromptExecutionProvider } from "../types";

const providerMock: PromptExecutionProvider = {
  execute: vi.fn().mockResolvedValue({
    provider: "mock",
    summary: {
      overview: "overview",
      intent: "intent",
      proposedChanges: [],
      risks: [],
      nextSteps: [],
    },
    metadata: {},
    tokensUsed: 10,
  }),
};

const prismaMock = {
  changeJob: {
    findUnique: vi.fn().mockResolvedValue({
      id: "job-1",
      tenantId: "t1",
      projectId: "proj-1",
      connectorId: "connector-1",
      promptId: "prompt-1",
      prompt: { id: "prompt-1", promptText: "Add feature", category: "feature" },
      project: { id: "proj-1", name: "Proj", slug: "proj" },
      connector: { id: "connector-1", repoOwner: "owner", repoName: "repo", defaultBranch: "main" },
    }),
  },
  connectorIngestionRun: {
    findFirst: vi.fn(),
  },
  projectContextDocument: {
    findMany: vi.fn(),
  },
  promptRequest: {
    update: vi.fn().mockResolvedValue(undefined),
  },
} as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PromptExecutionService", () => {
  it("executes provider and updates prompt summary without ingestion", async () => {
    prismaMock.connectorIngestionRun.findFirst.mockResolvedValue(null);

    const service = new PromptExecutionService(prismaMock, providerMock);
    const outcome = await service.execute({ id: "job-1", tenantId: "t1", projectId: "proj-1", promptId: "prompt-1" });

    expect(providerMock.execute).toHaveBeenCalled();
    expect(providerMock.execute).toHaveBeenCalledWith(expect.objectContaining({ ingestion: undefined }));
    expect(prismaMock.promptRequest.update).toHaveBeenCalledWith({
      where: { id: "prompt-1" },
      data: expect.objectContaining({ resultSummary: outcome.result.summary, executionProvider: "mock" }),
    });
  });

  it("passes ingestion context when available", async () => {
    prismaMock.connectorIngestionRun.findFirst.mockResolvedValue({ id: "run-1" });
    prismaMock.projectContextDocument.findMany.mockResolvedValue([
      { id: "doc1", type: "readme", sourcePath: "README.md", contentPreview: "content" },
      { id: "doc2", type: "file_tree", sourcePath: "tree", metadata: { entries: [{ path: "src/index.ts" }] } },
    ]);

    const service = new PromptExecutionService(prismaMock, providerMock);
    await service.execute({ id: "job-1", tenantId: "t1", projectId: "proj-1", promptId: "prompt-1" });

    const args = providerMock.execute.mock.calls[0][0];
    expect(args.ingestion).toBeDefined();
    expect(args.ingestion?.documents.length).toBeGreaterThan(0);
  });
});
