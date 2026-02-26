import type { FastifyInstance } from "fastify";

export async function promptsModule(app: FastifyInstance) {
  app.get("/prompts", async () => ({ data: [], note: "Prompt history placeholder" }));

  app.post("/prompts", async () => ({ message: "Prompt intake placeholder" }));
}
