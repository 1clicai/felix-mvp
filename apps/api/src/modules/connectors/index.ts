import type { FastifyInstance } from "fastify";

export async function connectorsModule(app: FastifyInstance) {
  app.get("/connectors", async () => ({ data: [], note: "Connector registry placeholder" }));

  app.post("/connectors/:type/test", async (request) => {
    return { connector: request.params, status: "pending" };
  });
}
