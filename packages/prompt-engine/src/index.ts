import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { DeploymentPlanSummary } from "@felix/core";

const promptInputSchema = z.object({
  tenantId: z.string(),
  prompt: z.string().min(10),
});

export type PromptInput = z.infer<typeof promptInputSchema>;

export const generatePlanFromPrompt = (
  input: PromptInput,
): DeploymentPlanSummary => {
  const parsed = promptInputSchema.parse(input);

  return {
    id: randomUUID(),
    tenantId: parsed.tenantId,
    title: parsed.prompt.slice(0, 64),
    riskLevel: "medium",
    estimatedTokens: 120,
    steps: [
      { description: "Ingest repository context" },
      { description: "Generate diff", tokenCost: 60 },
      { description: "Await approval" },
    ],
  };
};
