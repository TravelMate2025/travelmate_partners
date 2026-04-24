import type { OnboardingStepKey, PartnerProfileData } from "@/modules/profile/contracts";

const REQUIRED_BY_STEP: Record<OnboardingStepKey, Array<keyof PartnerProfileData>> = {
  business: ["businessType", "legalName", "registrationNumber"],
  contact: ["primaryContactName", "primaryContactEmail"],
  operations: [
    "operatingCountries",
    "operatingRegions",
    "operatingCities",
    "payoutMethod",
    "settlementCurrency",
    "payoutSchedule",
  ],
};

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

export function isStepComplete(step: OnboardingStepKey, data: PartnerProfileData) {
  return REQUIRED_BY_STEP[step].every((field) => hasValue(data[field]));
}

export function computeCompletedSteps(data: PartnerProfileData): OnboardingStepKey[] {
  const orderedSteps: OnboardingStepKey[] = ["business", "contact", "operations"];
  return orderedSteps.filter((step) => isStepComplete(step, data));
}

export function onboardingProgress(completedSteps: OnboardingStepKey[]) {
  return {
    completed: completedSteps.length,
    total: 3,
    percent: Math.round((completedSteps.length / 3) * 100),
  };
}
