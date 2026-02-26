import fp from "fastify-plugin";
import type { FastifyPluginCallback } from "fastify";
import { prisma } from "../lib/prisma";
import { verifyAccessToken } from "../auth/tokens";

declare module "fastify" {
  interface FastifyRequest {
    auth?: {
      userId: string;
      tenantId: string;
      role: string;
    };
  }
}

const authPlugin: FastifyPluginCallback = (app, _, done) => {
  app.decorateRequest("auth", null);

  app.addHook("preHandler", async (request, reply) => {
    if (request.routerPath?.startsWith("/auth")) {
      return;
    }

    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw app.httpErrors.unauthorized("Missing bearer token");
    }

    const token = header.replace("Bearer ", "").trim();
    let payload: ReturnType<typeof verifyAccessToken>;

    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      request.log.warn({ err: error }, "Invalid token");
      throw app.httpErrors.unauthorized("Invalid token");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, tenantId: true, role: true } });

    if (!user || user.tenantId !== payload.tenantId) {
      throw app.httpErrors.forbidden("User not found in tenant context");
    }

    request.auth = { userId: user.id, tenantId: user.tenantId, role: user.role };
  });

  done();
};

export const authGuard = fp(authPlugin);
