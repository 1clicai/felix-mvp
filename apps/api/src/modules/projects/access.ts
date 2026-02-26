import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { scopedProjectWhere } from "./scopes";

export async function getProjectOrThrow(app: FastifyInstance, tenantId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId },
  });

  if (!project) {
    throw app.httpErrors.notFound("Project not found in tenant scope");
  }

  return project;
}

export { scopedProjectWhere };
