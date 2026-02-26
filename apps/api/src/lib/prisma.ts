import { PrismaClient } from "@prisma/client";

const datasourceUrl = process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error("DATABASE_URL is not defined");
}

export const prisma = new PrismaClient({
  datasourceUrl,
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
