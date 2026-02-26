import { prisma } from "../lib/prisma";

/**
 * TEMPORARY: stores PAT values in plain text until KMS/encryption is wired.
 * Never return tokens from APIs and prefer to rotate frequently.
 */
export class ConnectorSecretStore {
  async saveToken(connectorId: string, token: string) {
    await prisma.connector.update({
      where: { id: connectorId },
      data: { credentialToken: token },
    });
  }

  async getToken(connectorId: string) {
    const record = await prisma.connector.findUnique({
      where: { id: connectorId },
      select: { credentialToken: true },
    });
    return record?.credentialToken ?? null;
  }
}

export const connectorSecretStore = new ConnectorSecretStore();
