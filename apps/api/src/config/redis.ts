import { env } from "./env";
import type { RedisOptions } from "bullmq";

const fallbackUrl = "redis://localhost:6379";
const redisUrl = env.REDIS_URL ?? fallbackUrl;

const url = new URL(redisUrl);

export const redisConnection: RedisOptions = {
  host: url.hostname,
  port: Number(url.port || 6379),
  password: url.password || undefined,
  db: Number(url.pathname.replace("/", "")) || 0,
  maxRetriesPerRequest: null,
};

export const queueNamespace = "felix-change-jobs";
