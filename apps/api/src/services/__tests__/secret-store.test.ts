import { beforeAll, describe, expect, it, vi } from "vitest";

const update = vi.fn();
const findUnique = vi.fn();

vi.mock("../../lib/prisma", () => ({
  prisma: {
    connector: {
      update,
      findUnique,
    },
  },
}));

let ConnectorSecretStore: typeof import("../secret-store").ConnectorSecretStore;

beforeAll(async () => {
  process.env.SESSION_SECRET = "test-session-secret-123456";
  process.env.DATABASE_URL = "postgresql://test";
  process.env.CONNECTOR_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString("base64");

  ({ ConnectorSecretStore } = await import("../secret-store"));
});

describe("ConnectorSecretStore", () => {
  it("encrypts token on save", async () => {
    const store = new ConnectorSecretStore({ connector: { update, findUnique } } as any);
    update.mockResolvedValueOnce(null);
    await store.saveToken("c1", "token-value");
    const call = update.mock.calls[0][0].data;
    expect(call.credentialToken).toBeNull();
    expect(call.credentialCiphertext).toBeTruthy();
  });

  it("decrypts token on read", async () => {
    const store = new ConnectorSecretStore({ connector: { update, findUnique } } as any);
    const encryptedStore = await (await import("../secrets/encryption")) .encryptSecret("secret");
    findUnique.mockResolvedValueOnce({
      credentialCiphertext: encryptedStore.ciphertext,
      credentialIv: encryptedStore.iv,
      credentialTag: encryptedStore.tag,
      credentialKeyVersion: encryptedStore.keyVersion,
      credentialToken: null,
    });
    const token = await store.getToken("c1");
    expect(token).toBe("secret");
  });
});
