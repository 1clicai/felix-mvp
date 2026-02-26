import Fastify from "fastify";
import { registerModules } from "./modules";
import { authGuard } from "./plugins/auth";

export function buildServer() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  app.register(authGuard);
  app.register(registerModules, { prefix: "/api" });

  return app;
}
