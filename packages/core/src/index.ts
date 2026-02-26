export type TenantId = string;
export type Token = number;

export interface ModuleActionCost {
  module: string;
  action: string;
  tokens: number;
}

export interface DeploymentPlanSummary {
  id: string;
  tenantId: TenantId;
  title: string;
  riskLevel: "low" | "medium" | "high";
  estimatedTokens: number;
  steps: Array<{ description: string; tokenCost?: number }>;
}

export const createDeploymentPlanSummary = (input: DeploymentPlanSummary) => input;
