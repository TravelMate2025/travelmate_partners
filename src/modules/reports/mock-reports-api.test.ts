import { describe, expect, it } from "vitest";

import { mockReportsApi } from "@/modules/reports/mock-reports-api";

describe("mockReportsApi", () => {
  it("returns summary metrics and CSV export content", async () => {
    const summary = await mockReportsApi.getSummary("u1");
    const csv = await mockReportsApi.exportCsv("u1");

    expect(summary.views).toBeGreaterThan(0);
    expect(csv).toContain("metric,value");
  });
});
