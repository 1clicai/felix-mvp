import type { FastifyInstance } from "fastify";

export async function projectsModule(app: FastifyInstance) {
  app.get("/projects", async () => {
    return { data: [], note: "List projects for tenant" };
  });

  app.post("/projects", async () => {
    return { message: "Project creation placeholder" };
  });
}
