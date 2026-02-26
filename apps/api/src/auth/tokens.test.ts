import { describe, expect, it, vi } from "vitest";
import { signAccessToken, verifyAccessToken } from "./tokens";

vi.mock("../config/env", () => ({ env: { SESSION_SECRET: "test-secret" } }));

describe("access tokens", () => {
  it("round-trips payload", () => {
    const token = signAccessToken({ sub: "user-1", tenantId: "tenant-1", role: "CLIENT_ADMIN" });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user-1");
    expect(payload.tenantId).toBe("tenant-1");
  });

  it("throws on invalid token", () => {
    expect(() => verifyAccessToken("invalid")) .toThrowError();
  });
});
