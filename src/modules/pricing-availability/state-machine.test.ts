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

  it("rejects invalid free-cancellation cutoff hours", () => {
    expect(() =>
      validatePricingAvailabilityInput({
        currency: "NGN",
        baseRate: 120,
        weekdayRate: 120,
        weekendRate: 150,
        minStayNights: 1,
        maxStayNights: 14,
        seasonalOverrides: [],
        blackoutDates: [],
        ratePlans: VALID_RATE_PLANS,
        cancellationOptions: [
          { optionId: "NON_CANCELLABLE", label: "Non-refundable", amount: 100 },
          {
            optionId: "FREE_CANCELLATION",
            label: "Free cancellation",
            amount: 120,
            cancelDeadlineHoursBeforeCheckIn: -1,
          },
        ],
      }),
    ).toThrow("Free-cancellation cutoff hours must be a non-negative integer.");
  });

  it("accepts room-level cancellation options without ratePlans", () => {
    expect(() =>
      validatePricingAvailabilityInput({
        saleMode: "room_level",
        currency: "NGN",
        baseRate: 120,
        weekdayRate: 120,
        weekendRate: 150,
        minStayNights: 1,
        maxStayNights: 14,
        seasonalOverrides: [],
        blackoutDates: [],
        ratePlans: [],
        roomCancellationOptions: [
          {
            roomId: "room-1",
            cancellationOptions: [
              { optionId: "NON_CANCELLABLE", label: "Non-refundable", amount: 100 },
              { optionId: "FREE_CANCELLATION", label: "Free cancellation", amount: 120, cancelDeadlineHoursBeforeCheckIn: 24 },
            ],
          },
        ],
      }),
    ).not.toThrow();
  });

  it("accepts unit-level cancellation options without ratePlans", () => {
    // Regression test: this is the exact shape the real pricing-availability
    // form (src/app/pricing-availability/page.tsx) submits -- ratePlans is
    // always empty; only cancellationOptions carries the pricing/policy data.
    // Previously validateRatePlans([]) always threw here since it didn't
    // account for cancellationOptions standing in for ratePlans, mirroring
    // how the real backend auto-derives ratePlans from cancellationOptions.
    expect(() =>
      validatePricingAvailabilityInput({
        saleMode: "unit_level",
        currency: "NGN",
        baseRate: 120,
        weekdayRate: 120,
        weekendRate: 150,
        minStayNights: 1,
        maxStayNights: 14,
        seasonalOverrides: [],
        blackoutDates: [],
        ratePlans: [],
        cancellationOptions: [
          { optionId: "NON_CANCELLABLE", label: "Non-cancellable", amount: 100 },
          { optionId: "FREE_CANCELLATION", label: "Free cancellation", amount: 120, cancelDeadlineHoursBeforeCheckIn: 24 },
        ],
      }),
    ).not.toThrow();
  });

  it("still requires ratePlans when neither cancellationOptions nor roomCancellationOptions is provided", () => {
    expect(() =>
      validatePricingAvailabilityInput({
        currency: "NGN",
        baseRate: 120,
        weekdayRate: 120,
        weekendRate: 150,
        minStayNights: 1,
        maxStayNights: 14,
        seasonalOverrides: [],
        blackoutDates: [],
        ratePlans: [],
      }),
    ).toThrow("At least one active rate plan is required.");
  });

  it("rejects duplicate room cancellation entries", () => {
    expect(() =>
      validatePricingAvailabilityInput({
        saleMode: "room_level",
        currency: "NGN",
        baseRate: 120,
        weekdayRate: 120,
        weekendRate: 150,
        minStayNights: 1,
        maxStayNights: 14,
        seasonalOverrides: [],
        blackoutDates: [],
        ratePlans: [],
        roomCancellationOptions: [
          {
            roomId: "room-1",
            cancellationOptions: [
              { optionId: "NON_CANCELLABLE", label: "Non-refundable", amount: 100 },
              { optionId: "FREE_CANCELLATION", label: "Free cancellation", amount: 120, cancelDeadlineHoursBeforeCheckIn: 24 },
            ],
          },
          {
            roomId: "room-1",
            cancellationOptions: [
              { optionId: "NON_CANCELLABLE", label: "Non-refundable", amount: 100 },
              { optionId: "FREE_CANCELLATION", label: "Free cancellation", amount: 120, cancelDeadlineHoursBeforeCheckIn: 24 },
            ],
          },
        ],
      }),
    ).toThrow("Duplicate room cancellation option entries are not allowed.");
  });
});
