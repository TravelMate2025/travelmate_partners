import { beforeEach, describe, expect, it } from "vitest";

import { mockTransfersApi } from "@/modules/transfers/mock-transfers-api";

function resetStorage() {
  window.localStorage.clear();
}

describe("mockTransfersApi", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("supports draft -> rejected -> approved lifecycle through submission flow", async () => {
    const userId = "u1";
    const item = await mockTransfersApi.createTransfer(userId, {
      name: "City Airport Shuttle",
      transferType: "airport",
      pickupPoint: "MM2",
      dropoffPoint: "Victoria Island",
      vehicleClass: "SUV",
      passengerCapacity: 4,
      luggageCapacity: 3,
      coverageArea: "Lagos Island",
    });

    let updated = await mockTransfersApi.updateStatus(userId, item.id, "pending");
    expect(updated.status).toBe("rejected");
    expect(updated.moderationFeedback).toContain("First review rejected");

    updated = await mockTransfersApi.updateStatus(userId, item.id, "pending");
    expect(updated.status).toBe("approved");
  });

  it("updates fields and archives transfer", async () => {
    const userId = "u1";
    const item = await mockTransfersApi.createTransfer(userId, {
      name: "City Transfer",
      transferType: "one_way",
      pickupPoint: "Lekki",
      dropoffPoint: "Ikeja",
      vehicleClass: "Sedan",
      passengerCapacity: 3,
      luggageCapacity: 2,
      coverageArea: "Lagos",
    });

    let updated = await mockTransfersApi.updateTransfer(userId, item.id, {
      features: ["ac", "wifi"],
      baseFare: 20000,
    });
    expect(updated.features).toContain("wifi");

    updated = await mockTransfersApi.archiveTransfer(userId, item.id);
    expect(updated.status).toBe("archived");
  });
});
