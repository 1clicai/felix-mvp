import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SESSION_SECRET: z.string().min(16),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_PRIVATE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional().default("gpt-4.1-mini"),
  CONNECTOR_SECRET_ENCRYPTION_KEY: z.string().min(44),
});

export const env = envSchema.parse(process.env);
