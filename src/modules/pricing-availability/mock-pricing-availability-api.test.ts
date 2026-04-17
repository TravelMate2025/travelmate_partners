import { beforeEach, describe, expect, it } from "vitest";

import { mockPricingAvailabilityApi } from "@/modules/pricing-availability/mock-pricing-availability-api";

function resetStorage() {
  window.localStorage.clear();
}

describe("mockPricingAvailabilityApi", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("returns defaults and persists updated pricing", async () => {
    const userId = "u1";
    const stayId = "stay-1";

    const defaults = await mockPricingAvailabilityApi.getPricing(userId, stayId);
    expect(defaults.baseRate).toBeGreaterThan(0);

    const updated = await mockPricingAvailabilityApi.upsertPricing(userId, stayId, {
      currency: "USD",
      baseRate: 200,
      weekdayRate: 190,
      weekendRate: 230,
      minStayNights: 2,
      maxStayNights: 15,
      seasonalOverrides: [
        {
          startDate: "2026-11-01",
          endDate: "2026-11-30",
          rate: 260,
        },
      ],
      blackoutDates: ["2026-12-25"],
    });

    expect(updated.baseRate).toBe(200);
    expect(updated.currency).toBe("USD");
    expect(updated.seasonalOverrides).toHaveLength(1);
    expect(updated.blackoutDates[0]).toBe("2026-12-25");
  });

  it("rejects duplicate blackout dates", async () => {
    await expect(
      mockPricingAvailabilityApi.upsertPricing("u1", "stay-1", {
        currency: "NGN",
        baseRate: 120,
        weekdayRate: 120,
        weekendRate: 140,
        minStayNights: 1,
        maxStayNights: 10,
        seasonalOverrides: [],
        blackoutDates: ["2026-08-12", "2026-08-12"],
      }),
    ).rejects.toThrow("Duplicate blackout dates are not allowed.");
  });
});
