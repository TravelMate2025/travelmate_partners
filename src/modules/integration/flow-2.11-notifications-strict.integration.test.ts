import { beforeEach, describe, expect, it } from "vitest";

import { notificationsClient } from "@/modules/notifications/notifications-client";
import { staysClient } from "@/modules/stays/stays-client";
import { transfersClient } from "@/modules/transfers/transfers-client";
import { verificationClient } from "@/modules/verification/verification-client";
import { walletPayoutsClient } from "@/modules/wallet-payouts/wallet-payouts-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.11 strict alignment (notifications and communication)", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("emits notifications from system workflows and supports view/ack/read-unread actions", async () => {
    const userId = "flow211-user";

    const stay = await staysClient.createStay(userId, {
      propertyType: "hotel",
      name: "Flow 211 Stay",
      description: "",
      address: "12 Marina",
      city: "Lagos",
      country: "Nigeria",
    });
    await expect(staysClient.updateStatus(userId, stay.id, "pending")).rejects.toThrow(
      "Cannot submit stay. Missing required fields: Description.",
    );

    const transfer = await transfersClient.createTransfer(userId, {
      name: "Flow 211 Transfer",
      transferType: "airport",
      pickupPoint: "Airport",
      dropoffPoint: "City",
      vehicleClass: "SUV",
      passengerCapacity: 4,
      luggageCapacity: 2,
      coverageArea: "Lagos",
    });
    await transfersClient.updateStatus(userId, transfer.id, "pending");

    await verificationClient.addDocument(userId, {
      category: "identity",
      fileName: "id.png",
      fileType: "image/png",
      fileSize: 400_000,
    });
    await verificationClient.submitVerification(userId);

    const completion = await walletPayoutsClient.recordBookingCompletion(userId, {
      bookingReference: "TM-BOOK-2111001",
      grossAmount: 44000,
    });
    await walletPayoutsClient.listSettlements(userId);
    await walletPayoutsClient.recordCancellationRefund(userId, {
      settlementId: completion.id,
      refundAmount: 5000,
      reason: "Traveler cancelled after settlement.",
      status: "partner_notified",
    });

    let notifications = await notificationsClient.listNotifications(userId);

    expect(
      notifications.some((item) => item.eventType === "incomplete_listing_reminder"),
    ).toBe(true);
    expect(
      notifications.some((item) => item.eventType === "listing_moderation_updated"),
    ).toBe(true);
    expect(
      notifications.some((item) => item.eventType === "verification_status_updated"),
    ).toBe(true);
    expect(
      notifications.some(
        (item) => item.eventType === "settlement_refund_status_updated",
      ),
    ).toBe(true);
    expect(
      notifications.some(
        (item) => item.channels.includes("email") && item.emailDispatched,
      ),
    ).toBe(true);

    const first = notifications[0];
    notifications = await notificationsClient.markAsRead(userId, first.id);
    expect(notifications.find((item) => item.id === first.id)?.read).toBe(true);

    notifications = await notificationsClient.markAsUnread(userId, first.id);
    expect(notifications.find((item) => item.id === first.id)?.read).toBe(false);

    notifications = await notificationsClient.acknowledge(userId, first.id);
    expect(notifications.find((item) => item.id === first.id)?.acknowledged).toBe(
      true,
    );
  });
});
