import { prisma } from "../../lib/prisma";
import { connectorSecretStore } from "../../services/secret-store";
import { fetch } from "undici";

export interface GitHubTreeEntry {
  path: string;
  type: string;
  size?: number;
}

export class GitHubIngestionService {
  constructor(private db = prisma) {}

  async ingest(runId: string) {
    const run = await this.db.connectorIngestionRun.findUnique({
      where: { id: runId },
      include: { connector: true, project: true },
    });
    if (!run?.connector?.repoOwner || !run.connector.repoName) {
      throw new Error("CONNECTOR_METADATA_INCOMPLETE");
    }

    const token = await connectorSecretStore.getToken(run.connectorId);
    if (!token) {
      throw new Error("MISSING_TOKEN");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "felix-mvp-ingestion",
    };

    const repoResp = await fetch(`https://api.github.com/repos/${run.connector.repoOwner}/${run.connector.repoName}`, {
      headers,
    });
    if (repoResp.status === 401 || repoResp.status === 403) throw new Error("GITHUB_UNAUTHORIZED");
    if (repoResp.status === 404) throw new Error("GITHUB_REPO_NOT_FOUND");
    if (!repoResp.ok) throw new Error("GITHUB_METADATA_FAILED");
    const repoMeta = await repoResp.json();

    const defaultBranch = repoMeta.default_branch ?? run.connector.defaultBranch ?? "main";

    const treeResp = await fetch(
      `https://api.github.com/repos/${run.connector.repoOwner}/${run.connector.repoName}/git/trees/${defaultBranch}?recursive=1`,
      { headers },
    );
    if (!treeResp.ok) throw new Error("GITHUB_TREE_FAILED");
    const treeJson = (await treeResp.json()) as { tree?: GitHubTreeEntry[] };
    const entries = (treeJson.tree ?? []).slice(0, 500);

    await this.storeContext(run.tenantId, run.connectorId, run.projectId, repoMeta, entries);

    await this.db.connector.update({
      where: { id: run.connectorId },
      data: { defaultBranch },
    });

    return { filesCount: entries.length, repoMeta: { name: repoMeta.name, defaultBranch } };
  }

  private async storeContext(tenantId: string, connectorId: string, projectId: string, repoMeta: any, tree: GitHubTreeEntry[]) {
    await this.db.projectContextDocument.deleteMany({ where: { connectorId } });

    await this.db.projectContextDocument.create({
      data: {
        tenantId,
        projectId,
        connectorId,
        type: "repo_metadata",
        sourcePath: "repo",
        checksum: repoMeta.node_id ?? null,
        metadata: repoMeta,
      },
    });

    await this.db.projectContextDocument.create({
      data: {
        tenantId,
        projectId,
        connectorId,
        type: "file_tree",
        sourcePath: "tree",
        metadata: { entries: tree },
      },
    });
  }
}
