import { z } from "zod";

export const projectPayloadSchema = z.object({
  name: z.string().min(3),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  repositoryUrl: z.string().url().optional(),
  defaultBranch: z.string().min(1).default("main"),
  environmentCfg: z.record(z.unknown()).optional(),
});

export const projectUpdateSchema = projectPayloadSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required",
);
