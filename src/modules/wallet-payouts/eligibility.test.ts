import { describe, expect, it } from "vitest";

import { canSettleBooking } from "@/modules/wallet-payouts/eligibility";

describe("settlement eligibility", () => {
  it("returns true when gross amount meets settle threshold after reserve hold", () => {
    expect(
      canSettleBooking({
        grossAmount: 100000,
        minimumSettleAmount: 50000,
        reserveHoldBalance: 20000,
      }),
    ).toBe(true);
  });

  it("returns false when threshold is not met", () => {
    expect(
      canSettleBooking({
        grossAmount: 40000,
        minimumSettleAmount: 50000,
      }),
    ).toBe(false);
  });
});
