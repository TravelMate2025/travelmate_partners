import { beforeEach, describe, expect, it } from "vitest";

import { notificationsClient } from "@/modules/notifications/notifications-client";
import { walletPayoutsClient } from "@/modules/wallet-payouts/wallet-payouts-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.15 strict alignment (settlement account details and verification)", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("supports payout method submission, country validation, otp verification, status changes, history, masking, and re-verification after updates", async () => {
    const userId = "flow215-user";

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

    const submitted = await walletPayoutsClient.submitSettlementAccount(userId, {
      methodType: "bank_account",
      country: "NG",
      currency: "NGN",
      accountHolderName: "TravelMate Ltd",
      bankName: "Zenith Bank",
      accountNumber: "1234567890",
      isDefault: true,
    });

    expect(submitted.account.status).toBe("pending");
    expect(submitted.account.accountNumberMasked).toBe("******7890");
    expect(submitted.account.isDefault).toBe(true);
    expect(submitted.otpCodeHint).toHaveLength(6);

    const verified = await walletPayoutsClient.verifySettlementAccountOtp(userId, {
      accountId: submitted.account.id,
      otpCode: submitted.otpCodeHint ?? "",
    });
    expect(verified.status).toBe("verified");
    expect(verified.nameMatchStatus).toBe("matched");

    const updated = await walletPayoutsClient.submitSettlementAccount(userId, {
      accountId: verified.id,
      methodType: "bank_account",
      country: "NG",
      currency: "NGN",
      accountHolderName: "Unknown Owner",
      bankName: "Zenith Bank",
      isDefault: true,
    });
    expect(updated.account.status).toBe("pending");

    const rejected = await walletPayoutsClient.verifySettlementAccountOtp(userId, {
      accountId: updated.account.id,
      otpCode: updated.otpCodeHint ?? "",
    });
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectionReason).toContain("does not match");

    const accounts = await walletPayoutsClient.listSettlementAccounts(userId);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].accountNumberMasked).toBe("******7890");

    const history = await walletPayoutsClient.listSettlementAccountHistory(userId);
    expect(history.some((item) => item.action === "submitted")).toBe(true);
    expect(history.some((item) => item.action === "otp_sent")).toBe(true);
    expect(history.some((item) => item.action === "verified")).toBe(true);
    expect(history.some((item) => item.action === "reverification_required")).toBe(true);
    expect(history.some((item) => item.action === "rejected")).toBe(true);

    const notifications = await notificationsClient.listNotifications(userId);
    expect(
      notifications.some((item) => item.eventType === "settlement_account_updated"),
    ).toBe(true);
  });
});
