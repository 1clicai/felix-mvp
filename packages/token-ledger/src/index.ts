import { z } from "zod";

export const tokenDebitSchema = z.object({
  tenantId: z.string().min(1),
  module: z.string(),
  action: z.string(),
  tokens: z.number().int().positive(),
  metadata: z.record(z.any()).default({}),
});

export type TokenDebitPayload = z.infer<typeof tokenDebitSchema>;

export class TokenLedger {
  #balances = new Map<string, number>();

  credit(tenantId: string, tokens: number) {
    const current = this.#balances.get(tenantId) ?? 0;
    this.#balances.set(tenantId, current + tokens);
    return this.getBalance(tenantId);
  }

  getBalance(tenantId: string) {
    return this.#balances.get(tenantId) ?? 0;
  }

  debit(payload: TokenDebitPayload) {
    const parsed = tokenDebitSchema.parse(payload);
    const remaining = this.getBalance(parsed.tenantId) - parsed.tokens;

    if (remaining < 0) {
      throw new Error("Insufficient token balance");
    }

    this.#balances.set(parsed.tenantId, remaining);
    return remaining;
  }
}
