import { prisma } from "../lib/prisma";
import type { ChangeJobPayload } from "./job-queue";

export class JobExecutor {
  async run(job: ChangeJobPayload) {
    await prisma.changeJob.update({
      where: { id: job.id },
      data: { status: "RUNNING", startedAt: new Date(), statusReason: "stub" },
    });

    setTimeout(async () => {
      try {
        await prisma.changeJob.update({
          where: { id: job.id },
          data: {
            status: "SUCCEEDED",
            completedAt: new Date(),
            durationMs: 1000,
            statusReason: "stubbed-success",
          },
        });
      } catch (error) {
        console.error("Failed to mark job complete", error);
      }
    }, 200);
  }
}

export const jobExecutor = new JobExecutor();
