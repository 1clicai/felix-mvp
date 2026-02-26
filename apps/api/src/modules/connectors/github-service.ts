import { Connector, PrismaClient } from "@prisma/client";
import { fetch } from "undici";
import { connectorSecretStore } from "../../services/secret-store";

export interface GitHubValidationResult {
  repoUrl: string;
  defaultBranch: string;
  private: boolean;
  permissions?: Record<string, boolean>;
}

export class GitHubConnectorService {
  constructor(private prisma: PrismaClient) {}

  private async getTokenOrThrow(connectorId: string) {
    const token = await connectorSecretStore.getToken(connectorId);
    if (!token) {
      throw new Error("MISSING_TOKEN");
    }
    return token;
  }

  async validateConnector(connector: Pick<Connector, "id" | "repoOwner" | "repoName">) {
    if (!connector.repoOwner || !connector.repoName) {
      throw new Error("MISSING_REPO_METADATA");
    }

    const token = await this.getTokenOrThrow(connector.id);
    const response = await fetch(`https://api.github.com/repos/${connector.repoOwner}/${connector.repoName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "felix-mvp",
        Accept: "application/vnd.github+json",
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("GITHUB_UNAUTHORIZED");
    }

    if (response.status === 404) {
      throw new Error("GITHUB_REPO_NOT_FOUND");
    }

    if (!response.ok) {
      throw new Error("GITHUB_VALIDATION_FAILED");
    }

    const data = (await response.json()) as {
      html_url: string;
      default_branch: string;
      private: boolean;
      permissions?: Record<string, boolean>;
    };

    const result: GitHubValidationResult = {
      repoUrl: data.html_url,
      defaultBranch: data.default_branch,
      private: data.private,
      permissions: data.permissions,
    };

    await this.prisma.connector.update({
      where: { id: connector.id },
      data: {
        status: "ACTIVE",
        repoUrl: result.repoUrl,
        defaultBranch: result.defaultBranch,
        lastValidatedAt: new Date(),
        lastValidationError: null,
      },
    });

    return result;
  }

  async markConnectorInvalid(connectorId: string, errorMessage: string) {
    await this.prisma.connector.update({
      where: { id: connectorId },
      data: {
        status: "INVALID",
        lastValidatedAt: new Date(),
        lastValidationError: errorMessage,
      },
    });
  }
}
