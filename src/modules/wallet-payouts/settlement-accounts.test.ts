import { describe, expect, it } from "vitest";

import {
  computeNameMatchStatus,
  formatSettlementAccountSummary,
  maskSensitiveValue,
  validateSettlementAccountInput,
} from "@/modules/wallet-payouts/settlement-accounts";

describe("settlement account helpers", () => {
  it("validates country-specific bank account inputs", () => {
    expect(() =>
      validateSettlementAccountInput({
        methodType: "bank_account",
        country: "NG",
        currency: "NGN",
        accountHolderName: "TravelMate Ltd",
        bankName: "Zenith Bank",
        accountNumber: "1234567890",
      }),
    ).not.toThrow();

    expect(() =>
      validateSettlementAccountInput({
        methodType: "bank_account",
        country: "NG",
        currency: "NGN",
        accountHolderName: "TravelMate Ltd",
        bankName: "Zenith Bank",
        accountNumber: "1234",
      }),
    ).toThrow("Invalid account number format");
  });

  it("validates mobile money inputs and masks sensitive values", () => {
    expect(() =>
      validateSettlementAccountInput({
        methodType: "mobile_money",
        country: "NG",
        currency: "NGN",
        accountHolderName: "Jane Doe",
        mobileMoneyProvider: "OPay",
        mobileNumber: "+2348012345678",
      }),
    ).not.toThrow();

    expect(maskSensitiveValue("1234567890")).toBe("******7890");
    expect(formatSettlementAccountSummary("mobile_money", "", "+2348012345678")).toBe(
      "Mobile **********5678",
    );
  });

  it("checks ownership/name matching against onboarding names", () => {
    expect(
      computeNameMatchStatus(
        {
          businessType: "business",
          legalName: "TravelMate Ltd",
          tradeName: "TravelMate",
          registrationNumber: "RC123",
          primaryContactName: "Jane Doe",
          primaryContactEmail: "jane@example.com",
          supportContactEmail: "",
          operatingCountries: [],
          operatingRegions: [],
          operatingCities: [],
          coverageNotes: "",
          payoutMethod: "bank_transfer",
          settlementCurrency: "NGN",
          payoutSchedule: "weekly",
        },
        "TravelMate Ltd",
      ),
    ).toBe("matched");

    expect(
      computeNameMatchStatus(
        {
          businessType: "business",
          legalName: "TravelMate Ltd",
          tradeName: "TravelMate",
          registrationNumber: "RC123",
          primaryContactName: "Jane Doe",
          primaryContactEmail: "jane@example.com",
          supportContactEmail: "",
          operatingCountries: [],
          operatingRegions: [],
          operatingCities: [],
          coverageNotes: "",
          payoutMethod: "bank_transfer",
          settlementCurrency: "NGN",
          payoutSchedule: "weekly",
        },
        "Another Company",
      ),
    ).toBe("mismatched");
  });
});
