import type { PrismaClient, PromptRequest, ChangeJob } from "@prisma/client";
import { jobQueue } from "../../services/job-queue";

interface CreatePromptInput {
  tenantId: string;
  authorId?: string;
  projectId: string;
  promptText: string;
}

export async function createPromptWithJob(prisma: PrismaClient, input: CreatePromptInput) {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, tenantId: input.tenantId },
    select: { id: true },
  });

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND_IN_TENANT");
  }

  const prompt = await prisma.promptRequest.create({
    data: {
      tenantId: input.tenantId,
      projectId: project.id,
      authorId: input.authorId,
      promptText: input.promptText,
      status: "PLANNING",
    },
  });

  const job = await prisma.changeJob.create({
    data: {
      tenantId: input.tenantId,
      projectId: project.id,
      promptId: prompt.id,
      status: "QUEUED",
    },
  });

  await jobQueue.enqueueChangeJob({ id: job.id, tenantId: input.tenantId, projectId: project.id, promptId: prompt.id });

  return { prompt, job } satisfies { prompt: PromptRequest; job: ChangeJob };
}
