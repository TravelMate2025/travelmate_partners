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
      eventType: "settlement_refund_status_updated",
      channels: ["in_app", "email"],
      contextLabel: "Processing",
    });
    expect(notifications[0].eventType).toBe("settlement_refund_status_updated");
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

  it("creates unique IDs for rapid emits within the same millisecond", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    try {
      const first = await mockNotificationsApi.emitEvent("u1", {
        eventType: "verification_status_updated",
        channels: ["in_app"],
      });
      const second = await mockNotificationsApi.emitEvent("u1", {
        eventType: "listing_moderation_updated",
        channels: ["in_app"],
      });
      const ids = new Set(second.map((item) => item.id));
      expect(ids.size).toBe(second.length);
      expect(second[0].id).not.toBe(first[0].id);
    } finally {
      nowSpy.mockRestore();
    }
  });
});
