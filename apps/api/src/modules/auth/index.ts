import type { FastifyInstance } from "fastify";

export async function authModule(app: FastifyInstance) {
  app.get("/auth/health", async () => ({ scope: "auth", status: "ok" }));

  app.post("/auth/sessions", async () => {
    // TODO: implement session creation via upstream identity provider.
    return { message: "Session bootstrap placeholder" };
  });
}
