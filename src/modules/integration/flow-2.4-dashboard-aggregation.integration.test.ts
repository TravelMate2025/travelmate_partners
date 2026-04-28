import { beforeEach, describe, expect, it } from "vitest";

import { realDashboardApi } from "@/modules/dashboard/real-dashboard-api";
import { notificationsClient } from "@/modules/notifications/notifications-client";
import { reportsClient } from "@/modules/reports/reports-client";
import { staysClient } from "@/modules/stays/stays-client";
import { transfersClient } from "@/modules/transfers/transfers-client";

function resetStorage() {
  window.localStorage.clear();
}

const ACTIVE_STATUSES = new Set(["approved", "live"]);

describe("Flow 2.4 dashboard aggregation", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("aggregates summary, alerts, and activity from real module sources", async () => {
    const userId = "flow24-dashboard-user";

    const stay = await staysClient.createStay(userId, {
      propertyType: "hotel",
      name: "Aggregation Stay",
      description: "Test stay for dashboard aggregation",
      address: "2 Marina Road",
      city: "Lagos",
      country: "Nigeria",
    });
    await staysClient.updateStay(userId, stay.id, {
      amenities: ["wifi"],
      checkInTime: "14:00",
      checkOutTime: "11:00",
      cancellationPolicy: "Flexible",
    });
    await staysClient.upsertRoom(userId, stay.id, {
      name: "Standard",
      occupancy: 2,
      bedConfiguration: "1 Queen Bed",
      baseRate: 90,
    });
    await staysClient.addImage(userId, stay.id, {
      fileName: "stay.jpg",
      fileType: "image/jpeg",
      fileSize: 100_000,
    });
    await staysClient.updateStatus(userId, stay.id, "pending");
    await staysClient.updateStatus(userId, stay.id, "pending");
    await staysClient.updateStatus(userId, stay.id, "live");

    await transfersClient.createTransfer(userId, {
      name: "Aggregation Transfer",
      transferType: "one_way",
      pickupPoint: "Airport",
      dropoffPoint: "Victoria Island",
      vehicleClass: "SUV",
      passengerCapacity: 4,
      luggageCapacity: 3,
      coverageArea: "Lagos",
      baseFare: 50,
    });

    const dashboard = await realDashboardApi.getDashboard(userId);
    const [stays, transfers, summary, notifications] = await Promise.all([
      staysClient.listStays(userId),
      transfersClient.listTransfers(userId),
      reportsClient.getSummary(userId),
      notificationsClient.listNotifications(userId),
    ]);

    const expectedActiveListings =
      stays.filter((item) => ACTIVE_STATUSES.has(item.status)).length +
      transfers.filter((item) => ACTIVE_STATUSES.has(item.status)).length;
    const expectedPendingApprovals =
      stays.filter((item) => item.status === "pending").length +
      transfers.filter((item) => item.status === "pending").length;
    const expectedUnreadNotifications = notifications.filter((item) => !item.read).length;

    expect(dashboard.summary.activeListings).toBe(expectedActiveListings);
    expect(dashboard.summary.pendingApprovals).toBe(expectedPendingApprovals);
    expect(dashboard.summary.totalViews).toBe(summary.views);
    expect(dashboard.recentActivity.length).toBeGreaterThan(0);
    expect(dashboard.alerts.length).toBeGreaterThan(0);

    if (expectedUnreadNotifications > 0) {
      expect(
        dashboard.alerts.some(
          (alert) =>
            alert.message === `${expectedUnreadNotifications} notification(s) are unread.`,
        ),
      ).toBe(true);
    }

    for (let index = 1; index < dashboard.recentActivity.length; index += 1) {
      const previous = new Date(dashboard.recentActivity[index - 1].createdAt).getTime();
      const current = new Date(dashboard.recentActivity[index].createdAt).getTime();
      expect(previous).toBeGreaterThanOrEqual(current);
    }
  });
});
