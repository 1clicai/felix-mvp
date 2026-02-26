import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { CHANGE_JOB_QUEUE, ChangeJobPayload } from "../services/job-queue";
import { prisma } from "../lib/prisma";

const worker = new Worker<ChangeJobPayload>(
  CHANGE_JOB_QUEUE,
  async (job) => {
    const start = Date.now();
    await prisma.changeJob.update({
      where: { id: job.data.id },
      data: { status: "RUNNING", startedAt: new Date(), statusReason: "worker-processing" },
    });

    try {
      await simulateWork();

      await prisma.changeJob.update({
        where: { id: job.data.id },
        data: {
          status: "SUCCEEDED",
          completedAt: new Date(),
          durationMs: Date.now() - start,
          statusReason: "stubbed-success",
        },
      });
    } catch (error) {
      await prisma.changeJob.update({
        where: { id: job.data.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage: (error as Error).message,
          statusReason: "worker-error",
        },
      });
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

worker.on("completed", (job) => {
  console.info(`[worker] job ${job.id} completed`);
});

worker.on("failed", async (job, err) => {
  console.error(`[worker] job ${job?.id} failed`, err);
  if (job) {
    await prisma.changeJob.update({
      where: { id: job.data.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: err.message,
        statusReason: "worker-failed",
      },
    });
  }
});

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

async function simulateWork() {
  await new Promise((resolve) => setTimeout(resolve, 500));
}
