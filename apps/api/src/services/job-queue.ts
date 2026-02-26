import { Queue } from "bullmq";
import { redisConnection, queueNamespace } from "../config/redis";

export interface ChangeJobPayload {
  id: string;
  tenantId: string;
  projectId: string;
  promptId?: string;
}

export interface JobQueue {
  enqueueChangeJob(job: ChangeJobPayload): Promise<void>;
}

const isTest = process.env.NODE_ENV === "test";
export const CHANGE_JOB_QUEUE = `${queueNamespace}`;

const bullQueue = !isTest
  ? new Queue<ChangeJobPayload>(CHANGE_JOB_QUEUE, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    })
  : undefined;

class BullJobQueue implements JobQueue {
  async enqueueChangeJob(job: ChangeJobPayload) {
    if (!bullQueue) {
      if (!isTest) {
        console.warn("Job queue unavailable (missing Redis connection)");
      }
      return;
    }

    await bullQueue.add("process-change-job", job);
  }
}

export const jobQueue: JobQueue = new BullJobQueue();
