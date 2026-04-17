import { beforeEach, describe, expect, it } from "vitest";

import { transferPricingSchedulingClient } from "@/modules/transfer-pricing-scheduling/transfer-pricing-scheduling-client";
import { transfersClient } from "@/modules/transfers/transfers-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.8 transfer pricing and scheduling integration", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("saves fare rules, schedule windows, and blackout dates per transfer", async () => {
    const userId = "flow28-user";
    const transfer = await transfersClient.createTransfer(userId, {
      name: "Flow 2.8 Transfer",
      transferType: "airport",
      pickupPoint: "Airport",
      dropoffPoint: "City Center",
      vehicleClass: "SUV",
      passengerCapacity: 4,
      luggageCapacity: 3,
      coverageArea: "Lagos",
      baseFare: 25000,
    });

    const saved = await transferPricingSchedulingClient.upsertPricingScheduling(
      userId,
      transfer.id,
      {
        currency: "NGN",
        baseFare: 25000,
        distanceRatePerKm: 500,
        timeRatePerMinute: 35,
        peakSurcharge: 3000,
        nightSurcharge: 4000,
        blackoutDates: ["2026-12-25"],
        scheduleWindows: [
          {
            startTime: "06:00",
            endTime: "22:00",
            days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
          },
        ],
      },
    );

    expect(saved.baseFare).toBe(25000);
    expect(saved.scheduleWindows).toHaveLength(1);

    const loaded = await transferPricingSchedulingClient.getPricingScheduling(userId, transfer.id);
    expect(loaded.peakSurcharge).toBe(3000);
  });
});
