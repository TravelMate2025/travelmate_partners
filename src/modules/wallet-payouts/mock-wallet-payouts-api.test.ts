import { describe, expect, it } from "vitest";

import { mockWalletPayoutsApi } from "@/modules/wallet-payouts/mock-wallet-payouts-api";

describe("mockWalletPayoutsApi", () => {
  it("supports payout settings, request flow, lifecycle progression, and statement download", async () => {
    const userId = "u1";
    const summary = await mockWalletPayoutsApi.getWalletSummary(userId);
    const settings = await mockWalletPayoutsApi.getPayoutSettings(userId);
    const payouts = await mockWalletPayoutsApi.listPayouts(userId);

    expect(summary.currency).toBe("NGN");
    expect(summary.reserveHoldDays).toBeGreaterThan(0);
    expect(settings.minimumThreshold).toBeGreaterThan(0);
    expect(payouts.length).toBeGreaterThan(0);

    const updatedSettings = await mockWalletPayoutsApi.updatePayoutSettings(userId, {
      minimumThreshold: 20000,
      schedule: "weekly",
    });
    expect(updatedSettings.minimumThreshold).toBe(20000);
    expect(updatedSettings.schedule).toBe("weekly");

    const requested = await mockWalletPayoutsApi.requestPayout(userId, 30000);
    expect(requested.status).toBe("pending");

    const afterList = await mockWalletPayoutsApi.listPayouts(userId);
    expect(afterList.some((item) => item.id === requested.id)).toBe(true);

    const statement = await mockWalletPayoutsApi.downloadPayoutStatement(userId, requested.id);
    expect(statement).toContain("field,value");
    expect(statement).toContain("reference");
  });
});
