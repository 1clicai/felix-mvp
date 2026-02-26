import { jobExecutor } from "./job-executor";

export interface ChangeJobPayload {
  id: string;
  tenantId: string;
  projectId: string;
  promptId?: string;
}

export interface JobQueue {
  enqueueChangeJob(job: ChangeJobPayload): Promise<void>;
}

class InMemoryJobQueue implements JobQueue {
  async enqueueChangeJob(job: ChangeJobPayload) {
    // Stub implementation — replace with Redis/BullMQ worker later.
    queueMicrotask(() => {
      void jobExecutor.run(job);
    });
  }
}

export const jobQueue: JobQueue = new InMemoryJobQueue();
