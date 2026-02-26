import type { PrismaClient } from "@prisma/client";
import type { ChangeJobPayload } from "../job-queue";
import type { PromptExecutionProvider, PromptExecutionResult } from "./types";

export class PromptExecutionService {
  constructor(private prisma: PrismaClient, private provider: PromptExecutionProvider) {}

  async execute(jobPayload: ChangeJobPayload): Promise<PromptExecutionResult> {
    const jobRecord = await this.prisma.changeJob.findUnique({
      where: { id: jobPayload.id },
      include: {
        prompt: true,
        project: true,
        connector: true,
      },
    });

    if (!jobRecord?.prompt) {
      throw new Error("PROMPT_NOT_FOUND");
    }

    const result = await this.provider.execute({
      job: jobPayload,
      prompt: jobRecord.prompt,
      project: jobRecord.project ?? undefined,
      connector: jobRecord.connector ?? undefined,
    });

    await this.prisma.promptRequest.update({
      where: { id: jobRecord.promptId! },
      data: {
        resultSummary: result.summary,
        executionProvider: result.provider,
        lastError: null,
      },
    });

    return result;
  }
}
