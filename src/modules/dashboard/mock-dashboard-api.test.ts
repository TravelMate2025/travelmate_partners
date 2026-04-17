import { beforeEach, describe, expect, it } from "vitest";

import { mockDashboardApi } from "@/modules/dashboard/mock-dashboard-api";

function resetStorage() {
  window.localStorage.clear();
}

describe("mockDashboardApi", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("returns default dashboard state", async () => {
    const data = await mockDashboardApi.getDashboard("u1");

    expect(data.summary.activeListings).toBe(0);
    expect(data.summary.pendingApprovals).toBe(0);
    expect(data.summary.totalViews).toBe(0);
    expect(data.alerts.length).toBeGreaterThan(0);
  });

  it("records quick actions and updates metrics/activity", async () => {
    let data = await mockDashboardApi.recordQuickAction("u1", "add_stay");
    expect(data.summary.pendingApprovals).toBeGreaterThanOrEqual(1);
    expect(data.recentActivity.length).toBeGreaterThanOrEqual(1);

    data = await mockDashboardApi.recordQuickAction("u1", "add_transfer");
    expect(data.summary.totalViews).toBeGreaterThan(0);

    data = await mockDashboardApi.recordQuickAction("u1", "update_availability");
    expect(data.recentActivity[0].title).toContain("Update availability");
  });
});
