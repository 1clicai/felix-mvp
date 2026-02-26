import Fastify from "fastify";
import { registerModules } from "./modules";

export function buildServer() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  app.register(registerModules, { prefix: "/api" });

  return app;
}
