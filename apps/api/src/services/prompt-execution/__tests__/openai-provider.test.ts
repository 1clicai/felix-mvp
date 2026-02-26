import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.fn();

vi.mock("openai", () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() => ({
    responses: {
      create: mockCreate,
    },
  })),
}));

let OpenAIPromptExecutionProvider: typeof import("../openai-provider").OpenAIPromptExecutionProvider;

beforeAll(async () => {
  process.env.SESSION_SECRET = "test-session-secret-123456";
  process.env.DATABASE_URL = "postgresql://test";
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_MODEL = "gpt-test";

  ({ OpenAIPromptExecutionProvider } = await import("../openai-provider"));
});

describe("OpenAIPromptExecutionProvider", () => {
  beforeEach(() => {
    mockCreate.mockResolvedValue({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                overview: "summary",
                intent: "intent",
                proposedChanges: [{ area: "frontend", description: "update UI" }],
                risks: ["risk"],
                nextSteps: ["step"],
              }),
            },
          ],
        },
      ],
      usage: { total_tokens: 42 },
    });
  });

  it("returns structured summary", async () => {
    const provider = new OpenAIPromptExecutionProvider();
    const result = await provider.execute({
      job: { id: "job-1", tenantId: "t1", projectId: "p1", promptId: "prompt-1" },
      prompt: { id: "prompt-1", promptText: "Add a feature", category: "feature" },
    });

    expect(result.provider).toBe("openai");
    expect(result.summary.intent).toBe("intent");
    expect(result.tokensUsed).toBe(42);
  });
});
