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

  it("supports settlement account submission, otp verification, masking, and re-verification after updates", async () => {
    const userId = "u2";
    window.localStorage.setItem(
      "tm_partner_profile_state_v1",
      JSON.stringify({
        onboardingByUserId: {
          [userId]: {
            userId,
            data: {
              businessType: "business",
              legalName: "TravelMate Ltd",
              tradeName: "TravelMate",
              registrationNumber: "RC123456",
              primaryContactName: "Jane Doe",
              primaryContactEmail: "jane@example.com",
              supportContactEmail: "",
              operatingCountries: ["Nigeria"],
              operatingRegions: ["Lagos"],
              operatingCities: ["Lekki"],
              coverageNotes: "",
              payoutMethod: "bank_transfer",
              settlementCurrency: "NGN",
              payoutSchedule: "weekly",
            },
            completedSteps: ["business", "contact", "operations"],
            status: "completed",
            updatedAt: new Date().toISOString(),
          },
        },
      }),
    );

    const submitted = await mockWalletPayoutsApi.submitSettlementAccount(userId, {
      methodType: "bank_account",
      country: "NG",
      currency: "NGN",
      accountHolderName: "TravelMate Ltd",
      bankName: "Zenith Bank",
      accountNumber: "1234567890",
      isDefault: true,
    });
    expect(submitted.account.accountNumberMasked).toBe("******7890");
    expect(submitted.account.status).toBe("pending");
    expect(submitted.otpCodeHint).toHaveLength(6);

    const verified = await mockWalletPayoutsApi.verifySettlementAccountOtp(userId, {
      accountId: submitted.account.id,
      otpCode: submitted.otpCodeHint ?? "",
    });
    expect(verified.status).toBe("verified");

    const updated = await mockWalletPayoutsApi.submitSettlementAccount(userId, {
      accountId: verified.id,
      methodType: "bank_account",
      country: "NG",
      currency: "NGN",
      accountHolderName: "Mismatch Name",
      bankName: "Zenith Bank",
      isDefault: true,
    });
    expect(updated.account.status).toBe("pending");

    const rejected = await mockWalletPayoutsApi.verifySettlementAccountOtp(userId, {
      accountId: updated.account.id,
      otpCode: updated.otpCodeHint ?? "",
    });
    expect(rejected.status).toBe("rejected");

    const history = await mockWalletPayoutsApi.listSettlementAccountHistory(userId);
    expect(history.some((item) => item.action === "verified")).toBe(true);
    expect(history.some((item) => item.action === "reverification_required")).toBe(true);
    expect(history.some((item) => item.action === "rejected")).toBe(true);
  });
});
