import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { signAccessToken } from "../../auth/tokens";

const sessionSchema = z.object({
  email: z.string().email(),
  tenantSlug: z.string().min(1),
});

export async function authModule(app: FastifyInstance) {
  app.get("/auth/health", async () => ({ scope: "auth", status: "ok" }));

  app.post("/auth/token", async (request) => {
    const body = sessionSchema.parse(request.body);

    const tenant = await prisma.tenant.findUnique({ where: { slug: body.tenantSlug }, select: { id: true } });
    if (!tenant) {
      throw app.httpErrors.notFound("Tenant not found");
    }

    const user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: body.email } },
    });

    if (!user) {
      throw app.httpErrors.unauthorized("User not found");
    }

    const token = signAccessToken({ sub: user.id, tenantId: tenant.id, role: user.role });

    return {
      token,
      tokenType: "Bearer",
      expiresIn: "12h",
    };
  });
}
