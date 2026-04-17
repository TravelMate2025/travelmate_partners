import { describe, expect, it } from "vitest";

import { computeCompletedSteps, onboardingProgress } from "@/modules/profile/checklist";
import type { PartnerProfileData } from "@/modules/profile/contracts";

function emptyData(): PartnerProfileData {
  return {
    businessType: "",
    legalName: "",
    tradeName: "",
    registrationNumber: "",
    primaryContactName: "",
    primaryContactEmail: "",
    supportContactEmail: "",
    serviceRegions: [],
    operatingCities: [],
    payoutSchedule: "",
  };
}

describe("profile checklist", () => {
  it("computes completed steps based on required fields", () => {
    const data = emptyData();
    expect(computeCompletedSteps(data)).toEqual([]);

    data.businessType = "business";
    data.legalName = "Travelmate Ltd";
    data.registrationNumber = "RC-123";
    expect(computeCompletedSteps(data)).toEqual(["business"]);

    data.primaryContactName = "Amina";
    data.primaryContactEmail = "amina@example.com";
    expect(computeCompletedSteps(data)).toEqual(["business", "contact"]);

    data.serviceRegions = ["Lagos"];
    data.operatingCities = ["Ikeja"];
    data.payoutSchedule = "weekly";
    expect(computeCompletedSteps(data)).toEqual(["business", "contact", "operations"]);
  });

  it("calculates progress percentages", () => {
    expect(onboardingProgress([])).toEqual({ completed: 0, total: 3, percent: 0 });
    expect(onboardingProgress(["business"])).toEqual({ completed: 1, total: 3, percent: 33 });
    expect(onboardingProgress(["business", "contact", "operations"])).toEqual({
      completed: 3,
      total: 3,
      percent: 100,
    });
  });
});
