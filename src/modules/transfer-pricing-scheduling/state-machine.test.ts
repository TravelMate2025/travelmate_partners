import { describe, expect, it } from "vitest";

import { validateTransferPricingSchedulingInput } from "@/modules/transfer-pricing-scheduling/state-machine";

describe("transfer pricing scheduling state machine", () => {
  it("accepts valid fare and schedule input", () => {
    expect(() =>
      validateTransferPricingSchedulingInput({
        currency: "NGN",
        baseFare: 15000,
        distanceRatePerKm: 300,
        timeRatePerMinute: 20,
        peakSurcharge: 1000,
        nightSurcharge: 1500,
        blackoutDates: ["2026-12-25"],
        scheduleWindows: [
          {
            startTime: "08:00",
            endTime: "12:00",
            days: ["mon", "tue", "wed"],
          },
        ],
      }),
    ).not.toThrow();
  });

  it("rejects overlapping schedule windows on the same day", () => {
    expect(() =>
      validateTransferPricingSchedulingInput({
        currency: "NGN",
        baseFare: 15000,
        distanceRatePerKm: 0,
        timeRatePerMinute: 0,
        peakSurcharge: 0,
        nightSurcharge: 0,
        blackoutDates: [],
        scheduleWindows: [
          {
            startTime: "08:00",
            endTime: "12:00",
            days: ["mon"],
          },
          {
            startTime: "11:00",
            endTime: "14:00",
            days: ["mon"],
          },
        ],
      }),
    ).toThrow("Schedule windows cannot overlap on MON.");
  });
});
