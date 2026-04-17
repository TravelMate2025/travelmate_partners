import { describe, expect, it } from "vitest";

import { mockReportsApi } from "@/modules/reports/mock-reports-api";

describe("mockReportsApi", () => {
  it("returns summary metrics and CSV export content for selected date range", async () => {
    const summary = await mockReportsApi.getSummary("u1", "2026-04-01", "2026-04-07");
    const csv = await mockReportsApi.exportCsv("u1", "2026-04-01", "2026-04-07");

    expect(summary.views).toBeGreaterThan(0);
    expect(csv).toContain("from,to,metric,value");
    expect(csv).toContain("2026-04-01,2026-04-07,views");
  });
});
