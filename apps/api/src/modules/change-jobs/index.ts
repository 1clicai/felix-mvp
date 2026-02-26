import type { FastifyInstance } from "fastify";

export async function changeJobsModule(app: FastifyInstance) {
  app.get("/change-jobs", async () => ({ data: [], note: "Change job queue placeholder" }));

  app.post("/change-jobs/:id/retry", async (request) => ({ id: request.params, status: "queued" }));
}
