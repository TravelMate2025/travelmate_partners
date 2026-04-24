import { beforeEach, describe, expect, it } from "vitest";

import { mockProfileApi } from "@/modules/profile/mock-profile-api";

function resetStorage() {
  window.localStorage.clear();
}

describe("mockProfileApi", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("creates default onboarding state", async () => {
    const onboarding = await mockProfileApi.getOnboarding("u1");

    expect(onboarding.userId).toBe("u1");
    expect(onboarding.status).toBe("not_started");
    expect(onboarding.completedSteps).toEqual([]);
  });

  it("saves step data and updates progress", async () => {
    await mockProfileApi.saveStep("u1", "business", {
      businessType: "business",
      legalName: "Travelmate Ltd",
      registrationNumber: "RC-123",
    });

    const onboarding = await mockProfileApi.getOnboarding("u1");
    expect(onboarding.completedSteps).toContain("business");
    expect(onboarding.status).toBe("in_progress");
  });

  it("requires all steps before submission", async () => {
    await mockProfileApi.saveStep("u1", "business", {
      businessType: "business",
      legalName: "Travelmate Ltd",
      registrationNumber: "RC-123",
    });

    await expect(mockProfileApi.submitOnboarding("u1")).rejects.toThrow(
      "Complete all onboarding steps before submission.",
    );
  });

  it("submits when all required steps are complete", async () => {
    await mockProfileApi.saveStep("u1", "business", {
      businessType: "business",
      legalName: "Travelmate Ltd",
      registrationNumber: "RC-123",
    });

    await mockProfileApi.saveStep("u1", "contact", {
      primaryContactName: "Amina",
      primaryContactEmail: "amina@example.com",
    });

    await mockProfileApi.saveStep("u1", "operations", {
      operatingCountries: ["Nigeria"],
      operatingRegions: ["Lagos"],
      operatingCities: ["Ikeja"],
      coverageNotes: "",
      payoutMethod: "bank_transfer",
      settlementCurrency: "NGN",
      payoutSchedule: "weekly",
    });

    const saved = await mockProfileApi.getOnboarding("u1");
    expect(saved.status).toBe("in_progress");

    const final = await mockProfileApi.submitOnboarding("u1");
    expect(final.status).toBe("completed");
    expect(final.completedSteps).toEqual(["business", "contact", "operations"]);
  });
});
