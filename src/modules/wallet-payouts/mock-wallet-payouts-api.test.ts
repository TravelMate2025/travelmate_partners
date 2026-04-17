import { describe, expect, it } from "vitest";

import { mockWalletPayoutsApi } from "@/modules/wallet-payouts/mock-wallet-payouts-api";

describe("mockWalletPayoutsApi", () => {
  it("returns wallet summary and payout records", async () => {
    const summary = await mockWalletPayoutsApi.getWalletSummary("u1");
    const payouts = await mockWalletPayoutsApi.listPayouts("u1");

    expect(summary.currency).toBe("NGN");
    expect(payouts.length).toBeGreaterThan(0);
  });
});
