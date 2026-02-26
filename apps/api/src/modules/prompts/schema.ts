import { z } from "zod";

export const promptCreateSchema = z.object({
  projectId: z.string().cuid(),
  connectorId: z.string().cuid().optional(),
  promptText: z.string().min(10, "Prompt must be at least 10 characters"),
  category: z.string().optional(),
});
