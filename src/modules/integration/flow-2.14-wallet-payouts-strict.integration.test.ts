import { beforeEach, describe, expect, it } from "vitest";

import { walletPayoutsClient } from "@/modules/wallet-payouts/wallet-payouts-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.14 strict alignment (wallet, earnings, and payouts)", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("supports ledger balances, payout settings, payout request flow, status progression, and statement export", async () => {
    const userId = "flow214-user";

    const summary = await walletPayoutsClient.getWalletSummary(userId);
    expect(summary.pendingBalance).toBeGreaterThanOrEqual(0);
    expect(summary.availableBalance).toBeGreaterThan(0);
    expect(summary.paidBalance).toBeGreaterThan(0);

    const settings = await walletPayoutsClient.getPayoutSettings(userId);
    const updatedSettings = await walletPayoutsClient.updatePayoutSettings(userId, {
      schedule: "weekly",
      minimumThreshold: 20000,
      manualModeEnabled: true,
    });
    expect(updatedSettings.schedule).toBe("weekly");
    expect(updatedSettings.minimumThreshold).toBe(20000);
    expect(settings.schedule).not.toBe("");

    const requested = await walletPayoutsClient.requestPayout(userId, 25000);
    expect(requested.status).toBe("pending");

    const step1 = await walletPayoutsClient.listPayouts(userId);
    const requestedStep1 = step1.find((item) => item.id === requested.id);
    expect(requestedStep1?.status).toBe("processing");

    const step2 = await walletPayoutsClient.listPayouts(userId);
    const requestedStep2 = step2.find((item) => item.id === requested.id);
    expect(requestedStep2?.status).toBe("paid");
    expect(requestedStep2?.totalDeductions).toBeGreaterThanOrEqual(0);

    const statement = await walletPayoutsClient.downloadPayoutStatement(
      userId,
      requested.id,
    );
    expect(statement).toContain("field,value");
    expect(statement).toContain("totalDeductions");
  });
});
