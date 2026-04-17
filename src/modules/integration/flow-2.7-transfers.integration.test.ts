import { beforeEach, describe, expect, it } from "vitest";

import { transfersClient } from "@/modules/transfers/transfers-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.7 transfer listing management integration", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("creates, edits, submits, and archives transfer listings", async () => {
    const userId = "flow27-user";

    let item = await transfersClient.createTransfer(userId, {
      name: "Island Airport Express",
      transferType: "airport",
      pickupPoint: "MM2 Airport",
      dropoffPoint: "Lekki",
      vehicleClass: "SUV",
      passengerCapacity: 4,
      luggageCapacity: 3,
      coverageArea: "Lagos",
    });
    expect(item.status).toBe("draft");

    item = await transfersClient.updateTransfer(userId, item.id, {
      description: "Reliable airport route coverage",
      features: ["ac", "wifi", "child-seat"],
      baseFare: 22000,
    });
    expect(item.features).toContain("wifi");

    item = await transfersClient.updateStatus(userId, item.id, "pending");
    expect(item.status).toBe("rejected");

    item = await transfersClient.updateStatus(userId, item.id, "pending");
    expect(item.status).toBe("approved");

    item = await transfersClient.updateStatus(userId, item.id, "live");
    expect(item.status).toBe("live");

    item = await transfersClient.updateStatus(userId, item.id, "paused");
    expect(item.status).toBe("paused");

    item = await transfersClient.archiveTransfer(userId, item.id);
    expect(item.status).toBe("archived");
  });
});
