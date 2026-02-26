import { z } from "zod";

export const promptCreateSchema = z.object({
  projectId: z.string().cuid(),
  promptText: z.string().min(10, "Prompt must be at least 10 characters"),
});
