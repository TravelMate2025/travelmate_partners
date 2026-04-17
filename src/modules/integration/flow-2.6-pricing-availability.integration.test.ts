import { beforeEach, describe, expect, it } from "vitest";

import { pricingAvailabilityClient } from "@/modules/pricing-availability/pricing-availability-client";
import { staysClient } from "@/modules/stays/stays-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.6 pricing and availability integration", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("saves pricing rules, seasonal overrides, and blackout dates per stay", async () => {
    const userId = "flow26-user";
    const stay = await staysClient.createStay(userId, {
      propertyType: "hotel",
      name: "Flow 2.6 Hotel",
      description: "Pricing coverage",
      address: "21 Marina Road",
      city: "Lagos",
      country: "Nigeria",
    });

    const saved = await pricingAvailabilityClient.upsertPricing(userId, stay.id, {
      currency: "NGN",
      baseRate: 180,
      weekdayRate: 170,
      weekendRate: 210,
      minStayNights: 2,
      maxStayNights: 12,
      seasonalOverrides: [
        {
          startDate: "2026-09-01",
          endDate: "2026-09-20",
          rate: 230,
        },
      ],
      blackoutDates: ["2026-09-15"],
    });

    expect(saved.baseRate).toBe(180);
    expect(saved.currency).toBe("NGN");
    expect(saved.seasonalOverrides).toHaveLength(1);
    expect(saved.blackoutDates).toContain("2026-09-15");

    const loaded = await pricingAvailabilityClient.getPricing(userId, stay.id);
    expect(loaded.weekendRate).toBe(210);
    expect(loaded.minStayNights).toBe(2);
  });
});
