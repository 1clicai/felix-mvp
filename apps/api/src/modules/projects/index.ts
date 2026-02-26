import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { projectPayloadSchema, projectUpdateSchema } from "./schema";
import { getProjectOrThrow } from "./access";

const paramsSchema = z.object({ id: z.string().cuid() });

export async function projectsModule(app: FastifyInstance) {
  app.get("/projects", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();

    const projects = await prisma.project.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return { data: projects };
  });

  app.post("/projects", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();

    const payload = projectPayloadSchema.parse(request.body);

    try {
      const project = await prisma.project.create({
        data: { ...payload, tenantId },
      });
      return { data: project };
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        throw app.httpErrors.conflict("Project slug already exists");
      }
      request.log.error({ err: error }, "Failed to create project");
      throw app.httpErrors.internalServerError();
    }
  });

  app.get("/projects/:id", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();

    const params = paramsSchema.parse(request.params);
    const project = await getProjectOrThrow(app, tenantId, params.id);
    return { data: project };
  });

  app.put("/projects/:id", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();
    const params = paramsSchema.parse(request.params);
    const payload = projectUpdateSchema.parse(request.body);

    await getProjectOrThrow(app, tenantId, params.id);

    const project = await prisma.project.update({
      where: { id: params.id },
      data: payload,
    });
    return { data: project };
  });

  app.delete("/projects/:id", async (request, reply) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();
    const params = paramsSchema.parse(request.params);

    await getProjectOrThrow(app, tenantId, params.id);
    await prisma.project.delete({ where: { id: params.id } });
    reply.code(204);
    return null;
  });
}
