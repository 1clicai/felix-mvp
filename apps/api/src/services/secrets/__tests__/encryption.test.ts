import { beforeAll, describe, expect, it } from "vitest";

let encryptSecret: typeof import("../encryption").encryptSecret;
let decryptSecret: typeof import("../encryption").decryptSecret;

beforeAll(async () => {
  process.env.SESSION_SECRET = "test-session-secret-123456";
  process.env.DATABASE_URL = "postgresql://test";
  process.env.CONNECTOR_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

  ({ encryptSecret, decryptSecret } = await import("../encryption"));
});

describe("secret encryption", () => {
  it("round-trips plaintext", () => {
    const encrypted = encryptSecret("super-secret");
    const plaintext = decryptSecret(encrypted);
    expect(plaintext).toBe("super-secret");
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptSecret("secret");
    encrypted.ciphertext = encrypted.ciphertext.replace(/.$/, "A");
    expect(() => decryptSecret(encrypted)).toThrow();
  });
});
