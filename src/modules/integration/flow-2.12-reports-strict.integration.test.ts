import { beforeEach, describe, expect, it } from "vitest";

import { reportsClient } from "@/modules/reports/reports-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.12 strict alignment (reports and insights)", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("supports date-range summary aggregation, health indicators, and CSV export", async () => {
    const userId = "flow212-user";
    const from = "2026-04-01";
    const to = "2026-04-30";

    const summary = await reportsClient.getSummary(userId, from, to);
    expect(summary.views).toBeGreaterThan(0);
    expect(summary.impressions).toBeGreaterThan(0);
    expect(summary.searchAppearances).toBeGreaterThan(0);
    expect(summary.missingFieldsCount).toBeGreaterThanOrEqual(0);
    expect(summary.pausedListingsCount).toBeGreaterThanOrEqual(0);

    const csv = await reportsClient.exportCsv(userId, from, to);
    expect(csv).toContain("from,to,metric,value");
    expect(csv).toContain(`${from},${to},views`);
    expect(csv).toContain(`${from},${to},missingFieldsCount`);
  });
});
