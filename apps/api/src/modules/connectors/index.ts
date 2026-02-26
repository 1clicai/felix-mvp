import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { connectorCreateSchema, connectorUpdateSchema } from "./schema";
import { ConnectorService } from "./service";
import { GitHubConnectorService } from "./github-service";
import { getProjectOrThrow } from "../projects/access";

const projectParams = z.object({ projectId: z.string().cuid() });
const connectorParams = projectParams.extend({ id: z.string().cuid() });

export async function connectorsModule(app: FastifyInstance) {
  const connectorService = new ConnectorService(prisma);
  const githubService = new GitHubConnectorService(prisma);

  app.get("/projects/:projectId/connectors", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();
    const params = projectParams.parse(request.params);

    await getProjectOrThrow(app, tenantId, params.projectId);
    const connectors = await connectorService.listByProject(tenantId, params.projectId);
    return { data: connectors };
  });

  app.post("/projects/:projectId/connectors", async (request) => {
    const auth = request.auth;
    if (!auth) throw app.httpErrors.unauthorized();
    const params = projectParams.parse(request.params);
    await getProjectOrThrow(app, auth.tenantId, params.projectId);

    const payload = connectorCreateSchema.parse(request.body);

    try {
      const connector = await connectorService.create({
        tenantId: auth.tenantId,
        projectId: params.projectId,
        repoOwner: payload.repoOwner,
        repoName: payload.repoName,
        repoUrl: payload.repoUrl,
        token: payload.token,
      });
      return { data: connector };
    } catch (error) {
      request.log.error({ err: error }, "Failed to create connector");
      throw app.httpErrors.internalServerError();
    }
  });

  app.get("/projects/:projectId/connectors/:id", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();
    const params = connectorParams.parse(request.params);
    await getProjectOrThrow(app, tenantId, params.projectId);

    try {
      const connector = await connectorService.getById(tenantId, params.id);
      if (connector.projectId !== params.projectId) {
        throw app.httpErrors.notFound("Connector not found in project");
      }
      return { data: connectorService.sanitize(connector) };
    } catch (error) {
      if ((error as Error).message === "CONNECTOR_NOT_FOUND") {
        throw app.httpErrors.notFound("Connector not found");
      }
      throw error;
    }
  });

  app.put("/projects/:projectId/connectors/:id", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();
    const params = connectorParams.parse(request.params);
    await getProjectOrThrow(app, tenantId, params.projectId);

    const payload = connectorUpdateSchema.parse(request.body);

    try {
      const connector = await connectorService.update(params.id, tenantId, {
        projectId: params.projectId,
        repoOwner: payload.repoOwner,
        repoName: payload.repoName,
        repoUrl: payload.repoUrl,
        token: payload.token,
      });
      return { data: connector };
    } catch (error) {
      if ((error as Error).message === "CONNECTOR_NOT_FOUND") {
        throw app.httpErrors.notFound("Connector not found");
      }
      throw error;
    }
  });

  app.post("/projects/:projectId/connectors/:id/validate", async (request) => {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) throw app.httpErrors.unauthorized();
    const params = connectorParams.parse(request.params);
    await getProjectOrThrow(app, tenantId, params.projectId);

    const connector = await connectorService.getById(tenantId, params.id);
    if (connector.projectId !== params.projectId) {
      throw app.httpErrors.notFound("Connector not found in project");
    }

    try {
      const result = await githubService.validateConnector(connector);
      return { data: { status: "ACTIVE", metadata: result } };
    } catch (error) {
      await githubService.markConnectorInvalid(connector.id, (error as Error).message);

      if ((error as Error).message === "MISSING_TOKEN") {
        throw app.httpErrors.badRequest("Connector has no stored credentials");
      }
      if ((error as Error).message === "GITHUB_UNAUTHORIZED") {
        throw app.httpErrors.unauthorized("Token is invalid or lacks repo access");
      }
      if ((error as Error).message === "GITHUB_REPO_NOT_FOUND") {
        throw app.httpErrors.notFound("Repository not found or inaccessible");
      }
      request.log.error({ err: error }, "Connector validation failed");
      throw app.httpErrors.badGateway("GitHub validation failed");
    }
  });
}
