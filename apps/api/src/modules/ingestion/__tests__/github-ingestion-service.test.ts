import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/secret-store", () => ({
  connectorSecretStore: { getToken: vi.fn().mockResolvedValue("token") },
}));

const mockFetch = vi.fn();
vi.mock("undici", () => ({ fetch: (...args: any[]) => mockFetch(...args) }));

const update = vi.fn();
const findUnique = vi.fn();
const deleteMany = vi.fn();
const create = vi.fn();

vi.mock("../../../lib/prisma", () => ({
  prisma: {
    connectorIngestionRun: { findUnique: findUnique },
    projectContextDocument: { deleteMany, create },
    connector: { update },
  },
}));

let GitHubIngestionService: typeof import("../github-ingestion-service").GitHubIngestionService;

beforeAll(async () => {
  ({ GitHubIngestionService } = await import("../github-ingestion-service"));
});

describe("GitHubIngestionService", () => {
  it("stores repo metadata and tree", async () => {
    findUnique.mockResolvedValueOnce({
      tenantId: "t1",
      projectId: "p1",
      connectorId: "c1",
      connector: { repoOwner: "owner", repoName: "repo" },
    });

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ default_branch: "main" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ tree: [{ path: "README.md", type: "blob" }] }) });

    const service = new GitHubIngestionService({
      connectorIngestionRun: { findUnique },
      projectContextDocument: { deleteMany, create },
      connector: { update },
    } as any);

    const result = await service.ingest("run-1");
    expect(result.filesCount).toBe(1);
    expect(deleteMany).toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
  });
});
