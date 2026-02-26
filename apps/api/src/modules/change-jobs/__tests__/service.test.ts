import { describe, expect, it, vi } from "vitest";
import { transitionJobStatus } from "../service";

const prismaMock = {
  changeJob: {
    update: vi.fn(),
  },
} as unknown as Parameters<typeof transitionJobStatus>[0];

describe("transitionJobStatus", () => {
  it("allows valid transitions", async () => {
    const prisma = {
      ...prismaMock,
      changeJob: {
        findFirst: vi.fn().mockResolvedValue({ id: "job-1", tenantId: "tenant-1", status: "QUEUED" }),
        update: vi.fn().mockResolvedValue({ id: "job-1", status: "RUNNING" }),
      },
    } as unknown as Parameters<typeof transitionJobStatus>[0];

    const job = await transitionJobStatus(prisma, {
      tenantId: "tenant-1",
      jobId: "job-1",
      status: "RUNNING",
    });

    expect(job.status).toBe("RUNNING");
  });

  it("rejects invalid transitions", async () => {
    const prisma = {
      ...prismaMock,
      changeJob: {
        findFirst: vi.fn().mockResolvedValue({ id: "job-1", tenantId: "tenant-1", status: "SUCCEEDED" }),
      },
    } as unknown as Parameters<typeof transitionJobStatus>[0];

    await expect(
      transitionJobStatus(prisma, {
        tenantId: "tenant-1",
        jobId: "job-1",
        status: "RUNNING",
      }),
    ).rejects.toThrow("INVALID_TRANSITION");
  });
});
