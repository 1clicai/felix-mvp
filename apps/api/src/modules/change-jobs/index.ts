import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { getProjectOrThrow } from "../projects/access";
import { listJobsByProject, getJobByIdOrThrow, transitionJobStatus } from "./service";
import { jobTransitionSchema } from "./schema";

const projectParams = z.object({ projectId: z.string().cuid() });
const jobParams = z.object({ id: z.string().cuid() });

export async function changeJobsModule(app: FastifyInstance) {
  app.get("/projects/:projectId/change-jobs", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();

    const params = projectParams.parse(request.params);
    await getProjectOrThrow(app, tenantId, params.projectId);

    const jobs = await listJobsByProject(prisma, {
      tenantId,
      projectId: params.projectId,
    });

    return { data: jobs };
  });

  app.get("/projects/:projectId/change-jobs/:id", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();
    const params = projectParams.extend({ id: z.string().cuid() }).parse(request.params);

    await getProjectOrThrow(app, tenantId, params.projectId);

    const job = await getJobByIdOrThrow(prisma, {
      tenantId,
      jobId: params.id,
    });

    if (job.projectId !== params.projectId) {
      throw app.httpErrors.notFound("Job not in project scope");
    }

    return { data: job };
  });

  app.post("/change-jobs/:id/transition", async (request) => {
    const auth = request.auth;
    if (!auth) throw app.httpErrors.unauthorized();

    const params = jobParams.parse(request.params);
    const payload = jobTransitionSchema.parse(request.body);

    try {
      const job = await transitionJobStatus(prisma, {
        tenantId: auth.tenantId,
        jobId: params.id,
        status: payload.status,
      });

      return { data: job };
    } catch (error) {
      if ((error as Error).message === "JOB_NOT_FOUND") {
        throw app.httpErrors.notFound("Job not found");
      }
      if ((error as Error).message === "INVALID_TRANSITION") {
        throw app.httpErrors.conflict("Invalid status transition");
      }
      request.log.error({ err: error }, "Failed to transition job");
      throw app.httpErrors.internalServerError();
    }
  });
}
