import { prisma } from "../lib/prisma";
import { decryptSecret, encryptSecret } from "./secrets/encryption";

export class ConnectorSecretStore {
  constructor(private db = prisma) {}

  async saveToken(connectorId: string, token: string) {
    const encrypted = encryptSecret(token);
    await this.db.connector.update({
      where: { id: connectorId },
      data: {
        credentialCiphertext: encrypted.ciphertext,
        credentialIv: encrypted.iv,
        credentialTag: encrypted.tag,
        credentialKeyVersion: encrypted.keyVersion,
        credentialToken: null,
      },
    });
  }

  async getToken(connectorId: string) {
    const record = await this.db.connector.findUnique({
      where: { id: connectorId },
      select: {
        credentialCiphertext: true,
        credentialIv: true,
        credentialTag: true,
        credentialKeyVersion: true,
        credentialToken: true,
      },
    });

    if (!record) return null;

    if (record.credentialCiphertext && record.credentialIv && record.credentialTag) {
      try {
        return decryptSecret({
          ciphertext: record.credentialCiphertext,
          iv: record.credentialIv,
          tag: record.credentialTag,
          keyVersion: record.credentialKeyVersion ?? "v1",
        });
      } catch (error) {
        throw new Error("SECRET_DECRYPTION_FAILED");
      }
    }

    if (record.credentialToken) {
      await this.saveToken(connectorId, record.credentialToken);
      return record.credentialToken;
    }

    return null;
  }
}

export const connectorSecretStore = new ConnectorSecretStore();
