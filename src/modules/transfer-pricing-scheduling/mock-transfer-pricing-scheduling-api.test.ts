import { beforeEach, describe, expect, it } from "vitest";

import { mockTransferPricingSchedulingApi } from "@/modules/transfer-pricing-scheduling/mock-transfer-pricing-scheduling-api";

function resetStorage() {
  window.localStorage.clear();
}

describe("mockTransferPricingSchedulingApi", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("returns defaults and persists updated config", async () => {
    const userId = "u1";
    const transferId = "transfer-1";

    const defaults = await mockTransferPricingSchedulingApi.getPricingScheduling(
      userId,
      transferId,
    );
    expect(defaults.baseFare).toBeGreaterThan(0);

    const updated = await mockTransferPricingSchedulingApi.upsertPricingScheduling(
      userId,
      transferId,
      {
        currency: "USD",
        baseFare: 65,
        distanceRatePerKm: 2,
        timeRatePerMinute: 0.5,
        peakSurcharge: 10,
        nightSurcharge: 12,
        blackoutDates: ["2026-12-31"],
        scheduleWindows: [
          {
            startTime: "09:00",
            endTime: "18:00",
            days: ["mon", "tue", "wed", "thu", "fri"],
          },
        ],
      },
    );

    expect(updated.currency).toBe("USD");
    expect(updated.scheduleWindows).toHaveLength(1);
  });
});
