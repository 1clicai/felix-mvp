import { describe, expect, it } from "vitest";
import { scopedProjectWhere } from "../scopes";

describe("scopedProjectWhere", () => {
  it("enforces tenant filter", () => {
    const clause = scopedProjectWhere("tenant-123");
    expect(clause).toEqual({ where: { tenantId: "tenant-123" } });
  });
});
