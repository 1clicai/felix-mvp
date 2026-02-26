import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { enqueueIngestionJob } from "../../services/ingestion-queue";
import { getProjectOrThrow } from "../projects/access";

const connectorParams = z.object({ projectId: z.string().cuid(), id: z.string().cuid() });

export async function ingestionModule(app: FastifyInstance) {
  app.post("/projects/:projectId/connectors/:id/ingestion-runs", async (request) => {
    const auth = request.auth;
    if (!auth) throw app.httpErrors.unauthorized();
    const params = connectorParams.parse(request.params);
    await getProjectOrThrow(app, auth.tenantId, params.projectId);

    const connector = await prisma.connector.findFirst({
      where: { id: params.id, tenantId: auth.tenantId, projectId: params.projectId },
      select: { id: true },
    });
    if (!connector) throw app.httpErrors.notFound("Connector not found");

    const run = await prisma.connectorIngestionRun.create({
      data: {
        tenantId: auth.tenantId,
        projectId: params.projectId,
        connectorId: connector.id,
        status: "QUEUED",
      },
    });

    await enqueueIngestionJob({ runId: run.id });
    return { data: run };
  });

  app.get("/projects/:projectId/connectors/:id/ingestion-runs", async (request) => {
    const auth = request.auth;
    if (!auth) throw app.httpErrors.unauthorized();
    const params = connectorParams.parse(request.params);
    await getProjectOrThrow(app, auth.tenantId, params.projectId);

    const runs = await prisma.connectorIngestionRun.findMany({
      where: { connectorId: params.id, tenantId: auth.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return { data: runs };
  });
}
