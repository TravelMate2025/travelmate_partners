import { describe, expect, it } from "vitest";

import { mockWalletPayoutsApi } from "@/modules/wallet-payouts/mock-wallet-payouts-api";

describe("mockWalletPayoutsApi", () => {
  it("supports settlement settings, booking completion, refund tracking, lifecycle progression, and statement download", async () => {
    const userId = "u1";
    const summary = await mockWalletPayoutsApi.getWalletSummary(userId);
    const settings = await mockWalletPayoutsApi.getSettlementSettings(userId);
    const settlements = await mockWalletPayoutsApi.listSettlements(userId);

    expect(summary.currency).toBe("NGN");
    expect(summary.reserveHoldDays).toBeGreaterThan(0);
    expect(settings.reserveHoldDays).toBeGreaterThan(0);
    expect(settlements.length).toBeGreaterThan(0);

    const updatedSettings = await mockWalletPayoutsApi.updateSettlementSettings(userId, {
      reserveHoldDays: 3,
      autoSettleOnBookingCompletion: true,
    });
    expect(updatedSettings.reserveHoldDays).toBe(3);
    expect(updatedSettings.autoSettleOnBookingCompletion).toBe(true);

    const created = await mockWalletPayoutsApi.recordBookingCompletion(userId, {
      bookingReference: "TM-BOOK-1001",
      grossAmount: 30000,
    });
    expect(created.status).toBe("pending_completion");

    let afterList = await mockWalletPayoutsApi.listSettlements(userId);
    const step1 = afterList.find((item) => item.id === created.id);
    expect(step1?.status).toBe("processing");

    afterList = await mockWalletPayoutsApi.listSettlements(userId);
    const step2 = afterList.find((item) => item.id === created.id);
    expect(step2?.status).toBe("paid");

    const refunded = await mockWalletPayoutsApi.recordCancellationRefund(userId, {
      settlementId: created.id,
      refundAmount: 8000,
      reason: "Traveler cancelled after settlement.",
      status: "partner_notified",
    });
    expect(refunded.refundStatus).toBe("partner_notified");

    const statement = await mockWalletPayoutsApi.downloadSettlementStatement(userId, created.id);
    expect(statement).toContain("field,value");
    expect(statement).toContain("settlementReference");
  });
});
