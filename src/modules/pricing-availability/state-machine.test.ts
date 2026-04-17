import { describe, expect, it } from "vitest";

import { validatePricingAvailabilityInput } from "@/modules/pricing-availability/state-machine";

describe("pricing-availability state machine", () => {
  it("accepts valid pricing payload", () => {
    expect(() =>
      validatePricingAvailabilityInput({
        currency: "NGN",
        baseRate: 120,
        weekdayRate: 120,
        weekendRate: 150,
        minStayNights: 1,
        maxStayNights: 14,
        seasonalOverrides: [
          {
            startDate: "2026-06-01",
            endDate: "2026-06-30",
            rate: 180,
          },
        ],
        blackoutDates: ["2026-07-04"],
      }),
    ).not.toThrow();
  });

  it("rejects overlapping seasonal ranges and invalid stay rules", () => {
    expect(() =>
      validatePricingAvailabilityInput({
        currency: "NGN",
        baseRate: 120,
        weekdayRate: 120,
        weekendRate: 150,
        minStayNights: 10,
        maxStayNights: 2,
        seasonalOverrides: [],
        blackoutDates: [],
      }),
    ).toThrow("Minimum stay nights cannot exceed maximum stay nights.");

    expect(() =>
      validatePricingAvailabilityInput({
        currency: "NGN",
        baseRate: 120,
        weekdayRate: 120,
        weekendRate: 150,
        minStayNights: 1,
        maxStayNights: 14,
        seasonalOverrides: [
          {
            startDate: "2026-06-01",
            endDate: "2026-06-10",
            rate: 180,
          },
          {
            startDate: "2026-06-10",
            endDate: "2026-06-20",
            rate: 175,
          },
        ],
        blackoutDates: [],
      }),
    ).toThrow("Seasonal date ranges cannot overlap.");

    expect(() =>
      validatePricingAvailabilityInput({
        currency: "N",
        baseRate: 120,
        weekdayRate: 120,
        weekendRate: 150,
        minStayNights: 1,
        maxStayNights: 14,
        seasonalOverrides: [],
        blackoutDates: [],
      }),
    ).toThrow("Currency must be a valid code (e.g. NGN, USD).");
  });
});
