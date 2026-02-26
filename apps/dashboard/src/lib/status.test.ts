import { describe, expect, it } from "vitest";
import { statusColor } from "./status";

describe("statusColor", () => {
  it("maps success statuses", () => {
    expect(statusColor("SUCCEEDED")).toBe("#4ade80");
  });

  it("maps failure statuses", () => {
    expect(statusColor("FAILED")).toBe("#f87171");
  });

  it("falls back for unknown statuses", () => {
    expect(statusColor("mystery")) .toBe("#94a3b8");
  });
});
