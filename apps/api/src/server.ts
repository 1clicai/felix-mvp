import Fastify from "fastify";
import { z } from "zod";

const server = Fastify({ logger: true });

server.get("/health", async () => ({ status: "ok" }));

const tokenEstimateSchema = z.object({
  module: z.string(),
  action: z.string(),
  estimatedTokens: z.number().int().nonnegative(),
});

server.post("/token/estimate", async (request, reply) => {
  const body = tokenEstimateSchema.safeParse(request.body);

  if (!body.success) {
    return reply.status(400).send({ errors: body.error.flatten() });
  }

  return { ...body.data, currencyEstimate: body.data.estimatedTokens * 0.005 };
});

const port = Number(process.env.PORT ?? 4000);

server
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    server.log.info(`API listening on http://localhost:${port}`);
  })
  .catch((error) => {
    server.log.error(error, "Failed to start API");
    process.exit(1);
  });
