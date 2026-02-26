import { describe, expect, it, vi } from "vitest";
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
      promptId: "prompt-1",
      prompt: { id: "prompt-1", promptText: "Add feature", category: "feature" },
      project: { id: "proj-1", name: "Proj", slug: "proj" },
    }),
  },
  promptRequest: {
    update: vi.fn().mockResolvedValue(undefined),
  },
} as any;

describe("PromptExecutionService", () => {
  it("executes provider and updates prompt summary", async () => {
    const service = new PromptExecutionService(prismaMock, providerMock);
    const result = await service.execute({ id: "job-1", tenantId: "t1", projectId: "proj-1", promptId: "prompt-1" });

    expect(providerMock.execute).toHaveBeenCalled();
    expect(prismaMock.promptRequest.update).toHaveBeenCalledWith({
      where: { id: "prompt-1" },
      data: expect.objectContaining({ resultSummary: result.summary, executionProvider: "mock" }),
    });
  });
});
