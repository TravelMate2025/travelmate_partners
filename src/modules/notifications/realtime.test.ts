import { afterEach, describe, expect, it, vi } from "vitest";

import type { PartnerNotification } from "@/modules/notifications/contracts";
import { isCriticalNotification, maybeShowBrowserNotification } from "@/modules/notifications/realtime";

function makeNotification(overrides: Partial<PartnerNotification> = {}): PartnerNotification {
  return {
    id: "notif-1",
    eventType: "listing_moderation_updated",
    title: "Listing moderation updated",
    message: "Generic update",
    read: false,
    acknowledged: false,
    channels: ["in_app"],
    emailDispatched: false,
    createdAt: "2026-04-28T00:00:00.000Z",
    ...overrides,
  };
}

describe("notifications realtime escalation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("flags critical moderation and settlement failure notifications", () => {
    expect(
      isCriticalNotification(
        makeNotification({
          eventType: "listing_moderation_updated",
          message: "Your listing was suspended due to policy violation.",
        }),
      ),
    ).toBe(true);

    expect(
      isCriticalNotification(
        makeNotification({
          eventType: "settlement_refund_status_updated",
          message: "Payout failed and requires attention.",
        }),
      ),
    ).toBe(true);

    expect(
      isCriticalNotification(
        makeNotification({
          eventType: "verification_status_updated",
          message: "Verification status changed.",
        }),
      ),
    ).toBe(false);
  });

  it("shows browser notification only for critical events when permission is granted and tab is hidden", () => {
    const constructorSpy = vi.fn();
    const mockNotification = vi.fn(function MockNotification(this: unknown, _title: string, _opts: { body: string }) {
      constructorSpy();
    }) as unknown as Notification;
    Object.assign(mockNotification, { permission: "granted" });
    vi.stubGlobal("Notification", mockNotification);

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });

    maybeShowBrowserNotification(
      makeNotification({
        eventType: "listing_moderation_updated",
        message: "Listing has been rejected after review.",
      }),
    );
    expect(constructorSpy).toHaveBeenCalledTimes(1);

    maybeShowBrowserNotification(
      makeNotification({
        eventType: "verification_status_updated",
        message: "Verification status changed.",
      }),
    );
    expect(constructorSpy).toHaveBeenCalledTimes(1);
  });
});
