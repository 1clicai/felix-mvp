import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { promptCreateSchema } from "./schema";
import { createPromptWithJob } from "./service";
import { getProjectOrThrow } from "../projects/access";

const projectParamsSchema = z.object({ projectId: z.string().cuid() });
const promptParamsSchema = projectParamsSchema.extend({ id: z.string().cuid() });

export async function promptsModule(app: FastifyInstance) {
  app.get("/prompts", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();

    const prompts = await prisma.promptRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return { data: prompts };
  });

  app.get("/projects/:projectId/prompts", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();
    const params = projectParamsSchema.parse(request.params);

    await getProjectOrThrow(app, tenantId, params.projectId);

    const prompts = await prisma.promptRequest.findMany({
      where: { tenantId, projectId: params.projectId },
      orderBy: { createdAt: "desc" },
    });

    return { data: prompts };
  });

  app.get("/projects/:projectId/prompts/:id", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();
    const params = promptParamsSchema.parse(request.params);

    await getProjectOrThrow(app, tenantId, params.projectId);

    const prompt = await prisma.promptRequest.findFirst({
      where: { id: params.id, tenantId },
      include: { jobs: true },
    });

    if (!prompt || prompt.projectId !== params.projectId) {
      throw app.httpErrors.notFound("Prompt not found");
    }

    return { data: prompt };
  });

  app.post("/prompts", async (request) => {
    const auth = request.auth;
    if (!auth) throw app.httpErrors.unauthorized();

    const payload = promptCreateSchema.parse(request.body);

    try {
      const result = await createPromptWithJob(prisma, {
        tenantId: auth.tenantId,
        authorId: auth.userId,
        projectId: payload.projectId,
        promptText: payload.promptText,
        category: payload.category,
        connectorId: payload.connectorId,
      });

      return { data: result };
    } catch (error) {
      if ((error as Error).message === "PROJECT_NOT_FOUND_IN_TENANT") {
        throw app.httpErrors.notFound("Project not found");
      }
      if ((error as Error).message === "CONNECTOR_NOT_FOUND_IN_PROJECT") {
        throw app.httpErrors.notFound("Connector not found in project");
      }
      request.log.error({ err: error }, "Failed to create prompt");
      throw app.httpErrors.internalServerError();
    }
  });
}
