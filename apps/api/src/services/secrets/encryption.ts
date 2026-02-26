import crypto from "node:crypto";
import { env } from "../../config/env";

const KEY_B64 = env.CONNECTOR_SECRET_ENCRYPTION_KEY;
if (!KEY_B64) {
  throw new Error("CONNECTOR_SECRET_ENCRYPTION_KEY is required");
}

const key = Buffer.from(KEY_B64, "base64");
if (key.length !== 32) {
  throw new Error("CONNECTOR_SECRET_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
}

const ALGORITHM = "aes-256-gcm";
const KEY_VERSION = "v1";
const ENCODING = "base64";

export interface EncryptedSecretPayload {
  keyVersion: string;
  ciphertext: string;
  iv: string;
  tag: string;
}

export function encryptSecret(plaintext: string): EncryptedSecretPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    keyVersion: KEY_VERSION,
    ciphertext: ciphertext.toString(ENCODING),
    iv: iv.toString(ENCODING),
    tag: tag.toString(ENCODING),
  };
}

export function decryptSecret(payload: EncryptedSecretPayload): string {
  const iv = Buffer.from(payload.iv, ENCODING);
  const ciphertext = Buffer.from(payload.ciphertext, ENCODING);
  const tag = Buffer.from(payload.tag, ENCODING);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

export function getKeyVersion() {
  return KEY_VERSION;
}
