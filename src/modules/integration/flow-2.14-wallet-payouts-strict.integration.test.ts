import { beforeEach, describe, expect, it } from "vitest";

import { walletPayoutsClient } from "@/modules/wallet-payouts/wallet-payouts-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.14 strict alignment (wallet, earnings, and booking settlement)", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("supports ledger balances, settlement settings, booking completion settlement flow, refund tracking, and statement export", async () => {
    const userId = "flow214-user";

    const summary = await walletPayoutsClient.getWalletSummary(userId);
    expect(summary.pendingBalance).toBeGreaterThanOrEqual(0);
    expect(summary.availableBalance).toBeGreaterThanOrEqual(0);
    expect(summary.paidBalance).toBeGreaterThanOrEqual(0);

    const settings = await walletPayoutsClient.getSettlementSettings(userId);
    const updatedSettings = await walletPayoutsClient.updateSettlementSettings(userId, {
      reserveHoldDays: 3,
      autoSettleOnBookingCompletion: true,
      requireAdminRefundNotification: true,
    });
    expect(updatedSettings.reserveHoldDays).toBe(3);
    expect(updatedSettings.autoSettleOnBookingCompletion).toBe(true);
    expect(settings.reserveHoldDays).toBeGreaterThanOrEqual(0);

    const created = await walletPayoutsClient.recordBookingCompletion(userId, {
      bookingReference: "TM-BOOK-2141001",
      grossAmount: 25000,
    });
    expect(created.status).toBe("pending_completion");

    const step1 = await walletPayoutsClient.listSettlements(userId);
    const createdStep1 = step1.find((item) => item.id === created.id);
    expect(createdStep1?.status).toBe("processing");

    const step2 = await walletPayoutsClient.listSettlements(userId);
    const createdStep2 = step2.find((item) => item.id === created.id);
    expect(createdStep2?.status).toBe("paid");
    expect(createdStep2?.totalDeductions).toBeGreaterThanOrEqual(0);

    const refunded = await walletPayoutsClient.recordCancellationRefund(userId, {
      settlementId: created.id,
      refundAmount: 5000,
      reason: "Traveler cancellation after completion.",
      status: "partner_notified",
    });
    expect(refunded.refundStatus).toBe("partner_notified");

    const statement = await walletPayoutsClient.downloadSettlementStatement(
      userId,
      created.id,
    );
    expect(statement).toContain("field,value");
    expect(statement).toContain("totalDeductions");
  });
});
