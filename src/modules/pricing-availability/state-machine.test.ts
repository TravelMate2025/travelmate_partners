import { describe, expect, it } from "vitest";

import { validatePricingAvailabilityInput } from "@/modules/pricing-availability/state-machine";

const VALID_RATE_PLANS = [
  {
    code: "flex",
    name: "Flexible",
    roomId: null,
    planType: "refundable" as const,
    isActive: true,
    nightlyRate: 150,
    policyVersion: 1,
    startsOn: null,
    endsOn: null,
    cancellationPolicy: {
      policyType: "free_cancellation_until" as const,
      penaltyType: "none" as const,
      cancelDeadlineHoursBeforeCheckIn: 48,
      penaltyPercent: null,
      penaltyAmount: null,
    },
  },
];

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
        ratePlans: VALID_RATE_PLANS,
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
        ratePlans: VALID_RATE_PLANS,
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
        ratePlans: VALID_RATE_PLANS,
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
        ratePlans: VALID_RATE_PLANS,
      }),
    ).toThrow("Currency must be a valid code (e.g. NGN, USD).");
  });
});
