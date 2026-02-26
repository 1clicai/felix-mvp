import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { promptCreateSchema } from "./schema";
import { createPromptWithJob } from "./service";
import { getProjectOrThrow } from "../projects/access";

const projectParamsSchema = z.object({ projectId: z.string().cuid() });

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
      });

      return { data: result };
    } catch (error) {
      if ((error as Error).message === "PROJECT_NOT_FOUND_IN_TENANT") {
        throw app.httpErrors.notFound("Project not found");
      }
      request.log.error({ err: error }, "Failed to create prompt");
      throw app.httpErrors.internalServerError();
    }
  });
}
