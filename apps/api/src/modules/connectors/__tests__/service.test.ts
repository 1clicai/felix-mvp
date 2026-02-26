import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConnectorService } from "../service";
import { GitHubConnectorService } from "../github-service";

vi.mock("../../../services/secret-store", () => ({
  connectorSecretStore: {
    saveToken: vi.fn().mockResolvedValue(undefined),
    getToken: vi.fn().mockResolvedValue("ghp_mock"),
  },
}));

vi.mock("undici", () => ({
  fetch: vi.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => ({ html_url: "https://github.com/test/repo", default_branch: "main", private: true }),
  }),
}));

describe("ConnectorService", () => {
  const prisma = {
    connector: {
      findMany: vi.fn().mockResolvedValue([{ id: "c1", credentialToken: "secret" }]),
    },
  } as any;

  it("strips credential token from list results", async () => {
    const service = new ConnectorService(prisma);
    const results = await service.listByProject("tenant", "project");
    expect(results[0]).not.toHaveProperty("credentialToken");
  });
});

describe("GitHubConnectorService", () => {
  const prisma = {
    connector: {
      update: vi.fn().mockResolvedValue(undefined),
    },
  } as any;

  beforeEach(() => {
    prisma.connector.update.mockClear?.();
  });

  it("updates connector on successful validation", async () => {
    const service = new GitHubConnectorService(prisma);
    const result = await service.validateConnector({ id: "c1", repoOwner: "test", repoName: "repo" } as any);
    expect(result.defaultBranch).toBe("main");
    expect(prisma.connector.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
  });
});
