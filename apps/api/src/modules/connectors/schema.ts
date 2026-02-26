import { z } from "zod";

export const connectorCreateSchema = z.object({
  provider: z.literal("github"),
  authType: z.literal("pat"),
  repoOwner: z.string().min(1),
  repoName: z.string().min(1),
  repoUrl: z.string().url().optional(),
  token: z.string().min(20, "Token looks too short"),
});

export const connectorUpdateSchema = z.object({
  repoOwner: z.string().min(1).optional(),
  repoName: z.string().min(1).optional(),
  repoUrl: z.string().url().optional(),
  token: z.string().min(20).optional(),
}).refine((data) => Object.keys(data).length > 0, "No fields to update");
