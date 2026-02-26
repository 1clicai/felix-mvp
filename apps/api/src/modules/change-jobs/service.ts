import type { PrismaClient, ChangeJob } from "@prisma/client";

const TRANSITIONS: Record<ChangeJob["status"], ChangeJob["status"][]> = {
  QUEUED: ["RUNNING", "FAILED", "CANCELED"],
  RUNNING: ["SUCCEEDED", "FAILED", "CANCELED"],
  SUCCEEDED: [],
  FAILED: [],
  CANCELED: [],
};

interface ListJobsInput {
  tenantId: string;
  projectId: string;
}

interface JobLookupInput {
  tenantId: string;
  jobId: string;
}

interface TransitionInput extends JobLookupInput {
  status: ChangeJob["status"];
}

export async function listJobsByProject(prisma: PrismaClient, input: ListJobsInput) {
  return prisma.changeJob.findMany({
    where: { tenantId: input.tenantId, projectId: input.projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobByIdOrThrow(prisma: PrismaClient, input: JobLookupInput) {
  const job = await prisma.changeJob.findFirst({
    where: { id: input.jobId, tenantId: input.tenantId },
  });

  if (!job) {
    throw new Error("JOB_NOT_FOUND");
  }

  return job;
}

export async function transitionJobStatus(prisma: PrismaClient, input: TransitionInput) {
  const job = await getJobByIdOrThrow(prisma, input);

  if (!TRANSITIONS[job.status].includes(input.status)) {
    throw new Error("INVALID_TRANSITION");
  }

  return prisma.changeJob.update({
    where: { id: job.id },
    data: { status: input.status, completedAt: new Date() },
  });
}
