import { describe, expect, it } from "vitest";

import { canRequestPayout } from "@/modules/wallet-payouts/eligibility";

describe("payout eligibility", () => {
  it("returns true when available amount meets threshold after reserve hold", () => {
    expect(
      canRequestPayout({
        availableBalance: 100000,
        minimumThreshold: 50000,
        reserveHoldBalance: 20000,
      }),
    ).toBe(true);
  });

  it("returns false when threshold is not met", () => {
    expect(
      canRequestPayout({
        availableBalance: 40000,
        minimumThreshold: 50000,
      }),
    ).toBe(false);
  });
});
