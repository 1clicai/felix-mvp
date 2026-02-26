import { Queue } from "bullmq";
import { redisConnection, queueNamespace } from "../config/redis";

export interface IngestionJobPayload {
  runId: string;
}

const isTest = process.env.NODE_ENV === "test";
export const CONNECTOR_INGESTION_QUEUE = `${queueNamespace}:ingestion`;

const bullQueue = !isTest
  ? new Queue<IngestionJobPayload>(CONNECTOR_INGESTION_QUEUE, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    })
  : undefined;

export async function enqueueIngestionJob(payload: IngestionJobPayload) {
  if (!bullQueue) {
    if (!isTest) {
      console.warn("[ingestion] queue unavailable");
    }
    return;
  }

  await bullQueue.add("connector-ingestion", payload);
}
