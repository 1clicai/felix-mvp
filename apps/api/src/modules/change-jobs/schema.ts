import { z } from "zod";

export const jobTransitionSchema = z.object({
  status: z.enum(["RUNNING", "SUCCEEDED", "FAILED", "CANCELED"]),
});
