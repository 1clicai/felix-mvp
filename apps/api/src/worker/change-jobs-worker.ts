import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { CHANGE_JOB_QUEUE, ChangeJobPayload } from "../services/job-queue";
import { prisma } from "../lib/prisma";
import { PromptExecutionService } from "../services/prompt-execution/execution-service";
import { OpenAIPromptExecutionProvider } from "../services/prompt-execution/openai-provider";

let executionService: PromptExecutionService | null = null;
try {
  executionService = new PromptExecutionService(prisma, new OpenAIPromptExecutionProvider());
  console.info("[worker] Prompt execution provider initialized (OpenAI)");
} catch (error) {
  console.warn("[worker] Prompt execution disabled:", (error as Error).message);
}

const worker = new Worker<ChangeJobPayload>(
  CHANGE_JOB_QUEUE,
  async (job) => {
    const start = Date.now();
    await prisma.changeJob.update({
      where: { id: job.data.id },
      data: { status: "RUNNING", startedAt: new Date(), statusReason: "worker-processing" },
    });

    try {
      if (!executionService) {
        throw new Error("EXECUTION_PROVIDER_UNAVAILABLE");
      }

      const result = await executionService.execute(job.data);

      await prisma.changeJob.update({
        where: { id: job.data.id },
        data: {
          status: "SUCCEEDED",
          completedAt: new Date(),
          durationMs: Date.now() - start,
          statusReason: "llm-executed",
          provider: result.provider,
          tokenCost: result.tokensUsed ?? null,
          metadata: result.metadata,
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

      if (job.data.promptId) {
        await prisma.promptRequest.update({
          where: { id: job.data.promptId },
          data: { lastError: (error as Error).message },
        });
      }
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
  },
);

worker.on("completed", (job) => {
  console.info(`[worker] job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} failed`, err.message);
});

const shutdown = async () => {
  await worker.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
