import { beforeEach, describe, expect, it } from "vitest";

import { mockNotificationsApi } from "@/modules/notifications/mock-notifications-api";

describe("mockNotificationsApi", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("emits notifications and tracks read/unread + acknowledge states", async () => {
    let notifications = await mockNotificationsApi.listNotifications("u1");
    expect(notifications.length).toBeGreaterThan(0);

    notifications = await mockNotificationsApi.emitEvent("u1", {
      eventType: "payout_status_updated",
      channels: ["in_app", "email"],
      contextLabel: "Processing",
    });
    expect(notifications[0].eventType).toBe("payout_status_updated");
    expect(notifications[0].emailDispatched).toBe(true);
    expect(notifications[0].channels).toContain("in_app");
    expect(notifications[0].channels).toContain("email");

    const targetId = notifications[0].id;
    notifications = await mockNotificationsApi.markAsRead("u1", targetId);
    expect(notifications[0].read).toBe(true);
    expect(notifications[0].readAt).toBeTruthy();

    notifications = await mockNotificationsApi.markAsUnread("u1", targetId);
    expect(notifications[0].read).toBe(false);
    expect(notifications[0].readAt).toBeUndefined();

    notifications = await mockNotificationsApi.acknowledge("u1", targetId);
    expect(notifications[0].acknowledged).toBe(true);
    expect(notifications[0].read).toBe(true);
    expect(notifications[0].acknowledgedAt).toBeTruthy();

    notifications = await mockNotificationsApi.markAllAsRead("u1");
    expect(notifications.every((item) => item.read)).toBe(true);
  });
});
