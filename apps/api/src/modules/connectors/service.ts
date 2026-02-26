import type { Connector, PrismaClient } from "@prisma/client";
import { connectorSecretStore } from "../../services/secret-store";

export interface CreateConnectorInput {
  tenantId: string;
  projectId: string;
  repoOwner: string;
  repoName: string;
  repoUrl?: string;
  token: string;
}

export class ConnectorService {
  constructor(private prisma: PrismaClient) {}

  sanitize(connector: Connector) {
    const { credentialToken, ...safe } = connector;
    return safe;
  }

  async listByProject(tenantId: string, projectId: string) {
    const connectors = await this.prisma.connector.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
    });
    return connectors.map((c) => this.sanitize(c));
  }

  async getById(tenantId: string, id: string) {
    const connector = await this.prisma.connector.findFirst({
      where: { id, tenantId },
    });
    if (!connector) {
      throw new Error("CONNECTOR_NOT_FOUND");
    }
    return connector;
  }

  async create(input: CreateConnectorInput) {
    const connector = await this.prisma.connector.create({
      data: {
        tenantId: input.tenantId,
        projectId: input.projectId,
        type: "GITHUB",
        provider: "GITHUB",
        status: "PENDING",
        authType: "PAT",
        repoOwner: input.repoOwner,
        repoName: input.repoName,
        repoUrl: input.repoUrl ?? `https://github.com/${input.repoOwner}/${input.repoName}`,
      },
    });

    await connectorSecretStore.saveToken(connector.id, input.token);
    return this.sanitize(connector);
  }

  async update(connectorId: string, tenantId: string, data: Partial<CreateConnectorInput>) {
    const connector = await this.getById(tenantId, connectorId);

    const updated = await this.prisma.connector.update({
      where: { id: connector.id },
      data: {
        repoOwner: data.repoOwner ?? connector.repoOwner,
        repoName: data.repoName ?? connector.repoName,
        repoUrl: data.repoUrl ?? connector.repoUrl,
        status: "PENDING",
      },
    });

    if (data.token) {
      await connectorSecretStore.saveToken(connector.id, data.token);
    }

    return this.sanitize(updated);
  }
}
