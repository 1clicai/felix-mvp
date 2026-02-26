import { describe, expect, it, vi } from "vitest";
import { createPromptWithJob } from "../service";

vi.mock("../../../services/job-queue", () => ({
  jobQueue: { enqueueChangeJob: vi.fn().mockResolvedValue(undefined) },
}));

describe("createPromptWithJob", () => {
  const baseInput = {
    tenantId: "tenant-1",
    projectId: "project-1",
    promptText: "Add a new landing page hero section",
    authorId: "user-1",
  };

  it("creates prompt and job when project belongs to tenant", async () => {
    const prisma = {
      project: { findFirst: vi.fn().mockResolvedValue({ id: "project-1" }) },
      promptRequest: { create: vi.fn().mockResolvedValue({ id: "prompt-1" }) },
      changeJob: { create: vi.fn().mockResolvedValue({ id: "job-1" }) },
    } as unknown as Parameters<typeof createPromptWithJob>[0];

    const result = await createPromptWithJob(prisma, baseInput);

    expect(result.prompt.id).toBe("prompt-1");
    expect(result.job.id).toBe("job-1");
  });

  it("throws when project is missing", async () => {
    const prisma = {
      project: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as Parameters<typeof createPromptWithJob>[0];

    await expect(createPromptWithJob(prisma, baseInput)).rejects.toThrow("PROJECT_NOT_FOUND_IN_TENANT");
  });
});
